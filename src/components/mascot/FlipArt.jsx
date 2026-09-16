import {
  BODY,
  BODY_INNER,
  LATTICE,
  SPECKLES,
  INK,
  TEAL,
  CORAL,
  KEY,
  LIMB,
} from './flipGeometry'

/*
 * Flip, as a rig.
 *
 * design/mascot/flip-v1.png is the approved sheet: four poses drawn by
 * tools/build-mascot.py. This is the same chip with the poses taken out and
 * joints put in, so the page can hold him in any of them — and every state
 * between — a frame at a time.
 *
 * The parts that never move (the scalloped rim, the waffle press, the seasoning
 * scatter) come straight out of that script via flipGeometry.js, so the chip
 * here and the chip on the sheet are the same drawing. What moves is only what
 * a puppet would move: two arms, two legs, two eyes, a mouth, and the speed
 * darts behind him.
 *
 * Colour is deferred to five custom properties on the wrapper, so the companion
 * can re-season him between flavours by interpolating them rather than swapping
 * sprites:
 *
 *   --flip-base --flip-lattice --flip-rim --flip-dust --flip-dust-dark
 *
 * Nothing here reads the DOM or the clock. `poseFlip` is the only writer, and
 * it writes attributes directly — this component never re-renders after mount.
 */

const DEG = Math.PI / 180
const lerp = (a, b, t) => a + (b - a) * t

// Joint anchors, in the sheet's units: body radius 95, origin at its centre.
const SHOULDER_L = [-80, 8]
const SHOULDER_R = [80, -2]
const HIP_L = [-36, 82]
const HIP_R = [32, 84]
const GROUND = 157 // where the feet rest in the idle pose
const SPLAY_L = -16 // feet stand a little wider than the hips
const SPLAY_R = 18
const EYE_L = [-36, -22, 26] // cx, cy, r
const EYE_R = [33, -25, 24]

// Sized so the drawing survives every pose, including the darts trailing off to
// the left and the arms thrown wide in a tumble.
export const FLIP_VIEWBOX = '-235 -185 470 400'
export const FLIP_VIEW_W = 470
// Where the feet and the body's centre sit in that box, as percentages of its
// height -- the companion hangs him off one or the other depending on whether
// he is standing on something or riding something.
export const FLIP_FOOT_PCT = ((GROUND + 185) / 400) * 100
export const FLIP_BODY_PCT = (185 / 400) * 100

// Speed darts: the brand's own mark, from public/assets/doodles/Asset_4.png.
// x, y, length, thickness, rotation — three trailing off his back.
const DARTS = [
  [-168, -30, 64, 14, 176],
  [-184, 20, 88, 16, 183],
  [-156, 70, 58, 13, 193],
]

function dartPath(len, thick) {
  const t = thick * 0.34
  return `M0,${-thick} L${len},${-t.toFixed(1)} L${len},${t.toFixed(1)} L0,${thick} Z`
}

const MOUTHS = {
  grin: { d: 'M-30,26 Q0,58 32,24', fill: 'none', width: 7, inner: '', innerFill: 'none' },
  smile: { d: 'M-19,30 Q0,46 21,29', fill: 'none', width: 6.5, inner: '', innerFill: 'none' },
  open: {
    d: 'M-24,22 Q0,20 24,22 Q22,58 0,58 Q-22,58 -24,22 Z',
    fill: INK,
    width: 5,
    inner: 'M-12,46 Q0,38 12,46 Q10,57 0,57 Q-10,57 -12,46 Z',
    innerFill: CORAL,
  },
  chomp: {
    d: 'M-26,20 Q0,16 26,20 Q24,54 0,54 Q-24,54 -26,20 Z',
    fill: INK,
    width: 5,
    inner: 'M-18,20 l6,11 l7,-11 l7,11 l7,-11 l7,11 l6,-11 Z',
    innerFill: '#ffffff',
  },
}

