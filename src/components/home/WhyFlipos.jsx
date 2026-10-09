import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion'
import { whyFeatures } from '../../data/site'
import { WaveDivider, useMediaQuery } from '../ui/Primitives'
import { FlipoMark } from '../icons/FlipoMark'
import WhyWall from './WhyWall'
import '../../styles/why-flipos.css'
import { responsiveImage } from '../../lib/responsiveImage'

/*
 * Why Flipo's, as the monitor on the hero's desk.
 *
 * The hero is the desk from across the room; this is the camera walked up to
 * the monitor on it. The four reasons are sticky notes stuck round the bezel,
 * the way every work monitor ends up decorated, and the section heading is on
 * the screen itself -- the same move as the vending machine's lit sign.
 *
 * Behind the heading a pack drifts and bounces off the screen's edges like the
 * old DVD screensaver, changing flavour on every bounce the way the DVD logo
 * changed colour. It shrinks as it drifts and springs back to full size off
 * each wall. When it lands square in a corner, the screen throws a burst
 * of confetti. That is the one joke; everything else stays still until you
 * touch it -- a note lifts and its doodle comes alive only under the pointer.
 *
 * Laptops get a fixed-size artboard zoomed to fit the screen, like the
 * vending machine below. Phones stack the monitor over the notes, which lie
 * on the desk.
 *
 * On laptops the section is also the far end of the hero's camera move (see
 * HeroWhyZoom): `staged` fills the pinned screen, `revealed` says the camera
 * has arrived and the notes can go up, `covered` that the hero still hides
 * the section completely, and `monitorRef` is where the move has to land.
 */

const PACKS = ['sweet-chilli-rush', 'jalapeno-kick', 'peri-peri-punch']

// Each note a colour from the site's own palette. None is sunshine: every
// doodle is drawn in sunshine yellow and would sink into it.
const NOTE = {
  flavour: { bg: '#f59120', tilt: -6 },
  desk: { bg: '#fbf6d0', tilt: 5 },
  creative: { bg: '#c3d92e', tilt: 4 },
  brain: { bg: '#4db8ae', tilt: -5 },
}

const ARTBOARD = { w: 1180, h: 600 }
const ROOM = 150
// How far the artboard may grow on a big screen. HeroCarousel caps its own
// monitor off this, so keep the two in step.
export const MAX_FIT = 1.3
const SPEED = 78 // px per second, in screen units
const CORNER = 14 // how close to square a corner counts as a corner hit
// The pack shrinks as it drifts and springs back to full size off every wall:
// down to MIN_SCALE over SHRINK_S seconds, back up in GROW_S.
const MIN_SCALE = 0.5
const SHRINK_S = 1.8
const GROW_S = 0.28

