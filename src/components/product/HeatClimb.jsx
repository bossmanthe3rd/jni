import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { packPalettes } from '../icons/PackDoodles'
import { heatLevel } from './HeatMeter'
import FlipSpot from '../mascot/FlipSpot'
import BittenCrisp from './BittenCrisp'

/**
 * "Flavour first. Heat second." -- the brand's own promise, drawn as five
 * bites across the page.
 *
 * Each bite is a column a step deeper than the last, from the flavour's soft
 * tint towards the pouch's ground, and each drops in chillies until it reaches
 * the flavour's real heat level. The ramp is scaled by that level too, so
 * Sweet Chilli (Sweet Heat) tops out light and Peri Peri (Big Heat) ends on
 * the full ground: the section says something different on each page, and
 * what it says is true.
 *
 * On a wide screen the section pins and the bites play as you scroll through
 * it, while a crisp in the middle of the screen is eaten one bite per step. On a phone, or under reduced motion, it is a plain list that is already
 * complete -- a pinned scroll on a small screen is a trap, not a treat.
 */

const BITES = 5
/* How far towards the ground the last bite goes, per heat level. */
const RAMP_MAX = { 1: 40, 2: 72, 3: 100 }
const TURNS = [-18, 24, -40]

function useWide() {
  const query = '(min-width: 1024px)'
  const [wide, setWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setWide(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return wide
}

export function buildBites(product) {
  const level = heatLevel(product) || 1
  const max = RAMP_MAX[level]
  const ground = packPalettes[product.slug]?.ground || product.theme?.ink
  const soft = product.theme?.soft || '#fbf6d0'
  return (product.heatBites || []).slice(0, BITES).map((text, i) => {
    const mix = Math.round((i / (BITES - 1)) * max)
    return {
      text,
      n: i + 1,
      bg: `color-mix(in oklch, ${ground} ${mix}%, ${soft})`,
      dark: mix > 45,
      // Chillies accumulate in step with the bite, capped at the heat level.
      chillies: Math.max(1, Math.ceil(((i + 1) * level) / BITES)),
    }
  })
}

export default function HeatClimb({ product }) {
  const reduce = useReducedMotion()
  const wide = useWide()
  const pinned = wide && !reduce
  const bites = buildBites(product)
  const chilli = `/assets/doodles/pack/${product.slug}-chilli-whole.svg`

  const trackRef = useRef(null)
  const [reached, setReached] = useState(pinned ? 1 : BITES)
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const spin = useTransform(scrollYProgress, [0, 1], [-14, 22])

  useEffect(() => {
    setReached(pinned ? 1 : BITES)
  }, [pinned, product.slug])

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (!pinned) return
    const next = Math.min(BITES, Math.max(1, Math.floor(p * BITES * 1.05) + 1))
    if (next !== reached) setReached(next)
  })

  if (!bites.length) return null

  const heading = (
    <div className="jni-climb-head">
      <p className="jni-climb-k">How the heat builds · {product.flavor}</p>
      <h2>Flavour first. Heat second.</h2>
      <p className="jni-climb-sub">{product.flavourDescription}</p>
    </div>
  )

  if (!pinned) {
    return (
      <section ref={trackRef} className="jni-climb jni-climb-list" aria-label="How the heat builds">
        <div style={{ backgroundColor: product.theme?.soft }}>{heading}</div>
        <ol>
          {bites.map((b, i) => (
            <motion.li
              key={b.n}
              style={{ backgroundColor: b.bg }}
              data-dark={b.dark ? '' : undefined}
              initial={reduce ? false : { opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
            >
              <span className="jni-climb-n">Bite {b.n}</span>
              <span className="jni-climb-t">{b.text}</span>
              <span className="jni-climb-stack" aria-hidden="true">
                {Array.from({ length: b.chillies }, (_, k) => (
                  <img key={k} src={chilli} alt="" />
                ))}
              </span>
            </motion.li>
          ))}
        </ol>
      </section>
    )
  }

  return (
    <section ref={trackRef} className="jni-climb jni-climb-track" aria-label="How the heat builds">
      <div className="jni-climb-pin jni-grain">
        <ol className="jni-climb-cols">
          {bites.map((b, i) => {
            const on = i < reached
            return (
              <li
                key={b.n}
                data-on={on ? '' : undefined}
                data-dark={on && b.dark ? '' : undefined}
                style={{ backgroundColor: on ? b.bg : bites[0].bg }}
              >
                <span className="jni-climb-stack" aria-hidden="true">
                  {on &&
                    Array.from({ length: b.chillies }, (_, k) => (
                      <motion.img
                        key={k}
                        src={chilli}
                        alt=""
                        initial={{ y: -220, opacity: 0, rotate: 0 }}
                        animate={{ y: 0, opacity: 1, rotate: TURNS[k % TURNS.length] }}
                        transition={{ type: 'spring', stiffness: 260, damping: 15, delay: k * 0.06 }}
                      />
                    ))}
                </span>
                <span className="jni-climb-n">Bite {b.n}</span>
                <span className="jni-climb-t">{b.text}</span>
              </li>
            )
          })}
        </ol>
        {heading}

        {/* The crisp being eaten: one bite per bite, turning as you scroll. */}
        <motion.div className="jni-climb-crisp" style={{ rotate: spin }}>
          <BittenCrisp flavour={product.slug} bites={reached} />
        </motion.div>

        {/* Flip stands in the empty top of the last columns and feels it:
            his heat is how far the climb has got, scaled by the flavour's own
            level, so on Sweet Chilli he barely breaks a sweat. */}
        <FlipSpot
          mode="hero"
          tint={product.slug}
          heat={((reached - 1) / (BITES - 1)) * ((heatLevel(product) || 1) / 3)}
          width="clamp(130px, 12vw, 190px)"
          style={{ left: '78%', top: '52%' }}
        />
      </div>
    </section>
  )
}