/** A limb: a quadratic from the joint out to `reach`, bowed by `bend`. */
function limb(from, angle, reach, bend) {
  const a = angle * DEG
  const b = (angle + bend) * DEG
  const ex = from[0] + Math.cos(a) * reach
  const ey = from[1] + Math.sin(a) * reach
  const cx = from[0] + Math.cos(b) * reach * 0.62
  const cy = from[1] + Math.sin(b) * reach * 0.62
  return {
    d: `M${from[0]},${from[1]} Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`,
    x: ex,
    y: ey,
  }
}

/**
 * One leg of the walk cycle. `theta` runs a full stride per 2π: the foot swings
 * forward over the half where sin is positive and is planted for the other
 * half, which is what stops the feet skating when the body moves.
 */
function leg(hip, splay, theta, stride, lift, ground) {
  // The foot is planted from the front of the stride round to the back and
  // lifts on the way forward again -- which is the half where sin is negative.
  // Lifting on the other half is a moonwalk.
  const up = Math.max(0, -Math.sin(theta))
  const fx = hip[0] + splay + stride * Math.cos(theta)
  const fy = ground - up * lift
  const kx = hip[0] + (fx - hip[0]) * 0.5 + splay * 0.3
  const ky = (hip[1] + fy) / 2 + 12 - up * 9
  return {
    d: `M${hip[0]},${hip[1]} Q${kx.toFixed(1)},${ky.toFixed(1)} ${fx.toFixed(1)},${fy.toFixed(1)}`,
    x: fx,
    y: fy,
    rot: (splay > 0 ? 8 : -8) - (stride / 30) * 15 * Math.cos(theta),
  }
}

const setXY = (el, x, y) => {
  el.setAttribute('cx', x.toFixed(1))
  el.setAttribute('cy', y.toFixed(1))
}

/**
 * Write one frame. `pose` is plain numbers from the companion — no state of its
 * own, so any pose is reachable from any other and every blend between two of
 * them is a valid drawing:
 *
 *   phase    stride phase in radians, advanced by distance travelled
 *   time     seconds, for the parts that idle on a clock (breath, wave)
 *   facing   -1..1, the mirror; passing through 0 reads as turning round
 *   rot      body rotation, degrees
 *   rush     0..1, how hard he is going — scales stride, lean and darts
 *   walk     0..1, how much of the walk cycle is showing
 *   roll     0..1, how tumbled he is
 *   wave     0..1, right arm up
 *   chomp    0..1, a bite in progress
 *   squash   extra vertical squash; negative is flatter
 *   blink    1 open, 0 shut
 *   look     [x, y] pupil offset, body units
 *   darts    0..1 ceiling on the speed marks; 0 keeps them off entirely
 *   peek     0..1, both hands up onto a ledge -- the sheet's Peek pose, used
 *            when he is tucked behind a real panel and only his top shows
 */
