import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Star } from 'lucide-react'
import { packPalettes } from '../icons/PackDoodles'
import {
  FREE_SHIPPING_THRESHOLD,
  deliveredTotal,
  panelAccent,
  toCartProduct,
} from '../../data/products'
import { useCart } from '../../store/cartStore'
import HeatMeter from './HeatMeter'

/**
 * The flavour dossier: a product page's hero, built as one spread.
 *
 * WHERE IT CAME FROM
 * This was a hover state on the homepage -- rest the pointer on a pack for a
 * second and the flavour grid flooded with that pouch's colour, the cards
 * dissolved, and the pack rose as an annotated spread with a buy block beside
 * it. Good composition, wrong address: it needed a pointer that happened to
 * linger in one place, so touch never saw it, search never indexed it, and a
 * shared link never landed on it.
 *
 * It is the product page now. The composition is unchanged; everything that
 * made it an overlay is gone -- no dwell, no fuse, no dissolving grid, no
 * fixed layer, no close button. Clicking a pack is the gesture, and it is one
 * every device already has.
 *
 * WHAT IT CARRIES
 * Left, the pouch on its own ground with two notes pinned to the things they
 * point at, and the rest of the gallery as a thumbnail rail beneath. Right,
 * the flavour's own writing and a buy block that ends at checkout rather than
 * in a cart drawer: quantity as chips, the ₹499 free-shipping line made
 * visible while it can still change the order, and a Buy now that quotes the
 * delivered total so the price cannot grow at the last step.
 *
 * The h1 is the flavour's name. The probe could lead on `flavourHeading`
 * because the card underneath had already named the pack; a product page is
 * the page ABOUT that pack, so the name leads and the flavour writing moves
 * into its own block lower down -- where the page already kept it.
 */

/* Percentages of the square pack shot, pointing at the zip and the window. */
const ARROWS = [
  { d: 'M21,13 C32,14 39,19 46,26', head: [46, 26, 39.5, 22.5, 40, 29.5] },
  { d: 'M79,42 C72,44 66,46 60,49', head: [60, 49, 65.5, 46, 66, 52] },
]

/* Facts about the pouch itself, true of every flavour -- which is why they
   belong on the photograph rather than in the panel. */
const OBJECT_NOTES = [
  { cls: 'p-a', title: 'Reseal it', body: 'Zip-lock stand-up pouch — stash the rest for later.' },
  { cls: 'p-b', title: 'Fried crisp', body: 'Fried for the snap — the crunch is the whole point.' },
]

/* One doodle per ingredient, in the order products.js lists them: the
   seasoning, the pepper it comes from, the base. */
const ING_SHAPES = ['chilli-whole', 'pepper-section', 'seed']

/* Three tiers reach the free-shipping line in one click without turning the
   panel into a price list. Any other quantity is still available in the cart
   drawer, and the bundles are the path to six. */
const TIERS = [1, 2, 3]

const rupee = (n) => `₹${Number(n).toLocaleString('en-IN')}`

