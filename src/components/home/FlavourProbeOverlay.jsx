import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { packPalettes, doodleComponents } from '../icons/PackDoodles'
import { FREE_SHIPPING_THRESHOLD, deliveredTotal, toCartProduct } from '../../data/products'
import { useCart } from '../../store/cartStore'

/**
 * The pouch, lifted off its card, with the reason to buy it beside it.
 *
 * WHAT THIS REPLACES
 * An earlier pass opened the pack at the card's own position and hung three
 * cream notes off it. Two of those notes ("Reseal it", "Baked") were the same
 * for all three flavours, the third printed the ingredient list, and the layer
 * was pointer-events:none. On a wide screen that left one pouch in the left
 * third and most of the viewport bare colour -- and because the whole grid
 * dissolves behind it, the price, the heat, the weight and the add-to-cart
 * that were on the card all went away. A deliberate hold was rewarded with
 * strictly less than the user already had.
 *
 * WHAT IT IS NOW
 * A one-second hold on one flavour is the most intent anyone shows on this
 * page, so the probe is built as the shortest path to a paid order on the
 * site. The pouch takes the left of a spread; the right carries the flavour's
 * own writing, its heat, and a buy block that ends at checkout rather than in
 * a cart drawer.
 *
 * Only the two notes that are about the OBJECT stay pinned to the photo. The
 * flavour's own character moved into the panel, where it can be set at a size
 * that is readable -- the notes used to run at 10.5px.
 *
 * THE HANDOVER
 * The pack still opens from exactly where the card's photo was. `rect` is the
 * card tile measured by FlavourGrid; on mount we measure where the pack has
 * landed in this layout and set the difference as a transform before the
 * browser paints, then release it. So the pouch travels from the card into the
 * spread instead of a panel appearing over the top of one. Both boxes are
 * square (the card tile is `aspect-square`), so a single uniform scale matches
 * them exactly.
 *
 * It must be interactive -- it carries the buy button -- so unlike the old
 * layer it accepts the pointer, and takes over holding itself open from the
 * card underneath.
 */

/* Arrow coordinates are the prototype's, unchanged: percentages of the square
   photo, which is what the card's tile and this frame both are. */
const ARROWS = [
  { d: 'M21,13 C32,14 39,19 46,26', head: [46, 26, 39.5, 22.5, 40, 29.5] }, // the zip seal
  { d: 'M79,42 C72,44 66,46 60,49', head: [60, 49, 65.5, 46, 66, 52] }, // the window
]

/* Facts about the pouch itself, true of every flavour -- which is exactly why
   they belong on the photograph and not in the panel. */
const OBJECT_NOTES = [
  { cls: 'p-a', title: 'Reseal it', body: 'Zip-lock stand-up pouch — stash the rest for later.' },
  { cls: 'p-b', title: 'Baked', body: 'Not fried. Crisp without the greasy aftertaste.' },
]

/* One doodle per ingredient, in the order products.js lists them: the
   seasoning, the pepper it comes from, the base. Drawn from the pack's own
   artwork rather than set as a comma list. */
const ING_SHAPES = ['chilli-whole', 'pepper-section', 'seed']

/* Buying one pack at ₹170 leaves ₹329 on the table against the ₹499 free
   shipping line, and nothing on the site said so until checkout. Three tiers
   is enough to make the threshold reachable in one click without turning the
   panel into a price list. */
const TIERS = [1, 2, 3]

/* The panel's highlight colour, per flavour.
 *
 * NOT product.theme.secondary, which is what the first pass reached for.
 * Jalapeno's secondary is #043f2d -- a dark green, chosen to sit on the cream
 * PDP -- and the probe's ground is that flavour's pouch print, #0b5c2e. Dark
 * green on dark green: the headline, the chosen quantity chip and the free
 * shipping bar all disappeared. These three are picked to carry on their own
 * ground, and stay inside the brand's existing palette: two are the packs'
 * own secondaries, the third is the site's sunshine. */
const PANEL_ACCENT = {
  'sweet-chilli-rush': '#f8d43a',
  'jalapeno-kick': '#f3c63b',
  'peri-peri-punch': '#f4bd1a',
}

const rupee = (n) => `₹${Number(n).toLocaleString('en-IN')}`