export function poseFlip(p, pose) {
  const { phase, time, rush, walk, roll, wave, chomp, blink } = pose

  // --- breath, bob, squash --------------------------------------------------
  const breath = Math.sin(time * 1.7)
  const calm = (1 - rush) * (1 - roll)
  const step = Math.abs(Math.sin(phase)) * walk
  const bob = -2.1 * breath * calm - 6 * step
  const sy = 1 + 0.022 * breath * calm + pose.squash
  const sx = 1 - 0.016 * breath * calm - pose.squash * 0.7

  p.body.setAttribute(
    'transform',
    `rotate(${pose.rot.toFixed(2)}) translate(0,${bob.toFixed(2)}) scale(${sx.toFixed(4)},${sy.toFixed(4)})`
  )
  p.mirror.setAttribute('transform', `scale(${pose.facing.toFixed(3)},1)`)

  // --- arms -----------------------------------------------------------------
  // Rest is the sheet's idle. Walking alternates them — one thrown out while
  // the other hangs — a wave takes the right one up, a tumble throws both wide.
  const swing = (30 + 24 * rush) * Math.cos(phase) * walk
  const sway = 4 * breath * (1 - walk)
  let angL = 118 + swing + sway
  let angR = 62 + swing + sway
  let reachL = 80 + 8 * rush
  let reachR = reachL

  angR = lerp(angR, -58 + 15 * Math.sin(time * 12), wave)
  reachR = lerp(reachR, 96, wave)

  angL = lerp(angL, 152 + 8 * Math.sin(time * 9), roll)
  angR = lerp(angR, 28 - 8 * Math.sin(time * 9), roll)
  reachL = lerp(reachL, 94, roll)
  reachR = lerp(reachR, 94, roll)

  // Peek: hands come up and out to rest on the edge he is hiding behind.
  const peek = pose.peek ?? 0
  angL = lerp(angL, 128, peek)
  angR = lerp(angR, 52, peek)
  reachL = lerp(reachL, 46, peek)
  reachR = lerp(reachR, 46, peek)

  const armL = limb(SHOULDER_L, angL, reachL, -26)
  const armR = limb(SHOULDER_R, angR, reachR, 26)
  p.armL.setAttribute('d', armL.d)
  p.armR.setAttribute('d', armR.d)
  setXY(p.handL, armL.x, armL.y)
  setXY(p.handR, armR.x, armR.y)

  // --- legs -----------------------------------------------------------------
  const stride = (30 + 24 * rush) * walk * (1 - roll)
  const lift = (20 + 24 * rush) * walk * (1 - roll)
  const legL = leg(HIP_L, lerp(SPLAY_L, -30, roll), phase, stride, lift, lerp(GROUND, 120, roll))
  const legR = leg(HIP_R, lerp(SPLAY_R, 32, roll), phase + Math.PI, stride, lift, lerp(GROUND, 122, roll))
  p.legL.setAttribute('d', legL.d)
  p.legR.setAttribute('d', legR.d)
  setXY(p.footL, legL.x, legL.y)
  setXY(p.footR, legR.x, legR.y)
  p.footL.setAttribute('transform', `rotate(${legL.rot.toFixed(1)} ${legL.x.toFixed(1)} ${legL.y.toFixed(1)})`)
  p.footR.setAttribute('transform', `rotate(${legR.rot.toFixed(1)} ${legR.x.toFixed(1)} ${legR.y.toFixed(1)})`)

  // --- face -----------------------------------------------------------------
  const [lx, ly] = pose.look
  const pupil = `translate(${lx.toFixed(1)},${ly.toFixed(1)})`
  p.pupilL.setAttribute('transform', pupil)
  p.pupilR.setAttribute('transform', pupil)
  const shut = Math.max(0.06, blink).toFixed(3)
  p.eyeL.setAttribute('transform', `translate(${EYE_L[0]},${EYE_L[1]}) scale(1,${shut}) translate(${-EYE_L[0]},${-EYE_L[1]})`)
  p.eyeR.setAttribute('transform', `translate(${EYE_R[0]},${EYE_R[1]}) scale(1,${shut}) translate(${-EYE_R[0]},${-EYE_R[1]})`)

  const shape =
    chomp > 0.5 ? 'chomp' : roll > 0.4 || rush > 0.5 ? 'open' : wave > 0.4 ? 'grin' : 'smile'
  if (p.mouthShape !== shape) {
    p.mouthShape = shape
    const m = MOUTHS[shape]
    p.mouth.setAttribute('d', m.d)
    p.mouth.setAttribute('fill', m.fill)
    p.mouth.setAttribute('stroke-width', m.width)
    p.mouthInner.setAttribute('d', m.inner)
    p.mouthInner.setAttribute('fill', m.innerFill)
  }

  // --- darts ----------------------------------------------------------------
  const dart = Math.max(0, (rush - 0.4) / 0.6) * (pose.darts ?? 1)
  p.darts.setAttribute('opacity', dart.toFixed(3))
  if (dart > 0) {
    p.darts.setAttribute('transform', `translate(${(-24 * dart).toFixed(1)},0) scale(${(0.66 + 0.34 * dart).toFixed(3)},1)`)
  }
}

