import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView, useReducedMotion } from 'framer-motion'
import { products } from '../../data/products'
import { testimonials } from '../../data/site'

/**
 * Reviews that are about the pack on the page.
 *
 * The homepage carousel rotates quotes for every flavour, which is right on
 * the homepage and wrong here: on the Peri Peri page the Jalapeño quote is
 * noise. This leads with a quote that names this flavour, sits it beside this
 * flavour's own rating, and stacks the rest as cards you can shuffle through
 * -- more about this flavour first, then ones that name no flavour at all.
 *
 * The score counts up and its stars stamp in when the section arrives.
 */

/** "Peri Peri Punch" -> "peri": the word people actually use for it. */
const keyword = (p) => (p.shortName || p.name).split(' ')[0].toLowerCase()

export function quotesFor(product) {
  const mine = keyword(product)
  const others = products.filter((p) => p.slug !== product.slug).map(keyword)
  const text = (t) => t.text.toLowerCase()
  const about = testimonials.filter((t) => text(t).includes(mine))
  const neutral = testimonials.filter(
    (t) => ![mine, ...others].some((k) => text(t).includes(k))
  )
  return [...about, ...neutral].slice(0, 4)
}

/* How each card sits by its place in the stack, front to back. */
const STACK = [
  { rotate: -1.2, y: 0, x: 0, scale: 1 },
  { rotate: 2.6, y: 12, x: 10, scale: 0.97 },
  { rotate: -3.4, y: 22, x: -8, scale: 0.94 },
]

function Score({ value, count }) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const seen = useInView(ref, { once: true, amount: 0.6 })
  const [shown, setShown] = useState(reduce ? value : 0)

  useEffect(() => {
    if (!seen || reduce) return
    const run = animate(0, value, {
      duration: 1.1,
      ease: [0.2, 0.8, 0.3, 1],
      onUpdate: (v) => setShown(v),
    })
    return () => run.stop()
  }, [seen, reduce, value])

  return (
    <div ref={ref} className="jni-sticker jni-reviews-score" style={{ '--turn': '1.5deg' }}>
      <b aria-hidden="true">{shown.toFixed(1)}</b>
      <span>
        <span className="jni-reviews-stars" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              initial={reduce ? false : { scale: 2.6, opacity: 0, rotate: -25 }}
              animate={seen ? { scale: 1, opacity: 1, rotate: 0 } : undefined}
              transition={{ type: 'spring', stiffness: 520, damping: 16, delay: 0.75 + i * 0.09 }}
            >
              ★
            </motion.span>
          ))}
        </span>
        <span className="sr-only">Rated {value} out of 5, </span>
        from {count} nibblers
      </span>
    </div>
  )
}

export default function FlavourReviews({ product }) {
  const reduce = useReducedMotion()
  const [lead, ...rest] = quotesFor(product)
  const [order, setOrder] = useState(() => rest.map((_, i) => i))

  useEffect(() => {
    setOrder(rest.map((_, i) => i))
    // Re-deal when the flavour changes; `rest` is derived from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug])

  if (!lead) return null
  const { value, count } = product.rating || {}
  const shuffle = () => setOrder((o) => [...o.slice(1), o[0]])
  const front = rest[order[0]]

  return (
    <section className="jni-reviews jni-grain" aria-labelledby="jni-reviews-title">
      <div className="jni-reviews-lead">
        <p id="jni-reviews-title" className="jni-reviews-k">
          What people say about {product.shortName || product.name}
        </p>
        <blockquote>“{lead.text}”</blockquote>
        <p className="jni-reviews-who">
          {lead.name}, {lead.location}
        </p>
      </div>

      <div className="jni-reviews-side">
        {value && <Score value={value} count={count} />}

        {rest.length > 0 && (
          <div className="jni-reviews-stack">
            {rest.map((q, i) => {
              // Mid re-deal, for one render, a card can be missing from order.
              const found = order.indexOf(i)
              const place = found < 0 ? i : found
              const at = STACK[Math.min(place, STACK.length - 1)]
              return (
                <motion.figure
                  key={q.name}
                  className="jni-sticker jni-reviews-card"
                  aria-hidden={place !== 0}
                  style={{ zIndex: rest.length - place }}
                  animate={at}
                  transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 24 }}
                >
                  <blockquote>“{q.text}”</blockquote>
                  <figcaption>
                    {q.name}, {q.location}
                  </figcaption>
                </motion.figure>
              )
            })}
          </div>
        )}

        {rest.length > 1 && (
          <button type="button" className="jni-reviews-next" onClick={shuffle}>
            Next review
          </button>
        )}
        <p className="sr-only" aria-live="polite">
          {front ? `Showing the review from ${front.name}` : ''}
        </p>
      </div>
    </section>
  )
}
