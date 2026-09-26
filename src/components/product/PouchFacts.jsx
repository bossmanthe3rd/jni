import { motion, useReducedMotion } from 'framer-motion'
import { packPalettes } from '../icons/PackDoodles'
import { contrastRatio } from '../../data/products'

/**
 * What's in the pouch, laid out as stickers on a board.
 *
 * These used to be three of six closed accordion panels -- and weight, shelf
 * life, the zip and the ingredients are exactly what people open a product
 * page to check. So they are all on show at once, one sticker per fact,
 * with the allergen line kept word for word.
 *
 * Each sticker slaps onto the board as it scrolls in -- dropped from above,
 * a little too big, landing with its shadow snapping tight -- and lifts with
 * a peeled corner under the pointer.
 */

const SHADOW_REST = '4px 5px 0 #0d2818'
const SHADOW_AIR = '16px 22px 0 rgba(13, 40, 24, 0.22)'

export function Slap({ turn, i, className = '', style, children }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={`jni-sticker jni-peel ${className}`}
      style={{ ...style, rotate: turn }}
      initial={reduce ? false : { opacity: 0, y: -70, scale: 1.08, rotate: turn - 9, boxShadow: SHADOW_AIR }}
      whileInView={{ opacity: 1, y: 0, scale: 1, rotate: turn, boxShadow: SHADOW_REST }}
      whileHover={reduce ? undefined : { y: -6, rotate: turn * 0.3, boxShadow: '8px 11px 0 #0d2818' }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ type: 'spring', stiffness: 460, damping: 20, delay: reduce ? 0 : i * 0.08 }}
    >
      {children}
    </motion.div>
  )
}

/* One doodle per ingredient, in the order products.js lists them: the
   seasoning, the pepper it comes from, the base. */
const ING_SHAPES = ['chilli-whole', 'pepper-section', 'seed']

export default function PouchFacts({ product }) {
  const fill = packPalettes[product.slug]?.fill
  /* Peri's pouch red is too dark for ink body text; it takes cream instead. */
  const fillInk = fill && contrastRatio(fill, '#0d2818') < 4.5 ? '#fbf6d0' : undefined
  const facts = [
    { big: product.weight?.replace(/\s*gms?$/i, ' g') || '100 g', small: 'Net weight, one stand-up pouch.', bg: '#ffffff', turn: -2 },
    { big: '6 months', small: 'Shelf life from packaging.', bg: 'var(--color-accent-yellow)', turn: 1.5 },
    { big: 'Zip-lock', small: 'Reseals, so half a bag survives till evening.', bg: 'var(--color-accent-teal)', turn: -1 },
    { big: 'Fried', small: "Not baked. That's where the crunch comes from.", bg: fill, ink: fillInk, turn: 2.2 },
  ]

  return (
    <section className="jni-facts" aria-labelledby="jni-facts-title">
      <div className="jni-facts-inner">
        <h2 id="jni-facts-title">What’s in the pouch</h2>
        <p className="jni-facts-lede">{product.description}</p>

        <div className="jni-facts-grid">
          {facts.map((f, i) => (
            <Slap key={f.big} i={i} turn={f.turn} style={{ backgroundColor: f.bg, color: f.ink }}>
              <b>{f.big}</b>
              <p>{f.small}</p>
            </Slap>
          ))}

          <Slap i={4} turn={0.8} className="jni-facts-wide" style={{ backgroundColor: '#ffffff' }}>
            <b className="jni-facts-h">Ingredients</b>
            <ul className="jni-facts-ings">
              {product.ingredients?.map((ing, i) => (
                <li key={ing}>
                  <img
                    src={`/assets/doodles/pack/${product.slug}-${ING_SHAPES[i] || 'seed'}.svg`}
                    alt=""
                  />
                  {ing}
                </li>
              ))}
            </ul>
            <p className="jni-facts-note">
              May contain traces of milk, soy and nuts. Manufactured in a facility that also
              processes wheat.
            </p>
          </Slap>

          <Slap i={5} turn={-1.4} className="jni-facts-wide jni-facts-dark">
            <b className="jni-facts-h">How to eat it</b>
            <p>
              Tear along the notch, pour into a bowl (or don&apos;t), and nibble. Reseal the zip-lock
              for later — if there&apos;s any left.
            </p>
          </Slap>
        </div>
      </div>
    </section>
  )
}
