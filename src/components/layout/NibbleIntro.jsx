import { useEffect, useRef } from 'react'
import {
  VIEWBOX,
  PATHS,
  BOXES,
  JUST_IDS,
  NIBBLE_IDS,
  IT_IDS,
  CRUMB_IDS,
  UNBITTEN_B,
  BITE,
} from '../icons/Wordmark'
import { doodleComponents } from '../icons/PackDoodles'

/*
 * "The Nibble" — the first-load intro.
 *
 * The three words drop in, then an unseen mouth takes the bite out of the second
 * B: the whole B swaps for the bitten one, the chunk tumbles away, the crumbs
 * burst and settle into their real positions in the logo, the ground flips to
 * jalapeño green out of the bite, and doodles burst from behind. Finally the
 * overlay collapses into the site header, the lockup landing exactly on the
 * header logo.
 *
 * Two implementation notes:
 *
 * - Driven by the Web Animations API rather than framer-motion. The timeline
 *   needs per-segment easing, clip-path interpolation, and a single skip that
 *   finishes every animation at once; WAAPI expresses that directly and never
 *   re-renders React while it plays.
 * - The wordmark is drawn TWICE, dark under cream, with the cream copy clipped
 *   to a circle growing out of the bite. That inverts the ink exactly along the
 *   green wavefront. Cross-fading the fill instead lands on muddy greys.
 *
 * The page renders underneath this overlay the whole time, so content, LCP and
 * crawlers are never gated behind the animation.
 */

// Flip to true to show the intro only once per visitor. Left off so the intro
// plays on every load while it is being reviewed. ?intro=1 / ?intro=0 override.
const SHOW_ONCE = false
const SEEN_KEY = 'jni-intro-seen'

// Decided once per page load, at module scope. StrictMode double-invokes
// effects in dev (mount -> cleanup -> mount); deciding inside the effect would
// mark the intro seen on the first pass and then suppress it on the second, so
// with SHOW_ONCE on it would never play in dev.
let playDecision = null

function shouldPlay() {
  const forced = new URLSearchParams(window.location.search).get('intro')
  if (forced === '1') return true
  if (forced === '0') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (!SHOW_ONCE) return true
  try {
    if (window.localStorage.getItem(SEEN_KEY) === '1') return false
    window.localStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* private mode — the intro simply plays again next time */
  }
  return true
}

const CREAM = '#fbf6d0'
const INK = '#231f20'
const GREEN = '#0b5c2e'
const HEADER_DARK = '#071A16' // matches SiteHeader's bar

const T = {
  dur: 380,
  just: 20,
  nibble: 170,
  it: 320,
  chomp: 1020,
  shake: 280,
  biteFly: 480,
  crumbs: 840,
  flip: 380,
  doodle: 780,
  collapse: 1900,
  collapseDur: 520,
}
const TOTAL = T.collapse + T.collapseDur

// angle°, distance vw, size px, spin°, doodle name
const BURST = [
  [-70, 44, 150, 210, 'chilli-whole'],
  [-22, 50, 120, -260, 'chilli-slice'],
  [14, 46, 160, 190, 'chilli-half'],
  [56, 39, 130, -220, 'pepper-section'],
  [100, 47, 145, 240, 'jalapeno'],
  [146, 42, 115, -180, 'chilli-slice'],
  [-122, 45, 138, 200, 'chilli-half'],
  [-164, 40, 122, -230, 'pepper-section'],
  [-44, 30, 52, 300, 'seed'],
  [76, 33, 46, -320, 'seed'],
  [130, 27, 40, 280, 'seed'],
  [-98, 31, 48, -300, 'seed'],
  [34, 24, 44, 260, 'seed'],
  [-146, 22, 38, -280, 'seed'],
]

const [VB_W, VB_H] = VIEWBOX.split(' ').slice(2).map(Number)
// The bite, as a percentage of the logo box. Everything in the crunch radiates
// from here.
const BX = ((BOXES[BITE][0] + BOXES[BITE][2]) / 2 / VB_W) * 100
const BY = ((BOXES[BITE][1] + BOXES[BITE][3]) / 2 / VB_H) * 100

/** transform-origin at a piece's bottom centre, in % of the logo box. */
function pivot(ids) {
  const bs = ids.map((id) => BOXES[id])
  const x0 = Math.min(...bs.map((b) => b[0]))
  const x1 = Math.max(...bs.map((b) => b[2]))
  const y1 = Math.max(...bs.map((b) => b[3]))
  return `${(((x0 + x1) / 2 / VB_W) * 100).toFixed(2)}% ${((y1 / VB_H) * 100).toFixed(2)}%`
}