export default function FlavourProbeOverlay({ product, rect, onHold, onClose }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const reduce = useReducedMotion()
  const palette = packPalettes[product.slug]
  const accent = PANEL_ACCENT[product.slug] || 'var(--color-accent-yellow)'

  const svgRef = useRef(null)
  const packRef = useRef(null)
  /* The origin is a snapshot, not a subscription. A resize re-measures it in
     the grid, and reacting to that here would send the pack back to the card
     and fly it in again mid-gesture. */
  const originRef = useRef(rect)
  const hostRef = useRef(null)
  const controls = useAnimationControls()

  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const subtotal = Number(product.price) * qty
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  /* The button quotes what the order costs delivered, not the subtotal. A
     price that grows at the last step is the oldest way to lose a fast
     checkout, and this is the same sum the checkout page will show. */
  const payable = deliveredTotal(subtotal)

  /* Quantity resets with the flavour: carrying "3 packs" across from the pack
     you were looking at to the one you are now looking at would put a number
     on screen nobody chose. */
  useEffect(() => {
    setQty(1)
    setAdded(false)
  }, [product.slug])

  /* THE HANDOVER. useLayoutEffect and controls.set, so the pack is already
     sitting on the card's frame before the first paint -- with `initial` it
     would flash at its final size for one frame first. */
  useLayoutEffect(() => {
    const el = packRef.current
    const host = hostRef.current
    const origin = originRef.current
    if (!el || !host || !origin) return

    const p = el.getBoundingClientRect()
    const h = host.getBoundingClientRect()
    if (!p.width) return

    const from = {
      x: origin.left - (p.left - h.left),
      y: origin.top - (p.top - h.top),
      scale: origin.width / p.width,
    }
    if (reduce) {
      controls.set({ x: 0, y: 0, scale: 1 })
      return
    }
    controls.set(from)
    /* One frame between the two. Called back to back in the same layout
       effect, the start() is swallowed -- the motion component has not
       finished subscribing to these controls yet -- and the pack is left
       parked on the card it came from, overlapping the panel. Handing the
       release to the next frame is the difference between the pouch
       travelling and the pouch never arriving. */
    let raf = requestAnimationFrame(() => {
      raf = 0
      controls.start({
        x: 0,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 190, damping: 25 },
      })
    })
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [product.slug, reduce, controls])

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

  /* The point of the redesign. Add and go -- no drawer, no cart page. This is
     as direct as the checkout gets until the Shiprocket / GoKwik hand-off is
     wired; when it is, this is the call site that should open it. */
  const handleBuyNow = () => {
    addItem(toCartProduct(product), qty)
    navigate('/checkout')
  }

  const Chilli = doodleComponents['chilli-whole']
  const heat = { 'Sweet Heat': 1, 'Fresh Heat': 2, 'Big Heat': 3 }[product.flavor] ?? 0

  return (
    <motion.div
      ref={hostRef}
      className="jni-probe-overlay"
      style={{ '--jni-probe-accent': accent }}
      /* The layer is a backdrop, not a hold target. Holding on the layer meant
         that once it opened -- fixed, covering the whole viewport -- the
         pointer could never leave it, so moving the mouse away no longer
         closed anything and Escape was the only way out. The hold lives on the
         pack and the panel instead (below), and the bare flood between and
         around them dismisses on click. */
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
      role="group"
      aria-label={`${product.shortName} — read the pack and buy`}
    >
      <button type="button" className="jni-probe-close" onClick={onClose} aria-label="Close">
        <X size={18} strokeWidth={3} />
      </button>

      {/* ---- the pouch ---- */}
      <motion.div
        ref={packRef}
        animate={controls}
        className="jni-probe-pack"
        onPointerEnter={() => onHold?.(product.slug)}
        onPointerLeave={() => onHold?.(null)}
      >
        <div
          className="jni-probe-frame"
          style={{ borderColor: palette?.line || '#071a16' }}
        >
          <img
            src={product.images?.plp || product.imageUrl}
            alt={`${product.name} pack`}
            className="jni-probe-photo"
          />
          <svg ref={svgRef} className="jni-probe-marks" viewBox="0 0 100 100" aria-hidden="true" />
          {OBJECT_NOTES.map((n, i) => (
            <span
              key={n.cls}
              className={`jni-probe-note ${n.cls}`}
              style={{ '--pin': palette?.fill, '--i': i }}
            >
              <b>{n.title}</b>
              {n.body}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ---- the reason to buy it ---- */}
      <div
        className="jni-probe-panel"
        onPointerEnter={() => onHold?.(product.slug)}
        onPointerLeave={() => onHold?.(null)}
      >
        <div className="jni-probe-eyebrow">
          {product.badge && (
            <span className="jni-probe-badge" style={{ backgroundColor: palette?.fill }}>
              {product.badge}
            </span>
          )}
          {heat > 0 && (
            <span
              className="jni-probe-heat"
              role="img"
              aria-label={`Heat level ${heat} of 3: ${product.flavor}`}
            >
              {[0, 1, 2].map((i) => (
                <span key={i} data-off={i < heat ? undefined : ''}>
                  <Chilli palette={palette} className="jni-doodle-art" />
                </span>
              ))}
              <em>{product.flavor}</em>
            </span>
          )}
          {product.rating && (
            <span className="jni-probe-rating">
              ★ {product.rating.value} <i>({product.rating.count})</i>
            </span>
          )}
        </div>

        <h3 className="jni-probe-headline" style={{ color: accent }}>
          {product.flavourHeading}
        </h3>
        <p className="jni-probe-blurb">{product.flavourDescription}</p>

        <ul className="jni-probe-ings">
          {product.ingredients?.map((ing, i) => (
            <li key={ing}>
              <img src={`/assets/doodles/pack/${product.slug}-${ING_SHAPES[i] || 'seed'}.svg`} alt="" />
              {ing}
            </li>
          ))}
        </ul>

        {/* Chips rather than a stepper: a stepper costs one click per pack,
            and it cannot show what each step is worth at the moment of
            choosing. Three taps to three packs was three taps too many on the
            fastest path to checkout. */}
        <div className="jni-probe-qty" role="group" aria-label="How many packs">
          {TIERS.map((n) => (
            <button
              key={n}
              type="button"
              className="jni-probe-chip"
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

        <div className="jni-probe-ship">
          <div className="jni-probe-ship-track">
            <div
              className="jni-probe-ship-fill"
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

        <div className="jni-probe-actions">
          <button type="button" className="jni-btn jni-probe-buy" onClick={handleBuyNow}>
            Buy now · {rupee(payable)}
          </button>
          <button type="button" className="jni-probe-ghost" onClick={handleAdd}>
            {added ? `Added — ${qty} in cart` : 'Add to cart instead'}
          </button>
        </div>

        <p className="jni-probe-trust">UPI · Cards · COD · Dispatched in 24h</p>

        <Link to={`/flavours/${product.slug}`} className="jni-probe-more">
          Read the full flavour page
        </Link>
      </div>
    </motion.div>
  )
}