export default function WhyFlipos({ staged = false, revealed = true, covered = false, monitorRef }) {
  const rigRef = useRef(null)

  // Fit the artboard to the screen, as the vending machine does.
  useLayoutEffect(() => {
    const rig = rigRef.current
    if (!rig) return undefined
    const fit = () => {
      if (window.innerWidth < 1024) {
        rig.style.zoom = ''
        return
      }
      const z = Math.max(
        0.62,
        Math.min(MAX_FIT, (window.innerWidth - 40) / ARTBOARD.w, (window.innerHeight - ROOM) / ARTBOARD.h),
      )
      rig.style.zoom = String(z)
      // The desk props only come in where there's wall enough to show them whole.
      const wall = (window.innerWidth - ARTBOARD.w * z) / 2 / z
      rig.dataset.room = wall >= 190 ? 'on' : 'off'
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <section
      id={staged ? undefined : 'why-flipos'}
      className={`wf-section relative isolate ${staged ? 'wf-section--staged' : ''}`}
    >
      <div className="wf-stage">
        <div ref={rigRef} className="wf-rig">
          <WhyWall />
          <div className="wf-props" aria-hidden="true">
            <img {...responsiveImage('/assets/hero/desk/peri-peri-punch--envelope.webp', '200px')} alt="" loading="lazy" className="wf-prop wf-prop--envelope" />
            <img {...responsiveImage('/assets/hero/desk/peri-peri-punch--mug.webp', '200px')} alt="" loading="lazy" className="wf-prop wf-prop--mug" />
          </div>
          <Monitor ref={monitorRef} paused={covered} />
          <ul className="wf-notes">
            {whyFeatures.map((feature, i) => (
              <StickyNote key={feature.id} feature={feature} index={i} staged={staged} revealed={revealed} />
            ))}
          </ul>
        </div>
      </div>

      <div className="absolute inset-x-0 -bottom-px z-20 h-12 w-full sm:h-16">
        <WaveDivider fill="#7d1206" className="absolute inset-0 h-full w-full" />
      </div>
    </section>
  )
}

/**
 * The monitor: bezel, screen, chin, stand. The screen carries the heading.
 *
 * The hero stands a second one on its desk. That one is `decorative` -- its
 * "Why Flipo's?" is only read once, here -- and puts its own copy on the
 * screen (`screen`), over the screensaver, which it fades up as the camera
 * move starts (`saverOpacity`). `children` hang off the bezel.
 */
export const Monitor = forwardRef(function Monitor(
  { decorative = false, className = '', screen = null, saverOpacity, paused = false, children },
  ref,
) {
  return (
    <div ref={ref} className={`wf-monitor ${className}`}>
      <div className="wf-frame">
        <Screensaver decorative={decorative} saverOpacity={saverOpacity} paused={paused}>
          {screen}
        </Screensaver>
        <div className="wf-chin" aria-hidden="true">
          <span className="wf-led" />
        </div>
      </div>
      <svg className="wf-stand" viewBox="0 0 240 100" aria-hidden="true">
        <path d="M95 0 L145 0 L153 72 L87 72 Z" fill="#3a9d93" stroke="#0d2818" strokeWidth="6" strokeLinejoin="round" />
        <path d="M28 74 Q120 62 212 74 L216 92 Q120 101 24 92 Z" fill="#4db8ae" stroke="#0d2818" strokeWidth="6" strokeLinejoin="round" />
      </svg>
      {children}
    </div>
  )
})

/*
 * The bounce, shared. The hero's monitor and this section's are the same
 * screen seen from two distances, and the camera hands one over to the other
 * mid-scroll -- so there is one pack, one position and one flavour, and every
 * mounted screen draws it. One rAF loop runs while any screen is on screen;
 * each frame writes the pack's transform directly, with no React render.
 * Both screens are laid out at the same native size, so one set of
 * coordinates fits both.
 */
const bounce = {
  x: 60,
  y: 40,
  vx: SPEED,
  vy: SPEED * 0.72,
  scale: 1,
  growing: false,
  flavour: 0,
  last: 0,
  frame: 0,
  screens: new Set(),
}

function runBounce() {
  if (bounce.frame) return
  bounce.last = 0
  bounce.frame = requestAnimationFrame(tickBounce)
}

function tickBounce(t) {
  // Why Flipo's own screen leads when it is up; the hero's copy otherwise.
  const lead = [...bounce.screens]
    .filter((s) => s.active && s.screen.current && s.pack.current)
    .sort((x, y) => Number(y.lead) - Number(x.lead))[0]
  if (!lead) {
    bounce.frame = 0
    return
  }
  const b = bounce
  const dt = b.last ? Math.min(0.05, (t - b.last) / 1000) : 0
  b.last = t
  // Sizes come from the screen's ResizeObserver, not a read here: a read
  // straight after last frame's transform write forces a layout every frame.
  const { screenW, screenH, packW, packH } = lead.size

  // Size first: shrinking while it drifts, springing back after a wall.
  if (b.growing) {
    b.scale = Math.min(1, b.scale + ((1 - MIN_SCALE) / GROW_S) * dt)
    if (b.scale === 1) b.growing = false
  } else {
    b.scale = Math.max(MIN_SCALE, b.scale - ((1 - MIN_SCALE) / SHRINK_S) * dt)
  }
  // The pack scales about its centre, so its visible edges sit `inset` in
  // from its layout box: the walls are measured against what is drawn.
  const insetX = ((1 - b.scale) * packW) / 2
  const insetY = ((1 - b.scale) * packH) / 2
  const minX = -insetX
  const minY = -insetY
  const maxX = screenW - packW + insetX
  const maxY = screenH - packH + insetY

  b.x += b.vx * dt
  b.y += b.vy * dt
  // Only a wall it is heading into counts. While it grows back beside the
  // wall it just left, it is eased off that wall, not bounced again.
  let hitX = false
  let hitY = false
  if ((b.x <= minX && b.vx < 0) || (b.x >= maxX && b.vx > 0)) {
    b.vx *= -1
    hitX = true
  }
  if ((b.y <= minY && b.vy < 0) || (b.y >= maxY && b.vy > 0)) {
    b.vy *= -1
    hitY = true
  }
  b.x = Math.max(minX, Math.min(maxX, b.x))
  b.y = Math.max(minY, Math.min(maxY, b.y))
  if (hitX || hitY) {
    b.growing = true
    b.flavour = (b.flavour + 1) % PACKS.length
    // A corner: one wall hit with the other wall within reach.
    const nearX = b.x <= minX + CORNER || b.x >= maxX - CORNER
    const nearY = b.y <= minY + CORNER || b.y >= maxY - CORNER
    const corner = (hitX && nearY) || (hitY && nearX)
    const at = { id: t, x: b.x + packW / 2, y: b.y + packH / 2 }
    b.screens.forEach((s) => {
      s.setFlavour(b.flavour)
      if (corner) s.burst(at)
    })
  }
  const transform = `translate(${b.x}px, ${b.y}px) scale(${b.scale.toFixed(3)})`
  b.screens.forEach((s) => {
    if (s.pack.current) s.pack.current.style.transform = transform
  })
  b.frame = requestAnimationFrame(tickBounce)
}

/** The heading, with the shared pack bouncing round behind it. */
function Screensaver({ decorative, saverOpacity, paused, children }) {
  const reduceMotion = useReducedMotion()
  const screenRef = useRef(null)
  const packRef = useRef(null)
  const inView = useInView(screenRef, { amount: 0.2 })
  const [flavour, setFlavour] = useState(bounce.flavour)
  const [bursts, setBursts] = useState([])
  const entry = useRef(null)
  // The hero's copy of this screen sits at opacity 0 under the copy until
  // the camera move starts. Bouncing there was a frame loop, and a React
  // render at every wall, that no one could see.
  const always = useMotionValue(1)
  const opacity = saverOpacity ?? always
  const [shown, setShown] = useState(() => opacity.get() > 0)
  useMotionValueEvent(opacity, 'change', (v) => setShown(v > 0))

  useEffect(() => {
    const e = {
      screen: screenRef,
      pack: packRef,
      lead: !decorative,
      active: false,
      size: { screenW: 0, screenH: 0, packW: 0, packH: 0 },
      setFlavour,
      burst: (at) => {
        setBursts((list) => [...list, at])
        setTimeout(() => setBursts((list) => list.filter((x) => x.id !== at.id)), 1400)
      },
    }
    entry.current = e
    bounce.screens.add(e)
    if (packRef.current) {
      packRef.current.style.transform = `translate(${bounce.x}px, ${bounce.y}px) scale(${bounce.scale})`
    }
    const measure = () => {
      const screen = screenRef.current
      const pack = packRef.current
      if (!screen || !pack) return
      e.size = { screenW: screen.clientWidth, screenH: screen.clientHeight, packW: pack.offsetWidth, packH: pack.offsetHeight }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (screenRef.current) ro.observe(screenRef.current)
    if (packRef.current) ro.observe(packRef.current)
    return () => {
      ro.disconnect()
      bounce.screens.delete(e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!entry.current) return
    // `paused`: on laptops this section sits under the hero, wholly hidden,
    // until the camera move is nearly done -- in view, but not to be seen.
    entry.current.active = inView && shown && !paused && !reduceMotion
    if (entry.current.active) runBounce()
  }, [inView, shown, paused, reduceMotion])

  const Title = decorative ? 'p' : 'h2'
  return (
    <div ref={screenRef} className="wf-screen">
      <motion.div className="wf-saver" style={saverOpacity ? { opacity: saverOpacity } : undefined} aria-hidden={decorative || undefined}>
        <img
          ref={packRef}
          // Never more than ~70px wide on screen, even with the camera in.
          {...responsiveImage(`/assets/hero/pouch-${PACKS[flavour]}.webp`, '160px')}
          alt=""
          aria-hidden="true"
          className="wf-bouncer"
          draggable="false"
        />
        <AnimatePresence>
          {bursts.map((b) => (
            <Confetti key={b.id} x={b.x} y={b.y} />
          ))}
        </AnimatePresence>
        {/* "Flipo's" is the pack's own lettering, not type -- the same mark as
            on the pouch front. The words ride along for screen readers. */}
        <Title className="wf-title font-brand">
          <span className="wf-title-line">
            Why
            <FlipoMark className="wf-title-mark" />
            <span className="sr-only"> Flipo&apos;s</span>?
          </span>
        </Title>
      </motion.div>
      {children}
    </div>
  )
}

const CONFETTI_COLOURS = ['#f3c63b', '#f59120', '#c3d92e', '#4db8ae', '#fbf6d0', '#c8102e']

function Confetti({ x, y }) {
  const pieces = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.3
    const dist = 60 + (i % 5) * 22
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist + 30,
      rot: (i % 2 ? 1 : -1) * (180 + i * 20),
      colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
      tri: i % 3 === 0,
    }
  })
  return (
    <span className="wf-confetti" style={{ left: x, top: y }} aria-hidden="true">
      {pieces.map((p, i) => (
        <motion.i
          key={i}
          className={p.tri ? 'is-tri' : ''}
          style={{ '--c': p.colour }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.dx, y: p.dy, rotate: p.rot, opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.2, 0.7, 0.4, 1] }}
        />
      ))}
    </span>
  )
}