function Piece({ ids, ...rest }) {
  return (
    <svg viewBox={VIEWBOX} aria-hidden="true" {...rest}>
      {ids.map((id) => (
        <path key={id} d={PATHS[id]} fill="inherit" fillRule="evenodd" />
      ))}
    </svg>
  )
}

/** One full stack of the wordmark, with the bitten B kept separate. */
function LogoCopy() {
  const layer = { position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Piece ids={JUST_IDS} data-p="just" style={{ ...layer, transformOrigin: pivot(JUST_IDS) }} />
      <div data-p="nibble" style={{ position: 'absolute', inset: 0, transformOrigin: pivot(NIBBLE_IDS) }}>
        <Piece ids={NIBBLE_IDS.filter((id) => id !== 'b2')} style={layer} />
        <Piece ids={[UNBITTEN_B]} data-p="bWhole" style={layer} />
        <Piece ids={['b2']} data-p="bBitten" style={{ ...layer, opacity: 0 }} />
        <Piece ids={[BITE]} data-p="bite" style={{ ...layer, opacity: 0 }} />
      </div>
      <Piece ids={IT_IDS} data-p="it" style={{ ...layer, transformOrigin: pivot(IT_IDS) }} />
      <Piece ids={CRUMB_IDS} data-p="crumbs" style={{ ...layer, opacity: 0 }} />
    </div>
  )
}