export default function FlavourDossier({ product, ctaRef }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const reduce = useReducedMotion()
  const svgRef = useRef(null)

  const [qty, setQty] = useState(1)
  const [shot, setShot] = useState(0)
  const [added, setAdded] = useState(false)

  const palette = packPalettes[product.slug]
  /* Reuses the PDP's own contrast picker rather than a second hand-kept map.
     The ground here is the pouch print colour, not theme.ink, so it is passed
     in as the background to test against -- jalapeno's theme.secondary is
     #043f2d, which is invisible on its own #0b5c2e. */
  const accent = panelAccent({ ...product.theme, ink: palette?.ground || product.theme?.ink })

  const gallery = product.gallery || []
  const current = gallery[shot] || gallery[0]
  /* The notes and arrows point at features of the POUCH. On a desk shot or a
     flat-lay they would be pointing at nothing. */
  const onPackShot = shot === 0

  const subtotal = Number(product.price) * qty
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  const payable = deliveredTotal(subtotal)

  useEffect(() => {
    setQty(1)
    setShot(0)
    setAdded(false)
  }, [product.slug])

  /*
   * Each path measures itself and hands its own length to the dash reveal: one
   * shared guess makes the short strokes finish early and the long ones snap.
   * `lit` goes on only once every path is sitting hidden, because until --len
   * is set the dash is invalid, the line renders solid, and transitioning out
   * of that state draws every stroke at once on the first frame.
   */
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.classList.remove('lit')
    svg.replaceChildren()
    const ns = 'http://www.w3.org/2000/svg'
    // A second pass a hair off the first, the way a pen goes over a line twice.
    const jitter = (d, k) =>
      d.replace(/\d+(?:\.\d+)?/g, (n) =>
        (Number(n) + Math.sin(Number(n) * 12.9898 + k) * 0.75).toFixed(2)
      )
    ARROWS.forEach((a, i) => {
      const [hx, hy, ax, ay, bx, by] = a.head
      const headD = `M${ax},${ay} L${hx},${hy} L${bx},${by}`
      const specs = [
        [a.d, false],
        [headD, false],
        [jitter(a.d, i + 1), true],
        [jitter(headD, i + 5), true],
      ]
      specs.forEach(([d, ghost]) => {
        const path = document.createElementNS(ns, 'path')
        path.setAttribute('d', d)
        if (ghost) path.setAttribute('class', 'ghost')
        path.style.setProperty('--i', String(i))
        svg.appendChild(path)
        path.style.setProperty('--len', path.getTotalLength().toFixed(1))
      })
    })
    const id = requestAnimationFrame(() => svg.classList.add('lit'))
    return () => cancelAnimationFrame(id)
  }, [product.slug])

  const handleAdd = () => {
    addItem(toCartProduct(product), qty)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  /* Add and go -- no drawer, no cart page. When the Shiprocket / GoKwik
     hand-off is wired, this is the call site that should open it. */
  const handleBuyNow = () => {
    addItem(toCartProduct(product), qty)
    navigate('/checkout')
  }

  return (
    <section
      className="jni-dossier px-5 pb-10 sm:px-8 sm:pb-14 lg:px-12"
      style={{
        backgroundColor: palette?.ground || product.theme?.ink,
        '--jni-dossier-accent': accent,
      }}
    >
      <div className="jni-dossier-grid">
        {/* ---- the pouch ---- */}
        <motion.div
          className="jni-dossier-pack"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="jni-dossier-frame"
            style={{ borderColor: palette?.line || '#071a16' }}
          >
            <motion.img
              key={current?.src}
              src={current?.src}
              alt={current?.alt || `${product.name} pack`}
              className="jni-dossier-photo"
              initial={reduce ? false : { opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />

            <div className="jni-dossier-annotations" data-off={onPackShot ? undefined : ''}>
              <svg
                ref={svgRef}
                className="jni-dossier-marks"
                viewBox="0 0 100 100"
                aria-hidden="true"
              />
              {OBJECT_NOTES.map((n, i) => (
                <span
                  key={n.cls}
                  className={`jni-dossier-note ${n.cls}`}
                  style={{ '--pin': palette?.fill, '--i': i }}
                >
                  <b>{n.title}</b>
                  {n.body}
                </span>
              ))}
            </div>
          </div>

          {gallery.length > 1 && (
            <div className="jni-dossier-thumbs">
              {gallery.map((img, i) => (
                <button
                  key={img.thumb}
                  type="button"
                  aria-label={`View image ${i + 1} of ${gallery.length}`}
                  aria-current={i === shot}
                  onClick={() => setShot(i)}
                >
                  <img src={img.thumb} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* ---- the reason to buy it ---- */}
        <motion.div
          className="jni-dossier-panel"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="jni-dossier-eyebrow">
            {product.badge && (
              <span className="jni-dossier-badge" style={{ backgroundColor: palette?.fill }}>
                {product.badge}
              </span>
            )}
            <HeatMeter
              product={product}
              flavour={product.slug}
              litFill={accent}
              labelClassName="text-foam/75"
            />
            {product.rating && (
              <span className="jni-dossier-rating">
                <span className="flex items-center gap-0.5" style={{ color: accent }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                  ))}
                </span>
                {product.rating.value} <i>({product.rating.count} reviews)</i>
              </span>
            )}
          </div>

          <h1 className="jni-dossier-title" style={{ color: accent }}>
            {product.shortName || product.name}
          </h1>
          <p className="jni-dossier-sub">{product.subtitle || product.tagline}</p>

          <ul className="jni-dossier-ings">
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

          <div className="jni-dossier-price">
            <b>{rupee(product.price)}</b>
            {product.originalPrice > product.price && (
              <s>{rupee(product.originalPrice)}</s>
            )}
            <em>{product.weight}</em>
          </div>

          {/* Chips rather than a stepper: a stepper costs one click per pack and
              cannot say what the next step is worth while you are choosing. */}
          <div className="jni-dossier-qty" role="group" aria-label="How many packs">
            {TIERS.map((n) => (
              <button
                key={n}
                type="button"
                className="jni-dossier-chip"
                aria-pressed={n === qty}
                style={n === qty ? { backgroundColor: accent } : undefined}
                onClick={() => setQty(n)}
              >
                <b>
                  {n} pack{n > 1 ? 's' : ''}
                </b>
                <i>{rupee(Number(product.price) * n)}</i>
              </button>
            ))}
          </div>

          <div className="jni-dossier-ship">
            <div className="jni-dossier-ship-track">
              <div
                className="jni-dossier-ship-fill"
                style={{ width: `${progress}%`, backgroundColor: accent }}
              />
            </div>
            <p>
              {freeShipping ? (
                <>
                  <b>Free shipping unlocked.</b> Nothing more to add.
                </>
              ) : (
                <>
                  <b>{rupee(remaining)} to go</b> for free shipping.
                </>
              )}
            </p>
          </div>

          {/* The sticky mobile bar watches this button, and the page's own
              sentinel marks the row, so both contracts stay where they were. */}
          <div className="jni-dossier-actions" data-pdp-atc-sentinel="true">
            <button
              ref={ctaRef}
              type="button"
              className="jni-btn jni-dossier-buy"
              onClick={handleBuyNow}
            >
              Buy now · {rupee(payable)}
            </button>
            <button type="button" className="jni-dossier-ghost" onClick={handleAdd}>
              {added ? `Added — ${qty} in cart` : 'Add to cart instead'}
            </button>
          </div>

          <p className="jni-dossier-trust">UPI · Cards · COD · Dispatched in 24h</p>

          <div className="jni-dossier-more">
            <p className="k">The flavour</p>
            <h2>{product.flavourHeading}</h2>
            <p className="b">{product.flavourDescription}</p>
          </div>

          <div className="jni-dossier-more">
            <p className="k">Designed for your desk</p>
            <p className="b">
              Between meetings. During that 4 PM slump. While finishing the last email.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