/** One reason, on a sticky note stuck to the monitor. */
function StickyNote({ feature, index, staged, revealed }) {
  const reduceMotion = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  // At the end of the hero's camera move the notes go up when the camera
  // arrives, and come back down if it backs away.
  const up = staged ? revealed : inView
  const [hot, setHot] = useState(false)
  // Touch has no hover, so the doodle's loop never ran on a phone. There it
  // plays while the note sits well inside the screen instead.
  const noHover = useMediaQuery('(hover: none)')
  const centred = useInView(ref, { amount: 0.9 })
  const looping = hot || (noHover && centred && up && !reduceMotion)
  const note = NOTE[feature.id] || { bg: '#fbf6d0', tilt: 0 }

  return (
    <motion.li
      ref={ref}
      className={`wf-note wf-note--${feature.id}`}
      style={{ '--note': note.bg }}
      initial={reduceMotion ? { rotate: note.tilt } : { opacity: 0, scale: 1.25, rotate: note.tilt * 2.2 }}
      animate={
        up || reduceMotion
          ? {
              opacity: 1,
              scale: 1,
              y: 0,
              rotate: note.tilt,
              transition: { type: 'spring', stiffness: 380, damping: 18, delay: reduceMotion ? 0 : 0.15 + index * 0.12 },
            }
          : staged
            ? { opacity: 0, scale: 1.25, rotate: note.tilt * 2.2, transition: { duration: 0.2 } }
            : undefined
      }
      whileHover={
        reduceMotion || !up
          ? undefined
          : { rotate: note.tilt * 0.3, y: -8, scale: 1.04, transition: { type: 'spring', stiffness: 420, damping: 20 } }
      }
      onHoverStart={() => setHot(true)}
      onHoverEnd={() => setHot(false)}
    >
      <div className={`why-icon wf-note-art ${feature.loopClass} ${looping ? 'why-loop' : ''}`} aria-hidden="true">
        <img {...responsiveImage(feature.image, '(min-width: 1024px) 136px, 88px')} alt="" loading="lazy" decoding="async" />
        {feature.overlay === 'keys' && (
          <span className="why-keys text-[#071A16]">
            <i />
            <i />
            <i />
          </span>
        )}
        {feature.overlay === 'burst' && (
          <span className="why-burst">
            {Array.from({ length: 6 }).map((_, i) => (
              <i key={i} style={{ '--i': i }} />
            ))}
          </span>
        )}
      </div>
      <h3 className="wf-note-title font-brand">{feature.lines.join(' ')}</h3>
      <p className="wf-note-text">{feature.blurb}</p>
    </motion.li>
  )
}
