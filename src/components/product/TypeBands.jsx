import { useEffect, useRef } from 'react'
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useVelocity,
} from 'framer-motion'
import { contrastRatio } from '../../data/products'
import { packPalettes } from '../icons/PackDoodles'

/**
 * Two tilted strips of type crossing over a section boundary, running in
 * opposite directions.
 *
 * It is the launch ticker's idea turned into a piece of the layout: the
 * strips drift on their own and speed up with the scroll, then settle back,
 * so the page answers the reader's hand. Everything they say is already true
 * somewhere on the page -- the heat, the crunch, fried not baked, the zip,
 * the delivery -- which is also why they are aria-hidden: to a screen reader
 * this would be the same facts again, twice, on a loop.
 *
 *   from, to  the colours above and below, so the band bridges the seam
 */

const BASE_SPEED = 38 // px per second when the page is still

function pickInk(bg) {
  return contrastRatio(bg, '#0d2818') >= 3 ? '#0d2818' : '#fbf6d0'
}

function Strip({ words, bg, ink, chilli, direction, tilt, velocity, reduce }) {
  const trackRef = useRef(null)
  const x = useMotionValue(0)
  const width = useRef(0)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const measure = () => {
      width.current = el.scrollWidth / 3
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [words])

  useAnimationFrame((_, delta) => {
    if (reduce || !width.current) return
    const boost = Math.min(6, Math.abs(velocity.get()) / 320)
    const step = ((BASE_SPEED * (1 + boost)) * delta) / 1000
    let next = x.get() + step * direction
    // Wrap within one copy of the run, so the loop has no seam.
    if (next <= -width.current) next += width.current
    if (next > 0) next -= width.current
    x.set(next)
  })

  const run = (copy) =>
    words.flatMap((w, i) => [
      <span key={`${copy}w${i}`}>{w}</span>,
      <img key={`${copy}c${i}`} src={chilli} alt="" />,
    ])

  return (
    <div className="jni-band" style={{ backgroundColor: bg, color: ink, rotate: `${tilt}deg` }}>
      <motion.div ref={trackRef} className="jni-band-track" style={{ x }}>
        {run('a')}
        {run('b')}
        {run('c')}
      </motion.div>
    </div>
  )
}

export default function TypeBands({ product, from, to }) {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const pal = packPalettes[product.slug] || {}
  const chilli = `/assets/doodles/pack/${product.slug}-chilli-whole.svg`
  const name = (product.shortName || product.name).toUpperCase()

  const a = [product.flavor?.toUpperCase(), 'CRUNCH', 'FRIED, NOT BAKED', 'RESEALS', name, '100 G'].filter(Boolean)
  const b = ['FLAVOUR FIRST', 'HEAT SECOND', 'DISPATCHED IN 24H', 'FREE SHIPPING OVER ₹499', 'UPI · CARDS · COD']

  return (
    <div
      className="jni-bands"
      aria-hidden="true"
      style={{ background: `linear-gradient(${from} 50%, ${to} 50%)` }}
    >
      <Strip
        words={a}
        bg={pal.fill || '#f3c63b'}
        ink={pickInk(pal.fill || '#f3c63b')}
        chilli={chilli}
        direction={-1}
        tilt={-3}
        velocity={velocity}
        reduce={reduce}
      />
      <Strip
        words={b}
        bg="#f3c63b"
        ink={pal.ground || '#0d2818'}
        chilli={chilli}
        direction={1}
        tilt={2.4}
        velocity={velocity}
        reduce={reduce}
      />
    </div>
  )
}