/** The rig's markup. `partsRef` collects the nodes `poseFlip` writes to. */
export default function FlipArt({ partsRef, className = '', style }) {
  const set = (key) => (node) => {
    if (!partsRef.current) partsRef.current = {}
    partsRef.current[key] = node
  }

  return (
    <svg viewBox={FLIP_VIEWBOX} className={className} style={style} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="flip-body-clip">
          <path d={BODY} />
        </clipPath>
      </defs>

      <g ref={set('mirror')}>
        <g ref={set('body')}>
          {/* Speed darts, behind everything. */}
          <g ref={set('darts')} opacity="0">
            {DARTS.map(([x, y, len, thick, rot], i) => (
              <path
                key={i}
                d={dartPath(len, thick)}
                fill={TEAL}
                stroke={INK}
                strokeWidth="4"
                strokeLinejoin="round"
                transform={`translate(${x} ${y}) rotate(${rot})`}
              />
            ))}
          </g>

          <path ref={set('armL')} fill="none" stroke={INK} strokeWidth={LIMB} strokeLinecap="round" />
          <path ref={set('armR')} fill="none" stroke={INK} strokeWidth={LIMB} strokeLinecap="round" />
          <path ref={set('legL')} fill="none" stroke={INK} strokeWidth={LIMB + 1} strokeLinecap="round" />
          <path ref={set('legR')} fill="none" stroke={INK} strokeWidth={LIMB + 1} strokeLinecap="round" />

          {/* The chip: rim, waffle press, seasoning — then the keyline back on
              top of both so it stays crisp. */}
          <path d={BODY} style={{ fill: 'var(--flip-base)' }} stroke={INK} strokeWidth={KEY} strokeLinejoin="round" />
          <g
            clipPath="url(#flip-body-clip)"
            style={{ stroke: 'var(--flip-lattice)' }}
            strokeWidth="4.5"
            strokeLinecap="round"
            opacity="0.5"
          >
            {LATTICE.map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
            ))}
          </g>
          <g clipPath="url(#flip-body-clip)">
            {SPECKLES.map(([cx, cy, r, op, rot, dark], i) => (
              <ellipse
                key={i}
                cx={cx}
                cy={cy}
                rx={r}
                ry={r * 0.7}
                opacity={op}
                transform={`rotate(${rot} ${cx} ${cy})`}
                style={{ fill: dark ? 'var(--flip-dust-dark)' : 'var(--flip-dust)' }}
              />
            ))}
          </g>
          <path d={BODY_INNER} fill="none" style={{ stroke: 'var(--flip-rim)' }} strokeWidth="3.5" opacity="0.55" />
          <path d={BODY} fill="none" stroke={INK} strokeWidth={KEY} strokeLinejoin="round" />

          <circle ref={set('handL')} r="18" style={{ fill: 'var(--flip-base)' }} stroke={INK} strokeWidth="5" />
          <circle ref={set('handR')} r="18" style={{ fill: 'var(--flip-base)' }} stroke={INK} strokeWidth="5" />
          <ellipse ref={set('footL')} rx="26" ry="15" style={{ fill: 'var(--flip-base)' }} stroke={INK} strokeWidth="5" />
          <ellipse ref={set('footR')} rx="26" ry="15" style={{ fill: 'var(--flip-base)' }} stroke={INK} strokeWidth="5" />

          {/* The site's googly eyes — the same motif FlavourGrid puts on packs. */}
          <g ref={set('eyeL')}>
            <circle cx={EYE_L[0]} cy={EYE_L[1]} r={EYE_L[2]} fill="#ffffff" stroke={INK} strokeWidth="5.5" />
            <circle ref={set('pupilL')} cx={EYE_L[0]} cy={EYE_L[1]} r={EYE_L[2] * 0.42} fill={INK} />
          </g>
          <g ref={set('eyeR')}>
            <circle cx={EYE_R[0]} cy={EYE_R[1]} r={EYE_R[2]} fill="#ffffff" stroke={INK} strokeWidth="5.5" />
            <circle ref={set('pupilR')} cx={EYE_R[0]} cy={EYE_R[1]} r={EYE_R[2] * 0.42} fill={INK} />
          </g>

          <path ref={set('mouth')} stroke={INK} strokeLinecap="round" strokeLinejoin="round" />
          <path ref={set('mouthInner')} />
        </g>
      </g>
    </svg>
  )
}
