import { useEffect, useRef } from 'react'
import FlipArt, { FLIP_BODY_PCT, FLIP_FOOT_PCT, FLIP_VIEW_W, poseFlip } from './FlipArt'
import { CHIP, FLAVOUR_CHIPS, R as BODY_R } from './flipGeometry'

/*
 * Flip, in the layout.
 *
 * Two earlier passes put him in a fixed overlay -- first loose over the page,
 * then parked in the right margin. Both floated on top of the design instead of
 * being part of it, which is why one was in the way and the other looked bolted
 * on. Nothing here is fixed-position. A FlipSpot is an ordinary absolutely
 * positioned child of a section: it scrolls with the page, sits inside the
 * composition, is occluded by whatever paints over it, and occupies space the
 * section's own layout already left empty.
 *
 * He has three places on this site, each a different relationship with real
 * page furniture rather than the same sticker moved around:
 *
 *   wave   He walks the sunshine WaveDivider that closes the dark why-panel.
 *          Not near it -- on it: the path below is the exact curve that
 *          component draws, so he tracks its crests and takes his lean from
 *          its slope. Stride is locked to the distance he actually covers, so
 *          his feet never skate on it.
 *
 *   float  Adrift inside the pouch on the pinned flavour stage, rocking with
 *          the stage's own progress and re-seasoning as the flavour changes.
 *
 *   peek   Tucked behind the testimonials panel with his hands on its rim.
 *          He is a previous sibling of the panel, so the panel's own border and
 *          background hide his bottom half -- the occlusion is real depth, not
 *          a drawn mask.
 *
 * Each spot only runs while it is on screen, and each drives its own frame from
 * where the page has scrolled it to, so nothing animates off in a corner.
 */

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
const approach = (dt, rate) => 1 - Math.exp(-dt * rate)

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]
const rgbOf = (c) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`
const TINT_KEYS = ['base', 'lattice', 'rim', 'dust', 'dustDark']
const TINT_VARS = ['--flip-base', '--flip-lattice', '--flip-rim', '--flip-dust', '--flip-dust-dark']

/**
 * The exact curve Primitives' WaveDivider draws, as its three cubic segments.
 * Walking it by parameter rather than by x means he tracks the real path and
 * can take his lean straight from its slope.
 */
const WAVE = [
  [[0, 40], [180, 90], [320, 0], [480, 38]],
  [[480, 38], [640, 76], [800, 8], [960, 42]],
  [[960, 42], [1120, 76], [1280, 18], [1440, 48]],
]
const WAVE_W = 1440
const WAVE_H = 90

function onWave(p) {
  const u = clamp(p, 0, 1) * WAVE.length
  const i = Math.min(WAVE.length - 1, Math.floor(u))
  const t = u - i
  const seg = WAVE[i]
  const v = 1 - t
  const b = [v * v * v, 3 * v * v * t, 3 * v * t * t, t * t * t]
  const d = [-3 * v * v, 3 * v * v - 6 * v * t, 6 * v * t - 3 * t * t, 3 * t * t]
  let x = 0
  let y = 0
  let dx = 0
  let dy = 0
  for (let k = 0; k < 4; k += 1) {
    x += b[k] * seg[k][0]
    y += b[k] * seg[k][1]
    dx += d[k] * seg[k][0]
    dy += d[k] * seg[k][1]
  }
  return { x, y, dx, dy }
}

// Which point of the drawing the spot's CSS position refers to, as a
// percentage of the art box. Walking, he hangs off his feet; adrift, his body
// centre; peeking, the line his hands rest on, so a spot at top:0 puts his
// hands exactly on the edge he is behind.
const ANCHOR = {
  // The sole of the foot rather than its centre, then a few units deeper
  // again: contact reads better than clearance, and his breathing would
  // otherwise lift him off the surface.
  wave: ((185 + 157 + 15 - 6) / 400) * 100,
  float: FLIP_BODY_PCT,
  peek: ((185 + 45) / 400) * 100,
  // Grounded like `wave`, but he isn't walking a path here -- he just stands
  // his ground beside the hero pack.
  hero: FLIP_FOOT_PCT,
}

/**
 * One placement.
 *
 *   mode      'wave' | 'float' | 'peek' | 'hero'
 *   width     CSS width for the art (its body is ~0.4 of this)
 *   tint      flavour slug to season to, or null for the plain chip
 *   emote     'hero' mode only -- 'delighted' | 'cheeky' | 'shocked', one per
 *             flavour; unset falls back to the plain wave-and-bounce greeting
 *   progress  optional () => 0..1 for modes that ride a parent's own scroll
 *   heat      optional () => 0..1 (or a number): how hot he is. Opens his
 *             mouth and sets him trembling as it climbs, and takes over from
 *             the hero emote -- the product page's heat climb drives it
 *   chompAt   optional timestamp (Date.now()); for ~0.7s after it he chomps,
 *             which is how the product page has him bite on Add to cart
 *   style     ordinary CSS placing the spot inside its section
 */
export default function FlipSpot({
  mode = 'peek',
  width,
  tint = null,
  emote = null,
  progress,
  heat,
  chompAt,
  style,
  className = '',
}) {
  const host = useRef(null)
  const hook = useRef(null)
  const parts = useRef({})
  const live = useRef({ tint, progress, emote, heat, chompAt })
  live.current = { tint, progress, emote, heat, chompAt }

  useEffect(() => {
    const node = host.current
    const peg = hook.current
    const art = parts.current
    if (!node || !peg || !art.body) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // --- state ---------------------------------------------------------------
    let clock = 0
    let phase = 0
    let facing = 1
    let facingTo = 1
    let rot = -3
    let walk = 0
    let rush = 0
    let blink = 1
    let nextBlink = 1.6 + Math.random() * 3
    const look = [3, 2]
    let lastX = null
    let pointer = null
    // His stride is measured against his own body width, so cache it rather
    // than asking the layout for it every frame.
    let bodyPx = 28
    // Where this spot sits, cached. Only the page's own layout moves it, so
    // reading it every frame would mean a layout flush every frame for a number
    // that almost never changes. Caching docTop lets the loop work off scrollY.
    let box = { docTop: 0, left: 0, w: 0, h: 0 }
    let measuredAt = 0
    const sizeUp = () => {
      const r = node.getBoundingClientRect()
      box = { docTop: r.top + window.scrollY, left: r.left, w: r.width, h: r.height }
      const svg = node.querySelector('svg')
      bodyPx = (BODY_R / FLIP_VIEW_W) * (svg ? svg.getBoundingClientRect().width : 140)
    }
    sizeUp()
    window.addEventListener('resize', sizeUp, { passive: true })

    const chip = TINT_KEYS.map((k) => hex(CHIP[k]))
    const chipTo = chip.map((c) => c.slice())
    const paint = () => TINT_VARS.forEach((v, i) => node.style.setProperty(v, rgbOf(chip[i])))
    paint()

    const onPointer = (e) => {
      pointer = [e.clientX, e.clientY]
    }
    if (!reduce) window.addEventListener('pointermove', onPointer, { passive: true })

    // Only run while he is actually on screen. Off screen he costs nothing.
    let onscreen = false
    const io = new IntersectionObserver(
      ([e]) => {
        onscreen = e.isIntersecting
        if (onscreen && !raf && !reduce) {
          last = performance.now()
          raf = requestAnimationFrame(frame)
        }
      },
      { rootMargin: '120px 0px' }
    )
    io.observe(node)

    const heatOf = () => {
      const h = live.current.heat
      if (h == null) return null
      return clamp(typeof h === 'function' ? h() : h, 0, 1)
    }

    /** Where this spot has been scrolled to: 0 entering, 1 leaving. */
    function ownProgress(top) {
      const vh = window.innerHeight
      return clamp((vh - top) / (vh + box.h), 0, 1)
    }

    function season(dt) {
      const want = (live.current.tint && FLAVOUR_CHIPS[live.current.tint]) || CHIP
      TINT_KEYS.forEach((key, i) => {
        chipTo[i] = hex(want[key])
      })
      const k = approach(dt, 4.5)
      let moved = false
      chip.forEach((c, i) => {
        for (let j = 0; j < 3; j += 1) {
          const d = chipTo[i][j] - c[j]
          if (Math.abs(d) > 0.4) moved = true
          c[j] += d * k
        }
      })
      if (moved) paint()
    }

    let raf = 0
    let last = performance.now()

    const frame = (now) => {
      if (!onscreen) {
        raf = 0
        return
      }
      raf = requestAnimationFrame(frame)
      const dt = clamp((now - last) / 1000, 1 / 240, 1 / 20)
      last = now
      clock += dt

      // A sticky ancestor can carry this spot around without anything
      // resizing, so refresh the cache on a slow tick as well as on resize.
      if (now - measuredAt > 260) {
        measuredAt = now
        sizeUp()
      }
      const top = box.docTop - window.scrollY
      const p = live.current.progress ? clamp(live.current.progress(), 0, 1) : ownProgress(top)
      // Heat replaces the mode's own rush rather than competing with it, so
      // remember where rush started this frame.
      const rushBefore = rush

      if (mode === 'wave') {
        // His feet land on the real curve, and his lean is its real slope --
        // corrected for the divider being drawn with preserveAspectRatio="none",
        // which squashes y against x.
        const at = onWave(p)
        const px = (at.x / WAVE_W) * box.w
        const py = (at.y / WAVE_H) * box.h
        peg.style.left = `${px.toFixed(1)}px`
        peg.style.top = `${py.toFixed(1)}px`

        const slope = Math.atan2((at.dy / WAVE_H) * box.h, (at.dx / WAVE_W) * box.w)
        const lean = clamp((slope * 180) / Math.PI, -15, 15)

        // Stride advances by ground actually covered, so his feet never skate.
        const travelled = lastX === null ? 0 : px - lastX
        lastX = px
        phase += (travelled / Math.max(12, bodyPx * 1.15)) * Math.PI
        const pace = Math.abs(travelled) / dt
        walk += ((pace > 6 ? 1 : 0) - walk) * approach(dt, 8)
        rush += (clamp(pace / 900, 0, 1) - rush) * approach(dt, 7)
        if (Math.abs(travelled) > 0.2) facingTo = travelled > 0 ? 1 : -1
        facing += (facingTo - facing) * approach(dt, 9)
        rot += (lean * facing + -2 - rot) * approach(dt, 8)
      } else if (mode === 'float') {
        // A chip adrift in a bag being tipped: the rock is scroll position,
        // so it holds still when the reader does.
        walk += (0 - walk) * approach(dt, 6)
        rush += (0 - rush) * approach(dt, 6)
        rot += (Math.sin(p * Math.PI * 4) * 13 - 3 - rot) * approach(dt, 3.5)
      } else if (mode === 'hero') {
        // Stands his ground beside the hero pack -- he never walks anywhere
        // here, so `walk` stays off. Each flavour gets its own reaction:
        // 'shocked' pulses rush to borrow the rig's own open-mouth/speed-dart
        // threshold, the rest just vary the tilt.
        walk += (0 - walk) * approach(dt, 6)
        const heroEmote = live.current.emote
        if (heroEmote === 'shocked') {
          const targetRush = 0.25 + 0.55 * Math.max(0, Math.sin(clock * 1.8))
          rush += (targetRush - rush) * approach(dt, 5)
          rot += (Math.sin(clock * 2.4) * 5 - 5 - rot) * approach(dt, 4)
        } else if (heroEmote === 'cheeky') {
          rush += (0 - rush) * approach(dt, 6)
          rot += (Math.sin(clock * 1.7) * 9 - 3 - rot) * approach(dt, 3)
        } else {
          rush += (0 - rush) * approach(dt, 6)
          rot += (Math.sin(clock * 1.15) * 6 - 3 - rot) * approach(dt, 3)
        }
      } else {
        walk += (0 - walk) * approach(dt, 6)
        rush += (0 - rush) * approach(dt, 6)
        rot += (Math.sin(clock * 0.9) * 2.5 - 2 - rot) * approach(dt, 3)
      }

      // Heat, when a parent supplies it, outranks the mode's own mood: rush
      // opens the mouth past 0.5, and a tremble grows with it.
      const heatNow = heatOf()
      if (heatNow != null) {
        rush = rushBefore + (heatNow * 0.95 - rushBefore) * approach(dt, 5)
        rot += (Math.sin(clock * 21) * 5 * heatNow * heatNow - 3 - rot) * approach(dt, 9)
      }

      // --- face ---------------------------------------------------------------
      nextBlink -= dt
      if (nextBlink < 0) {
        blink = 0
        nextBlink = 2.2 + Math.random() * 3.6
      }
      blink += (1 - blink) * approach(dt, 17)

      let lookTo
      if (walk > 0.35) {
        lookTo = [7 * facing, 1]
      } else if (pointer) {
        const cx = box.left + box.w / 2
        const cy = top + box.h / 2
        const m = Math.max(1, Math.hypot(pointer[0] - cx, pointer[1] - cy))
        lookTo = [((pointer[0] - cx) / m) * 9 * (facing >= 0 ? 1 : -1), ((pointer[1] - cy) / m) * 8]
      } else {
        lookTo = [3, 2]
      }
      const lk = approach(dt, 6)
      look[0] += (lookTo[0] - look[0]) * lk
      look[1] += (lookTo[1] - look[1]) * lk

      season(dt)

      // Each hero emote borrows a different lever of the same rig instead of
      // needing its own drawing: 'cheeky' leans on the wave arm (which is
      // also what flips the mouth to a grin), 'shocked' leans on rush (which
      // is also what flips the mouth open and lights the speed darts), and
      // 'delighted' adds a solo wink via blinkR. Anything else -- the plain
      // hero cameo -- keeps the original steady wave-and-bounce.
      let heroWave = 0
      let heroSquash = 0
      let blinkR = blink
      if (mode === 'hero' && heatNow == null) {
        const heroEmote = live.current.emote
        if (heroEmote === 'cheeky') {
          heroWave = 0.85 + 0.15 * Math.sin(clock * 2)
          heroSquash = 0.07 * Math.sin(clock * 2.2)
        } else if (heroEmote === 'shocked') {
          heroSquash = -0.09 * Math.max(0, Math.sin(clock * 1.8))
        } else if (heroEmote === 'delighted') {
          heroSquash = 0.045 * Math.sin(clock * 1.2)
          const winkPhase = clock % 3.4
          const winkAmt = winkPhase < 0.22 ? Math.sin((winkPhase / 0.22) * Math.PI) : 0
          blinkR = Math.max(0.08, blink - winkAmt * 0.9)
        } else {
          heroWave = 0.55 + 0.45 * Math.sin(clock * 1.4)
          heroSquash = 0.045 * Math.sin(clock * 1.2)
        }
      }

      // A chomp: jaw shut for most of it, with a squash on each bite.
      const since = live.current.chompAt ? (Date.now() - live.current.chompAt) / 1000 : 9
      const chomping = since >= 0 && since < 0.7
      if (chomping) heroSquash += 0.1 * Math.abs(Math.sin(since * 22))

      poseFlip(art, {
        phase,
        time: clock,
        facing,
        rot,
        rush,
        walk,
        roll: 0,
        darts: 0,
        wave: chomping ? 0 : heroWave,
        chomp: chomping ? 1 : 0,
        squash: heroSquash,
        blink,
        blinkR,
        look,
        peek: mode === 'peek' ? 1 : 0,
      })
    }

    // Reduced motion: he is still part of the composition, just held still.
    if (reduce) {
      if (mode === 'wave') {
        const at = onWave(0.5)
        peg.style.left = `${((at.x / WAVE_W) * box.w).toFixed(1)}px`
        peg.style.top = `${((at.y / WAVE_H) * box.h).toFixed(1)}px`
      }
      const staticEmote = mode === 'hero' ? live.current.emote : null
      const staticWave = staticEmote === 'cheeky' ? 0.9 : staticEmote == null && mode === 'hero' ? 0.4 : 0
      const staticRush = staticEmote === 'shocked' ? 0.6 : 0
      poseFlip(art, {
        phase: 0, time: 0, facing: 1, rot: -3, rush: staticRush, walk: 0, roll: 0,
        darts: 0, wave: staticWave, chomp: 0, squash: 0, blink: 1, look: [3, 2],
        peek: mode === 'peek' ? 1 : 0,
      })
      season(1)
      return () => {
        io.disconnect()
        window.removeEventListener('resize', sizeUp)
      }
    }

    raf = requestAnimationFrame(frame)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', sizeUp)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [mode])

  const anchor = ANCHOR[mode] ?? FLIP_BODY_PCT

  return (
    <div ref={host} aria-hidden="true" className={className} style={{ position: 'absolute', ...style }}>
      <div ref={hook} style={{ position: 'absolute', left: 0, top: 0, willChange: 'transform' }}>
        <FlipArt
          partsRef={parts}
          style={{
            display: 'block',
            width,
            transform: `translate(-50%, -${anchor.toFixed(2)}%)`,
            overflow: 'visible',
            filter: 'drop-shadow(4px 5px 0 rgba(13,40,24,0.18))',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}
