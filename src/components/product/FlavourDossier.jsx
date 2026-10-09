import { useEffect, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { packPalettes } from '../icons/PackDoodles'
import {
  FREE_SHIPPING_THRESHOLD,
  deliveredTotal,
  panelAccent,
  products,
  toCartProduct,
} from '../../data/products'
import { useCart } from '../../store/cartStore'
import { useCrateSubtotal } from '../checkout/cartTotals'
import HeatMeter from './HeatMeter'
import DoodleField from '../ui/DoodleField'
import { Stars } from '../ui/Primitives'
import { responsiveImage } from '../../lib/responsiveImage'
import PouchStage, { StageSwatch, pouchCutout } from './PouchStage'
import { SHOP_HREF } from '../../data/site'

/**
 * The flavour dossier: a product page's hero, built as one spread.
 *
 * WHERE IT CAME FROM
 * This was a hover state on the homepage -- rest the pointer on a pack for a
 * second and the flavour grid flooded with that pouch's colour and the pack
 * rose as an annotated spread with a buy block beside it. It needed a pointer
 * that happened to linger, so touch never saw it, search never indexed it,
 * and a shared link never landed on it. It is the product page now.
 *
 * WHAT IT CARRIES
 * Left, the pouch on its own ground -- tilted, with the flavour's name set
 * huge behind it -- and two notes pinned to the things they point at. Right,
 * the buy block: a switcher to the other two flavours, quantity as chips, the
 * ₹499 free-shipping line made visible while it can still change the order,
 * and a Nibble now that quotes the delivered total so the price cannot grow at
 * the last step.
 *
 * WHAT MOVES
 * Three things, each once: the pouch lands with a squash and its doodles
 * scatter out from behind it; switching flavour floods the new ground out of
 * the chip that was tapped; and Add to cart throws a pouch into the header
 * cart. None of it runs under reduced motion.
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

/* Where the chilli doodles come to rest around the pouch, as percentages of
   the pack column. They start stacked behind the pouch and scatter out. */
const DOODLES = [
  { left: '-16%', top: '40%', w: 56, turn: -24 },
  { left: '98%', top: '-8%', w: 42, turn: 38 },
  { left: '100%', top: '78%', w: 66, turn: -60 },
  { left: '46%', top: '-11%', w: 38, turn: 16 },
]

/*
 * The opening shot: the combo page's torn-band stage, in three tones of this
 * one pouch -- a mid tone, the pouch's bright print colour, then a deep tone.
 * None of the three is the page's own ground, so the frame never melts into
 * the flood around it, and the pouch stands in the bright middle band.
 */
function flavourBands(product, palette) {
  const doodle = (shape) => `/assets/doodles/pack/${product.slug}-${shape}.svg`
  return [
    {
      key: 'mid',
      ground: `color-mix(in oklab, ${palette.ground} 55%, ${palette.fill})`,
      doodles: [doodle('chilli-half'), doodle('seed')],
    },
    {
      key: 'bright',
      ground: palette.fill,
      doodles: [doodle('chilli-slice'), doodle('pepper-section')],
      pouches: [{ key: product.slug, src: pouchCutout(product.slug) }],
      tilt: -4,
    },
    {
      key: 'deep',
      ground: `color-mix(in oklab, ${palette.ground} 45%, ${palette.line})`,
      doodles: [doodle('chilli-whole'), doodle('chilli-half')],
      heat: product,
    },
  ]
}

/* Three tiers reach the free-shipping line in one click without turning the
   panel into a price list. Any other quantity is still available in the cart
   drawer, and the bundles are the path to six. */
const TIERS = [1, 2, 3]

const THUMB_TILTS = [-5, 3, -2, 4, -3]

/* Where the chillies fly when free shipping unlocks: [dx, dy, spin] in px
   and degrees from the end of the progress bar. Fixed rather than random so
   the burst looks the same every time and never lands on the Buy button. */
const BURST = [
  [-70, -64, -140],
  [-24, -92, 200],
  [30, -84, -220],
  [74, -52, 160],
  [96, -8, -120],
  [58, 40, 240],
  [-48, 34, -180],
  [8, 56, 130],
]

const rupee = (n) => `₹${Number(n).toLocaleString('en-IN')}`

/** "Peri Peri Punch" -> "PERI PERI": the flavour without the product noun. */
const bigWord = (product) =>
  (product.shortName || product.name).split(' ').slice(0, -1).join(' ').toUpperCase() ||
  (product.shortName || product.name).toUpperCase()

export default function FlavourDossier({ product, ctaRef, onQtyChange }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const crateSubtotal = useCrateSubtotal()
  const reduce = useReducedMotion()
  const svgRef = useRef(null)
  const stripRef = useRef(null)
  const switchRef = useRef(null)
  const markSwitchEnd = () => {
    const row = switchRef.current
    if (!row) return
    row.toggleAttribute('data-end', row.scrollLeft + row.clientWidth >= row.scrollWidth - 2)
  }

  const [qty, setQty] = useState(1)
  const [shot, setShot] = useState(0)
  const [added, setAdded] = useState(false)
  const [flight, setFlight] = useState(null)
  const [burst, setBurst] = useState(0)
  const priceControls = useAnimationControls()
  const lastQty = useRef(qty)
  // null until first paint, so a crate already past the line doesn't burst on arrival.
  const wasFree = useRef(null)

  const palette = packPalettes[product.slug]
  const ground = palette?.ground || product.theme?.ink
  /* Reuses the PDP's own contrast picker rather than a second hand-kept map.
     The ground here is the pouch print colour, not theme.ink, so it is passed
     in as the background to test against. */
  const accent = panelAccent({ ...product.theme, ink: ground })
  const chilli = `/assets/doodles/pack/${product.slug}-chilli-whole.svg`

  const gallery = product.gallery || []
  // Shot 0 is the stage; 1..n are the photographs.
  const bands = palette ? flavourBands(product, palette) : null
  const slides = gallery.length + (bands ? 1 : 0)
  const photo = bands ? (shot > 0 ? gallery[shot - 1] : null) : gallery[shot] || gallery[0]
  /* The notes and arrows point at features of the POUCH, which stands on the
     stage. On a desk shot or a flat-lay they would be pointing at nothing. */
  const onPackShot = !photo

  // The order Nibble now places: what is in the crate already, plus this.
  const order = crateSubtotal + Number(product.price) * qty
  const freeShipping = order >= FREE_SHIPPING_THRESHOLD
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - order)
  const progress = Math.min(100, (order / FREE_SHIPPING_THRESHOLD) * 100)
  const payable = deliveredTotal(order)

  /* The price sticker wobbles when the quantity changes -- a small "noted" --
     and crossing the free-shipping line fires a burst of chillies off the end
     of the bar. Neither runs on first paint, only on a change. */
  useEffect(() => {
    if (lastQty.current === qty) return
    lastQty.current = qty
    if (reduce) return
    priceControls.start({
      rotate: [0, -7, 5, -2, 0],
      scale: [1, 1.12, 0.97, 1],
      transition: { duration: 0.5, ease: 'easeOut' },
    })
  }, [qty, reduce, priceControls])

  /* The page's sticky mobile bar lives outside the dossier, so it is told
     which chip is lit -- its buy has to add what the reader chose. */
  useEffect(() => {
    onQtyChange?.(qty)
  }, [qty, onQtyChange])

  useEffect(() => {
    if (freeShipping && wasFree.current === false && !reduce) setBurst(Date.now())
    wasFree.current = freeShipping
  }, [freeShipping, reduce])

  useEffect(() => {
    setQty(1)
    setShot(0)
    setAdded(false)
    if (stripRef.current) stripRef.current.scrollLeft = 0
    // On a phone the chips scroll, and the current flavour could start out of
    // view -- the one chip that says where you are. Centre it.
    const row = switchRef.current
    const chip = row?.querySelector('[aria-current="page"]')
    if (row && chip && row.scrollWidth > row.clientWidth) {
      const r = row.getBoundingClientRect()
      const c = chip.getBoundingClientRect()
      row.scrollLeft += c.left - r.left - (r.width - c.width) / 2
    }
    markSwitchEnd()
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

  /* A pouch thumbnail thrown from the button into the header cart. The header
     marks its cart button with data-cart-icon; if it is not on screen there is
     nowhere to throw to, and the button's own "Added" label says enough. */
  const throwToCart = (from) => {
    if (reduce || !from) return
    const target = document.querySelector('[data-cart-icon]')
    if (!target) return
    const a = from.getBoundingClientRect()
    const b = target.getBoundingClientRect()
    if (b.bottom < 0 || b.top > window.innerHeight) return
    const size = 56
    const x0 = a.left + a.width / 2 - size / 2
    const y0 = a.top + a.height / 2 - size / 2
    setFlight({
      key: Date.now(),
      x0,
      y0,
      dx: b.left + b.width / 2 - size / 2 - x0,
      dy: b.top + b.height / 2 - size / 2 - y0,
    })
  }

  const handleAdd = (e) => {
    addItem(toCartProduct(product), qty)
    throwToCart(e.currentTarget)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  /* Add and go -- no drawer, no cart page. When the Shiprocket / GoKwik
     hand-off is wired, this is the call site that should open it. */
  const handleBuyNow = () => {
    addItem(toCartProduct(product), qty)
    navigate('/checkout')
  }

  /* The new flavour's ground grows out of the chip that was tapped. The chips
     are real links, so a middle-click, a crawler or a browser without view
     transitions all still get an ordinary navigation. */
  const switchFlavour = (e, slug) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    if (slug === product.slug) return
    const to = `/flavours/${slug}`
    if (reduce || !document.startViewTransition) {
      navigate(to)
      return
    }
    const r = e.currentTarget.getBoundingClientRect()
    const root = document.documentElement
    root.style.setProperty('--jni-flood-x', `${r.left + r.width / 2}px`)
    root.style.setProperty('--jni-flood-y', `${r.top + r.height / 2}px`)
    document.startViewTransition(() => flushSync(() => navigate(to)))
  }

  /* The phone strip has no thumbnails -- the next photo peeks in instead --
     so the dots follow whichever photo is snapped. */
  const onStripScroll = (e) => {
    const el = e.currentTarget
    const card = el.firstElementChild
    if (!card) return
    const i = Math.round(el.scrollLeft / (card.offsetWidth + 14))
    if (i !== shot) setShot(Math.max(0, Math.min(slides - 1, i)))
  }

  const land = reduce
    ? false
    : { opacity: 0, y: -70, rotate: -2.5, scaleY: 1 }

  return (
    <section
      className="jni-dossier jni-grain px-5 pb-10 sm:px-8 sm:pb-14 lg:px-12"
      style={{ backgroundColor: ground, '--jni-dossier-accent': accent, '--pin': palette?.fill }}
    >
      <DoodleField
        flavour={product.slug}
        ground={ground}
        intensity="subtle"
        count={24}
        seed={product.id * 13 + 3}
      />

      {/* The flavour's name, set as big as the page will take, behind
          everything. It is decoration -- the h1 below says the same thing. */}
      <div className="jni-dossier-word" aria-hidden="true" style={{ color: palette?.fill }}>
        {bigWord(product)}
      </div>

      <div className="jni-dossier-grid">
        {/* ---- the pouch ---- */}
        <div className="jni-dossier-pack">
          <nav aria-label="Breadcrumb" className="jni-dossier-crumbs">
            <Link to={SHOP_HREF}>Flavours</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{product.shortName || product.name}</span>
          </nav>

          <div className="jni-dossier-stage">
            {DOODLES.map((d, i) => (
              <motion.img
                key={`${product.slug}-${i}`}
                src={chilli}
                alt=""
                aria-hidden="true"
                className="jni-dossier-doodle"
                style={{ left: d.left, top: d.top, width: d.w }}
                initial={reduce ? false : { x: '-50%', y: '-50%', left: '45%', top: '45%', scale: 0.3, opacity: 0, rotate: 0 }}
                animate={{ x: 0, y: 0, left: d.left, top: d.top, scale: 1, opacity: 1, rotate: d.turn }}
                transition={{ delay: 0.42 + i * 0.05, type: 'spring', stiffness: 220, damping: 16 }}
              />
            ))}

            <motion.div
              key={product.slug}
              className="jni-dossier-frame"
              style={{ borderColor: palette?.line || '#071a16', transformOrigin: '50% 100%' }}
              initial={land}
              animate={{
                opacity: 1,
                y: 0,
                rotate: -2.5,
                scaleY: reduce ? 1 : [1, 1, 0.93, 1.02, 1],
              }}
              transition={{
                duration: 0.6,
                ease: [0.3, 0.9, 0.35, 1],
                scaleY: { duration: 0.6, times: [0, 0.55, 0.72, 0.88, 1] },
              }}
            >
              {photo ? (
                <motion.img
                  key={photo.src}
                  // Hidden below 1024px, where the swipe strip stands in for it --
                  // but an eager <img> fetches even when hidden, so `sizes` asks
                  // phones for the smallest copy rather than the 1254px original.
                  {...responsiveImage(photo.src, '(min-width: 1024px) min(42vw, 500px), 1px')}
                  alt={photo.alt || `${product.name} pack`}
                  className="jni-dossier-photo"
                  initial={reduce ? false : { opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              ) : (
                <div className="jni-dossier-stagebox" role="img" aria-label={`${product.name} pack`}>
                  {/* The pouch drops once the frame has landed. */}
                  <PouchStage
                    bands={bands}
                    solo
                    delay={0.5}
                    sizes="(min-width: 1024px) min(20vw, 260px), 1px"
                    reduce={reduce}
                  />
                </div>
              )}

              <div className="jni-dossier-annotations" data-off={onPackShot ? undefined : ''}>
                <svg
                  ref={svgRef}
                  className="jni-dossier-marks"
                  viewBox="0 0 100 100"
                  aria-hidden="true"
                />
                {OBJECT_NOTES.map((n, i) => (
                  <span key={n.cls} className={`jni-dossier-note ${n.cls}`} style={{ '--i': i }}>
                    <b>{n.title}</b>
                    {n.body}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {slides > 1 && (
            <div className="jni-dossier-thumbs">
              {bands && (
                <button
                  type="button"
                  aria-label={`View image 1 of ${slides}`}
                  aria-current={shot === 0}
                  style={{ '--tilt': `${THUMB_TILTS[0]}deg` }}
                  onClick={() => setShot(0)}
                >
                  <StageSwatch grounds={bands.map((b) => b.ground)} />
                </button>
              )}
              {gallery.map((img, i) => {
                const n = i + (bands ? 1 : 0)
                return (
                  <button
                    key={img.thumb}
                    type="button"
                    aria-label={`View image ${n + 1} of ${slides}`}
                    aria-current={n === shot}
                    style={{ '--tilt': `${THUMB_TILTS[n % THUMB_TILTS.length]}deg` }}
                    onClick={() => setShot(n)}
                  >
                    <img src={img.thumb} alt="" loading="lazy" decoding="async" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Phones: the whole gallery as a swipe strip, next photo peeking. */}
          <div className="jni-dossier-strip" ref={stripRef} onScroll={onStripScroll}>
            {bands && (
              <div
                className="jni-dossier-strip-card jni-dossier-strip-stage"
                style={{ '--tilt': '-2deg' }}
                role="img"
                aria-label={`${product.name} pack`}
              >
                {/* Below 1024px this is the shot on show, so the drop plays here. */}
                <PouchStage bands={bands} solo delay={0.3} sizes="min(30vw, 160px)" reduce={reduce} />
              </div>
            )}
            {gallery.map((img, i) => {
              const n = i + (bands ? 1 : 0)
              return (
                <div key={img.src} className="jni-dossier-strip-card" style={{ '--tilt': n % 2 ? '2deg' : '-2deg' }}>
                  <img
                    {...responsiveImage(img.src, 'min(78vw, 340px)')}
                    alt={img.alt}
                    loading={n === 0 ? 'eager' : 'lazy'}
                    fetchpriority={n === 0 ? 'high' : undefined}
                    decoding="async"
                  />
                </div>
              )
            })}
          </div>
          {slides > 1 && (
            <div className="jni-dossier-dots" aria-hidden="true">
              {Array.from({ length: slides }, (_, i) => (
                <span key={i} data-on={i === shot ? '' : undefined} />
              ))}
            </div>
          )}
        </div>

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
            {product.rating && (
              <span className="jni-dossier-rating">
                <Stars value={product.rating.value} size={14} />
                {product.rating.value} <i>({product.rating.count} reviews)</i>
              </span>
            )}
          </div>

          <h1 className="jni-dossier-title" style={{ color: accent }}>
            {product.shortName || product.name}
          </h1>
          <p className="jni-dossier-sub">{product.subtitle || product.tagline}</p>

          {/* The other two flavours, one tap away, each with its heat. */}
          <div className="jni-dossier-switch">
            <p className="jni-dossier-k">Pick your heat</p>
            <div className="jni-dossier-switch-row" ref={switchRef} onScroll={markSwitchEnd}>
              {products.map((p) => {
                const on = p.slug === product.slug
                const pal = packPalettes[p.slug]
                return (
                  <Link
                    key={p.slug}
                    to={`/flavours/${p.slug}`}
                    className="jni-dossier-flav"
                    aria-current={on ? 'page' : undefined}
                    style={on ? { backgroundColor: pal?.fill } : undefined}
                    onClick={(e) => switchFlavour(e, p.slug)}
                  >
                    <img src={p.gallery?.[0]?.thumb || p.images.thumb} alt="" />
                    <span>
                      <b>{(p.shortName || p.name).split(' ').slice(0, -1).join(' ')}</b>
                      <HeatMeter
                        product={p}
                        flavour={p.slug}
                        className="jni-dossier-flav-heat"
                        onLight={!on}
                        labelClassName="text-ink/80"
                      />
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="jni-dossier-price">
            <motion.b animate={priceControls}>{rupee(product.price)}</motion.b>
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
            <div className="jni-dossier-ship-bar">
              <div className="jni-dossier-ship-track">
                <div
                  className="jni-dossier-ship-fill"
                  style={{ width: `${progress}%`, backgroundColor: accent }}
                />
              </div>
              <AnimatePresence>
                {burst > 0 &&
                  BURST.map(([dx, dy, spin], i) => (
                    <motion.img
                      key={`${burst}-${i}`}
                      src={chilli}
                      alt=""
                      aria-hidden="true"
                      className="jni-dossier-burst"
                      initial={{ x: 0, y: 0, scale: 0.4, rotate: 0, opacity: 1 }}
                      animate={{ x: dx, y: dy, scale: 1.15, rotate: spin, opacity: [1, 1, 0] }}
                      transition={{
                        duration: 0.9,
                        ease: [0.2, 0.8, 0.3, 1],
                        opacity: { duration: 0.9, times: [0, 0.65, 1] },
                      }}
                      onAnimationComplete={i === 0 ? () => setBurst(0) : undefined}
                    />
                  ))}
              </AnimatePresence>
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
              Nibble now · {rupee(payable)}
            </button>
            <button type="button" className="jni-dossier-ghost" onClick={handleAdd}>
              {added ? `Added — ${qty} in cart` : 'Add to cart'}
            </button>
          </div>

          <p className="jni-dossier-trust">UPI · Cards · COD · Dispatched in 24h</p>
        </motion.div>
      </div>

      {flight &&
        createPortal(
          <motion.img
            key={flight.key}
            src={gallery[0]?.thumb || product.images.thumb}
            alt=""
            aria-hidden="true"
            className="jni-dossier-flight"
            style={{ left: flight.x0, top: flight.y0 }}
            initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
            animate={{
              x: [0, flight.dx * 0.45, flight.dx],
              y: [0, Math.min(0, flight.dy) * 0.5 - 140, flight.dy],
              scale: [1, 0.85, 0.35],
              rotate: [0, 18, 32],
              opacity: [1, 1, 0.2],
            }}
            transition={{ duration: 0.7, ease: [0.45, 0, 0.3, 1] }}
            onAnimationComplete={() => setFlight(null)}
          />,
          document.body
        )}
    </section>
  )
}

