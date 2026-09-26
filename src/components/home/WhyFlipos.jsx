import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { whyFeatures } from '../../data/site'
import { WaveDivider } from '../ui/Primitives'
import WhyWall from './WhyWall'
import '../../styles/why-flipos.css'

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
 * changed colour. When it lands square in a corner, the screen throws a burst
 * of confetti. That is the one joke; everything else stays still until you
 * touch it -- a note lifts and its doodle comes alive only under the pointer.
 *
 * Laptops get a fixed-size artboard zoomed to fit the screen, like the
 * vending machine below. Phones stack the monitor over the notes, which lie
 * on the desk.
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
const SPEED = 78 // px per second, in screen units
const CORNER = 14 // how close to square a corner counts as a corner hit

export default function WhyFlipos({ wall }) {
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
        Math.min(1.1, (window.innerWidth - 40) / ARTBOARD.w, (window.innerHeight - ROOM) / ARTBOARD.h),
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
    <section id="why-flipos" className="wf-section relative isolate">
      <div className="wf-stage">
        <div ref={rigRef} className="wf-rig">
          <WhyWall wall={wall} />
          <div className="wf-props" aria-hidden="true">
            <img src="/assets/hero/desk/peri-peri-punch--envelope.webp" alt="" loading="lazy" className="wf-prop wf-prop--envelope" />
            <img src="/assets/hero/desk/peri-peri-punch--mug.webp" alt="" loading="lazy" className="wf-prop wf-prop--mug" />
          </div>
          <Monitor />
          <ul className="wf-notes">
            {whyFeatures.map((feature, i) => (
              <StickyNote key={feature.id} feature={feature} index={i} />
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

/** The monitor: bezel, screen, chin, stand. The screen carries the heading. */
function Monitor() {
  return (
    <div className="wf-monitor">
      <div className="wf-frame">
        <Screensaver />
        <div className="wf-chin" aria-hidden="true">
          <span className="wf-led" />
        </div>
      </div>
      <svg className="wf-stand" viewBox="0 0 240 100" aria-hidden="true">
        <path d="M95 0 L145 0 L153 72 L87 72 Z" fill="#3a9d93" stroke="#0d2818" strokeWidth="6" strokeLinejoin="round" />
        <path d="M28 74 Q120 62 212 74 L216 92 Q120 101 24 92 Z" fill="#4db8ae" stroke="#0d2818" strokeWidth="6" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

/**
 * The heading, with a pack bouncing round behind it. The pack moves by writing
 * its transform directly each frame -- no React render per frame -- and only
 * while the screen is on screen.
 */
function Screensaver() {
  const reduceMotion = useReducedMotion()
  const screenRef = useRef(null)
  const packRef = useRef(null)
  const inView = useInView(screenRef, { amount: 0.2 })
  const [flavour, setFlavour] = useState(0)
  const [bursts, setBursts] = useState([])
  const state = useRef({ x: 60, y: 40, vx: SPEED, vy: SPEED * 0.72, last: 0 })

  useEffect(() => {
    if (reduceMotion || !inView) return undefined
    let frame = 0
    const s = state.current
    s.last = 0

    const tick = (t) => {
      const screen = screenRef.current
      const pack = packRef.current
      if (!screen || !pack) return
      const dt = s.last ? Math.min(0.05, (t - s.last) / 1000) : 0
      s.last = t
      const maxX = screen.clientWidth - pack.offsetWidth
      const maxY = screen.clientHeight - pack.offsetHeight

      s.x += s.vx * dt
      s.y += s.vy * dt
      let hitX = false
      let hitY = false
      if (s.x <= 0 || s.x >= maxX) {
        s.x = Math.max(0, Math.min(maxX, s.x))
        s.vx *= -1
        hitX = true
      }
      if (s.y <= 0 || s.y >= maxY) {
        s.y = Math.max(0, Math.min(maxY, s.y))
        s.vy *= -1
        hitY = true
      }
      if (hitX || hitY) {
        setFlavour((f) => (f + 1) % PACKS.length)
        // A corner: one wall hit with the other wall within reach.
        const nearX = s.x <= CORNER || s.x >= maxX - CORNER
        const nearY = s.y <= CORNER || s.y >= maxY - CORNER
        if ((hitX && nearY) || (hitY && nearX)) {
          const id = t
          setBursts((b) => [
            ...b,
            { id, x: s.x + pack.offsetWidth / 2, y: s.y + pack.offsetHeight / 2 },
          ])
          setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1400)
        }
      }
      pack.style.transform = `translate(${s.x}px, ${s.y}px)`
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reduceMotion, inView])

  return (
    <div ref={screenRef} className="wf-screen">
      <img
        ref={packRef}
        src={`/assets/hero/pouch-${PACKS[flavour]}.webp`}
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
      <h2 className="wf-title font-brand">Why Flipo&apos;s?</h2>
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
function StickyNote({ feature, index }) {
  const reduceMotion = useReducedMotion()
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [hot, setHot] = useState(false)
  const note = NOTE[feature.id] || { bg: '#fbf6d0', tilt: 0 }

  return (
    <motion.li
      ref={ref}
      className={`wf-note wf-note--${feature.id}`}
      style={{ '--note': note.bg }}
      initial={reduceMotion ? { rotate: note.tilt } : { opacity: 0, scale: 1.25, rotate: note.tilt * 2.2 }}
      animate={
        inView || reduceMotion
          ? {
              opacity: 1,
              scale: 1,
              y: 0,
              rotate: note.tilt,
              transition: { type: 'spring', stiffness: 380, damping: 18, delay: reduceMotion ? 0 : 0.15 + index * 0.12 },
            }
          : undefined
      }
      whileHover={
        reduceMotion
          ? undefined
          : { rotate: note.tilt * 0.3, y: -8, scale: 1.04, transition: { type: 'spring', stiffness: 420, damping: 20 } }
      }
      onHoverStart={() => setHot(true)}
      onHoverEnd={() => setHot(false)}
    >
      <div className={`why-icon wf-note-art ${feature.loopClass} ${hot ? 'why-loop' : ''}`} aria-hidden="true">
        <img src={feature.image} alt="" width="512" height="512" loading="lazy" decoding="async" />
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