export default function NibbleIntro() {
  const shake = useRef(null)
  const stage = useRef(null)
  const flip = useRef(null)
  const burst = useRef(null)
  const logo = useRef(null)
  const cream = useRef(null)

  // Decided during render, not in the effect: effects run after the first
  // paint, so gating there would flash a full-screen cream overlay at anyone
  // who should not be seeing the intro at all.
  if (playDecision === null) playDecision = shouldPlay()

  useEffect(() => {
    const root = shake.current
    if (!root || !playDecision) return

    const anims = []
    const q = (sel) => Array.from(root.querySelectorAll(sel))
    const add = (els, kf, opt) =>
      [els].flat().forEach((el) => el && anims.push(el.animate(kf, { fill: 'both', ...opt })))
    const fwd = (els, kf, opt) => add(els, kf, { ...opt, fill: 'forwards' })

    // --- the three words drop in, from above the viewport, at full ink -------
    const drop = [
      {
        transform: 'translateY(-70vh) scaleX(0.92) scaleY(1.16)',
        offset: 0,
        easing: 'cubic-bezier(.42,0,.9,.4)',
      },
      {
        transform: 'translateY(-2%) scaleX(0.98) scaleY(1.05)',
        offset: 0.58,
        easing: 'cubic-bezier(.2,.7,.35,1)',
      },
      {
        transform: 'translateY(0%) scaleX(1.09) scaleY(0.82)',
        offset: 0.74,
        easing: 'cubic-bezier(.3,0,.4,1)',
      },
      { transform: 'translateY(0%) scaleX(0.98) scaleY(1.05)', offset: 0.88, easing: 'ease-out' },
      { transform: 'translateY(0%) scaleX(1) scaleY(1)', offset: 1 },
    ]
    add(q('[data-p="just"]'), drop, { duration: T.dur, delay: T.just })
    add(q('[data-p="nibble"]'), drop, { duration: T.dur, delay: T.nibble })
    add(q('[data-p="it"]'), drop, { duration: T.dur, delay: T.it })

    // --- the chomp ----------------------------------------------------------
    add(q('[data-p="bWhole"]'), [{ opacity: 1 }, { opacity: 0 }], {
      duration: 30,
      delay: T.chomp,
      easing: 'steps(1,end)',
    })
    add(q('[data-p="bBitten"]'), [{ opacity: 0 }, { opacity: 1 }], {
      duration: 30,
      delay: T.chomp,
      easing: 'steps(1,end)',
    })
    add(
      q('[data-p="bite"]'),
      [
        { opacity: 0, transform: 'translate(0,0) rotate(0deg) scale(1)', offset: 0 },
        { opacity: 1, transform: 'translate(3%,-4%) rotate(24deg) scale(1.05)', offset: 0.18 },
        { opacity: 1, transform: 'translate(15%,-14%) rotate(84deg) scale(.9)', offset: 0.6 },
        { opacity: 0, transform: 'translate(27%,-4%) rotate(150deg) scale(.66)', offset: 1 },
      ],
      { duration: T.biteFly, delay: T.chomp, easing: 'cubic-bezier(.2,.6,.3,1)' }
    )
    // crumbs burst, tumble, then settle into their real positions in the logo
    add(
      q('[data-p="crumbs"]'),
      [
        { opacity: 0, transform: 'translate(0,0) rotate(0deg) scale(.5)', offset: 0 },
        {
          opacity: 1,
          transform: 'translate(8%,-9%) rotate(45deg) scale(2.6)',
          offset: 0.22,
          easing: 'cubic-bezier(.15,.7,.3,1)',
        },
        { opacity: 1, transform: 'translate(12%,-3%) rotate(100deg) scale(2)', offset: 0.5 },
        {
          opacity: 1,
          transform: 'translate(0,0) rotate(0deg) scale(1)',
          offset: 1,
          easing: 'cubic-bezier(.3,1.6,.5,1)',
        },
      ],
      { duration: T.crumbs, delay: T.chomp }
    )
    // the lockup takes the hit, and the screen crunches
    add(
      logo.current,
      [
        { transform: 'translate(-50%,-50%) scale(1)', offset: 0 },
        { transform: 'translate(-50%,-50%) scale(.94)', offset: 0.3, easing: 'ease-out' },
        { transform: 'translate(-50%,-50%) scale(1.04)', offset: 0.62, easing: 'ease-in-out' },
        { transform: 'translate(-50%,-50%) scale(1)', offset: 1 },
      ],
      { duration: 430, delay: T.chomp }
    )
    add(
      root,
      [
        { transform: 'translate(0,0)' },
        { transform: 'translate(-1.2%,1.6%)' },
        { transform: 'translate(1%,-1.2%)' },
        { transform: 'translate(-.5%,.7%)' },
        { transform: 'translate(.3%,-.3%)' },
        { transform: 'translate(0,0)' },
      ],
      { duration: T.shake, delay: T.chomp, easing: 'ease-out' }
    )
    // ground flips to green out of the bite; ink inverts along the same front
    add(flip.current, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
      duration: T.flip,
      delay: T.chomp,
      easing: 'cubic-bezier(.3,.75,.25,1)',
    })
    add(
      cream.current,
      [
        { clipPath: `circle(0% at ${BX}% ${BY}%)` },
        { clipPath: `circle(135% at ${BX}% ${BY}%)` },
      ],
      { duration: T.flip + 60, delay: T.chomp + 40, easing: 'cubic-bezier(.3,.75,.25,1)' }
    )
    // doodles burst out from behind the logo
    q('[data-dood]').forEach((el, i) => {
      const a = (Number(el.dataset.a) * Math.PI) / 180
      const dist = Number(el.dataset.d)
      const spin = Number(el.dataset.s)
      const x = Math.cos(a) * dist
      const y = Math.sin(a) * dist
      const at = (f) => `translate(calc(-50% + ${x * f}vw), calc(-50% + ${y * f}vw))`
      add(
        el,
        [
          { opacity: 0, transform: 'translate(-50%,-50%) rotate(0deg) scale(.15)', offset: 0 },
          {
            opacity: 1,
            transform: `${at(0.4)} rotate(${spin * 0.35}deg) scale(1.1)`,
            offset: 0.3,
            easing: 'cubic-bezier(.1,.75,.3,1)',
          },
          { opacity: 0.95, transform: `${at(0.84)} rotate(${spin * 0.8}deg) scale(.95)`, offset: 0.72 },
          { opacity: 0, transform: `${at(1)} rotate(${spin}deg) scale(.8)`, offset: 1 },
        ],
        { duration: T.doodle, delay: T.chomp + 20 + i * 10 }
      )
    })

    // --- collapse into the header -------------------------------------------
    // The lockup is cream by now and the site header is a dark bar, so the ink
    // stays inverted: the overlay simply shrinks to the header strip and its
    // green settles to the header's own dark. Both are dark, so nothing muddies,
    // and the final frame already *is* the header — the cut is invisible.
    const target = document.querySelector('[data-intro-logo]')?.getBoundingClientRect()
    const bar = document.querySelector('[data-intro-bar]')?.getBoundingClientRect()
    const box = logo.current.getBoundingClientRect()
    const ease = 'cubic-bezier(.55,0,.28,1)'

    if (target && target.height > 0) {
      const k = target.height / box.height
      const tx = -50 + ((target.left + target.width / 2 - (box.left + box.width / 2)) / box.width) * 100
      const ty = -50 + ((target.top + target.height / 2 - (box.top + box.height / 2)) / box.height) * 100
      fwd(
        logo.current,
        [
          { transform: 'translate(-50%,-50%) scale(1)', offset: 0 },
          {
            transform: 'translate(-50%,-50%) scale(1.05)',
            offset: 0.16,
            easing: 'cubic-bezier(.4,0,.7,.2)',
          },
          { transform: `translate(${tx}%, ${ty}%) scale(${k})`, offset: 1 },
        ],
        { duration: T.collapseDur, delay: T.collapse, easing: ease }
      )
    } else {
      fwd(logo.current, [{ opacity: 1 }, { opacity: 0 }], {
        duration: T.collapseDur * 0.5,
        delay: T.collapse,
      })
    }

    const barBottom = bar ? Math.max(0, window.innerHeight - bar.bottom) : window.innerHeight * 0.88
    fwd(stage.current, [{ clipPath: 'inset(0px 0px 0px 0px)' }, { clipPath: `inset(0px 0px ${barBottom}px 0px)` }], {
      duration: T.collapseDur,
      delay: T.collapse,
      easing: ease,
    })
    fwd(flip.current, [{ backgroundColor: GREEN }, { backgroundColor: HEADER_DARK }], {
      duration: T.collapseDur * 0.7,
      delay: T.collapse,
      easing: 'ease-in-out',
    })
    fwd(burst.current, [{ opacity: 1 }, { opacity: 0 }], {
      duration: 200,
      delay: T.collapse,
    })

    // --- lifecycle ----------------------------------------------------------
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // ?intro_t=<ms> freezes the whole timeline at one instant, for inspecting a
    // single frame. Every offset lives in an effect delay, so seeking each
    // animation to the same time reproduces that moment exactly.
    const seek = new URLSearchParams(window.location.search).get('intro_t')
    if (seek !== null) {
      const at = Number(seek)
      anims.forEach((a) => {
        a.pause()
        a.currentTime = at
      })
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }

    let done = false
    const teardown = () => {
      if (done) return
      done = true
      document.body.style.overflow = prevOverflow
      root.remove()
    }
    const skip = () => {
      anims.forEach((a) => a.finish())
      teardown()
    }
    const onKey = (e) => {
      if (e.key !== 'Tab') skip()
    }

    root.addEventListener('click', skip)
    window.addEventListener('keydown', onKey)
    const timer = window.setTimeout(teardown, TOTAL + 40)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      root.removeEventListener('click', skip)
      document.body.style.overflow = prevOverflow
      // Deliberately NOT cancelling `anims`: under StrictMode this cleanup runs
      // between the two dev mounts, and cancelling here would kill the timeline
      // the second mount then rebuilds from zero — a visible restart. Animations
      // left on a detached node are collected with it.
    }
  }, [])

  const layerBox = { position: 'absolute', inset: 0 }

  if (!playDecision) return null

  return (
    <div
      ref={shake}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 9999, willChange: 'transform', cursor: 'pointer' }}
    >
      <style>{'.jni-intro-doodle{display:block;width:100%;height:auto}'}</style>
      <div ref={stage} style={{ ...layerBox, background: CREAM, overflow: 'hidden' }}>
        <div
          ref={flip}
          style={{
            position: 'absolute',
            left: `${BX}%`,
            top: `${BY}%`,
            width: '300vmax',
            height: '300vmax',
            margin: '-150vmax 0 0 -150vmax',
            borderRadius: '50%',
            background: GREEN,
            transform: 'scale(0)',
          }}
        />
        <div ref={burst} style={{ position: 'absolute', left: `${BX}%`, top: `${BY}%`, width: 0, height: 0 }}>
          {BURST.map(([a, d, size, spin, name], i) => (
            <Doodle key={i} name={name} a={a} d={d} size={size} spin={spin} />
          ))}
        </div>

        <div
          ref={logo}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            width: 'min(56vw, 600px)',
            aspectRatio: `${VB_W} / ${VB_H}`,
          }}
        >
          <div style={{ ...layerBox, fill: INK }}>
            <LogoCopy />
          </div>
          <div
            ref={cream}
            style={{ ...layerBox, fill: CREAM, clipPath: `circle(0% at ${BX}% ${BY}%)` }}
          >
            <LogoCopy />
          </div>
        </div>
      </div>
    </div>
  )
}

function Doodle({ name, a, d, size, spin }) {
  const Art = doodleComponents[name]
  return (
    <div
      data-dood=""
      data-a={a}
      data-d={d}
      data-s={spin}
      style={{
        position: 'absolute',
        width: size,
        transform: 'translate(-50%,-50%)',
        opacity: 0,
      }}
    >
      {Art ? <Art flavour="jalapeno-kick" className="jni-intro-doodle" /> : null}
    </div>
  )
}
