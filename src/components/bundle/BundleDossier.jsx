import { useEffect, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'
import { packPalettes } from '../icons/PackDoodles'
import {
  FREE_SHIPPING_THRESHOLD,
  bundles,
  deliveredTotal,
  perPacketPrice,
} from '../../data/products'
import { launchOffer } from '../../data/site'
import { useCart } from '../../store/cartStore'
import { useCrateSubtotal } from '../checkout/cartTotals'
import HeatMeter from '../product/HeatMeter'
import DoodleField from '../ui/DoodleField'
import LaunchBanner from '../promo/LaunchBanner'
import { boxFlavours, pouchCutout, toCartBundle } from './boxContents'
import { responsiveImage } from '../../lib/responsiveImage'

/**
 * The combo page's hero: the flavour dossier's spread, for a box.
 *
 * A flavour page floods itself in one pouch's colour. A box holds all three,
 * so this is the one place on the site where the three grounds meet: the
 * stage is split into the three pouch colours, torn apart the way the page's
 * seams are, mildest on the left, and each pouch stands up in its own colour
 * -- two deep on the Party Six, because that box really does hold two of
 * each. Everything around the stage stays on the house green, so the buy
 * block reads calm next to it.
 *
 * The buy block is the flavour dossier's, so buying works the same on every
 * product page: box chips instead of a stepper, the free-shipping line, and a
 * Buy now that quotes the delivered total.
 */

const FOREST = '#071a16'
const TIERS = [1, 2, 3]
const TILTS = [-7, 1.5, 8]
const THUMB_TILTS = [-5, 3, -2, 4]
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

/* A torn left edge for the second and third bands, as a clip-path. Seeded, so
   it never reshuffles between renders; x runs 0-7% of the band's width. */
function tornEdge(seed) {
  let s = seed
  const rnd = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  const pts = []
  for (let y = 0; y <= 100; y += 3 + rnd() * 4) {
    const deep = rnd() > 0.85
    pts.push(`${(deep ? 6 + rnd() * 2 : 1 + rnd() * 3).toFixed(1)}% ${Math.min(100, y).toFixed(1)}%`)
  }
  pts.push('2% 100%')
  return `polygon(100% 0, ${pts.join(', ')}, 100% 100%)`
}
const EDGES = [null, tornEdge(29), tornEdge(71)]

const rupee = (n) => `₹${Number(n).toLocaleString('en-IN')}`

/** "FLIPO's Flavour Trio" -> "TRIO": the box without the brand. */
const bigWord = (bundle) =>
  bundle.name
    .replace(/^FLIPO['’]s\s+/i, '')
    .replace(/^Flavour\s+/i, '')
    .toUpperCase()

/* The stage in miniature, for the first thumbnail: three stripes. */
function StageSwatch({ flavours }) {
  return (
    <span className="jni-box-swatch" aria-hidden="true">
      {flavours.map(({ product }) => (
        <i key={product.slug} style={{ backgroundColor: packPalettes[product.slug]?.ground }} />
      ))}
    </span>
  )
}

function Stage({ bundle, flavours, reduce }) {
  return (
    <div className="jni-box-bands">
      {flavours.map(({ product, quantity }, i) => {
        const pal = packPalettes[product.slug] || {}
        const chilli = `/assets/doodles/pack/${product.slug}-chilli-whole.svg`
        return (
          <div
            key={product.slug}
            className="jni-box-band"
            data-pair={quantity > 1 ? '' : undefined}
            style={{ '--i': i, '--n': flavours.length }}
          >
            <div
              className="jni-box-band-fill jni-grain"
              style={{ backgroundColor: pal.ground, clipPath: EDGES[i] || undefined }}
            >
              <img src={chilli} alt="" className="jni-box-band-doodle d-a" />
              <img src={chilli} alt="" className="jni-box-band-doodle d-b" />
              <HeatMeter
                product={product}
                flavour={product.slug}
                className="jni-box-band-heat"
                labelClassName="text-foam/80"
              />
            </div>

            {/* Back to front: the second pouch of a pair stands behind. */}
            {Array.from({ length: quantity }, (_, copy) => quantity - 1 - copy).map((copy) => (
              <motion.img
                key={`${bundle.slug}-${product.slug}-${copy}`}
                {...responsiveImage(pouchCutout(product.slug), '(min-width: 1024px) 200px, 140px')}
                alt=""
                className="jni-box-pouch"
                data-back={copy > 0 ? '' : undefined}
                style={{ transformOrigin: '50% 100%' }}
                initial={reduce ? false : { y: '70%', opacity: 0, rotate: 0, scaleY: 1 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  rotate: TILTS[i % TILTS.length] + (copy ? 7 : 0),
                  scaleY: reduce ? 1 : [1, 1, 0.94, 1.02, 1],
                }}
                transition={{
                  delay: 0.18 + i * 0.12 + (copy ? 0 : 0.06),
                  duration: 0.62,
                  ease: [0.3, 0.9, 0.35, 1],
                  scaleY: { duration: 0.62, times: [0, 0.55, 0.72, 0.88, 1] },
                }}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default function BundleDossier({ bundle, ctaRef, onQtyChange }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const crateSubtotal = useCrateSubtotal()
  const reduce = useReducedMotion()
  const priceControls = useAnimationControls()

  const [qty, setQty] = useState(1)
  const [shot, setShot] = useState(0)
  const [added, setAdded] = useState(false)
  const [flight, setFlight] = useState(null)
  const [burst, setBurst] = useState(0)
  const lastQty = useRef(qty)
  // null until first paint, so a crate already past the line doesn't burst on arrival.
  const wasFree = useRef(null)

  const flavours = boxFlavours(bundle)
  const accent = bundle.theme?.accent || '#f3c63b'
  const gallery = bundle.gallery || []
  // Shot 0 is the stage; 1..n are the studio photographs.
  const photo = shot > 0 ? gallery[shot - 1] : null
  const perPack = perPacketPrice(bundle)

  // The order Buy now places: what is in the crate already, plus this.
  const order = crateSubtotal + Number(bundle.price) * qty
  const freeShipping = order >= FREE_SHIPPING_THRESHOLD
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - order)
  const progress = Math.min(100, (order / FREE_SHIPPING_THRESHOLD) * 100)
  const payable = deliveredTotal(order)
  const chillies = flavours.map(({ product }) => `/assets/doodles/pack/${product.slug}-chilli-whole.svg`)

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
    // A box that is already over the line should not burst on arrival.
    wasFree.current = Number(bundle.price) >= FREE_SHIPPING_THRESHOLD
    lastQty.current = 1
  }, [bundle.slug, bundle.price])

  /* Same throw as the flavour dossier: a thumbnail from the button into the
     header cart, when the header's cart is on screen to be thrown at. */
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
    addItem(toCartBundle(bundle), qty)
    throwToCart(e.currentTarget)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  const handleBuyNow = () => {
    addItem(toCartBundle(bundle), qty)
    navigate('/checkout')
  }

  /* The other box floods in out of the chip that was tapped, the way the
     flavour switcher does. Real links underneath, for everyone else. */
  const switchBox = (e, slug) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    if (slug === bundle.slug) return
    const to = `/combos/${slug}`
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

  return (
    <section
      className="jni-dossier jni-box jni-grain px-5 pb-10 sm:px-8 sm:pb-14 lg:px-12"
      style={{ backgroundColor: FOREST, '--jni-dossier-accent': accent }}
    >
      <DoodleField flavour="jalapeno-kick" ground={FOREST} intensity="subtle" count={20} seed={41} />

      <div className="jni-dossier-word jni-box-word" aria-hidden="true">
        {bigWord(bundle)}
      </div>

      <div className="jni-dossier-screen">
        <div className="jni-dossier-grid">
          {/* ---- the box ---- */}
          <div className="jni-dossier-pack">
            <nav aria-label="Breadcrumb" className="jni-dossier-crumbs">
              <Link to="/combos">Combos</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{bundle.name}</span>
            </nav>

            <div className="jni-box-frame">
              {photo ? (
                <motion.img
                  key={photo.src}
                  {...responsiveImage(photo.src, '(min-width: 1024px) 560px, calc(100vw - 40px)')}
                  alt={photo.alt}
                  className="jni-box-photo"
                  initial={reduce ? false : { opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              ) : (
                <div role="img" aria-label={`The ${flavours.length} flavours in ${bundle.name}, mildest first`}>
                  <Stage bundle={bundle} flavours={flavours} reduce={reduce} />
                </div>
              )}

              {/* Both notes are about the pouches on the stage; on a photograph
                  they would be pinned to nothing. */}
              {!photo && (
                <div className="jni-box-notes">
                  <span className="jni-dossier-note jni-box-note n-a" style={{ '--i': 0 }}>
                    <b>Mildest first</b>
                    Left to right is the order to eat them in.
                  </span>
                  <span className="jni-dossier-note jni-box-note n-b" style={{ '--i': 1 }}>
                    <b>Each one reseals</b>
                    Every pouch has its own zip-lock.
                  </span>
                </div>
              )}
            </div>

            <div className="jni-dossier-thumbs jni-box-thumbs">
              <button
                type="button"
                aria-label="View the flavour lineup"
                aria-current={shot === 0}
                style={{ '--tilt': `${THUMB_TILTS[0]}deg` }}
                onClick={() => setShot(0)}
              >
                <StageSwatch flavours={flavours} />
              </button>
              {gallery.map((img, i) => (
                <button
                  key={img.thumb}
                  type="button"
                  aria-label={`View photo ${i + 1} of ${gallery.length}`}
                  aria-current={shot === i + 1}
                  style={{ '--tilt': `${THUMB_TILTS[(i + 1) % THUMB_TILTS.length]}deg` }}
                  onClick={() => setShot(i + 1)}
                >
                  <img src={img.thumb} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          </div>

          {/* ---- the reason to buy it ---- */}
          <motion.div
            className="jni-dossier-panel"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="jni-dossier-eyebrow">
              {bundle.badge && (
                <span className="jni-dossier-badge" style={{ backgroundColor: accent }}>
                  {bundle.badge}
                </span>
              )}
              {bundle.rating && (
                <span className="jni-dossier-rating">
                  <span className="flex items-center gap-0.5" style={{ color: accent }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                    ))}
                  </span>
                  {bundle.rating.value} <i>({bundle.rating.count} reviews)</i>
                </span>
              )}
            </div>

            <h1 className="jni-dossier-title" style={{ color: accent }}>
              {bundle.name.replace(/^FLIPO['’]s\s+/i, '')}
            </h1>
            <p className="jni-dossier-sub">{bundle.subtitle}</p>

            <div className="jni-dossier-switch">
              <div className="jni-box-switch-k">
                <p className="jni-dossier-k">Pick your box</p>
                <Link to="/flavours" className="jni-box-single">
                  Or pick one flavour <ArrowRight size={14} strokeWidth={3} aria-hidden="true" />
                </Link>
              </div>
              <div className="jni-box-switch-row">
                {bundles.map((b) => {
                  const on = b.slug === bundle.slug
                  return (
                    <Link
                      key={b.slug}
                      to={`/combos/${b.slug}`}
                      className="jni-dossier-flav"
                      aria-current={on ? 'page' : undefined}
                      style={on ? { backgroundColor: accent } : undefined}
                      onClick={(e) => switchBox(e, b.slug)}
                    >
                      <img src={b.gallery?.[0]?.thumb || b.imageUrl} alt="" />
                      <span>
                        <b>{b.name.replace(/^FLIPO['’]s\s+/i, '')}</b>
                        <small className="jni-box-switch-meta">{b.shortName}</small>
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="jni-dossier-price">
              <motion.b animate={priceControls}>{rupee(bundle.price)}</motion.b>
              {bundle.originalPrice > bundle.price && <s>{rupee(bundle.originalPrice)}</s>}
              <em>
                {bundle.weight}
                {perPack ? ` · ${rupee(perPack)} a pack` : ''}
              </em>
            </div>

            <div className="jni-dossier-qty" role="group" aria-label="How many boxes">
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
                    {n} box{n > 1 ? 'es' : ''}
                  </b>
                  <i>{rupee(Number(bundle.price) * n)}</i>
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
                        src={chillies[i % chillies.length]}
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

            <div className="jni-dossier-actions" data-pdp-atc-sentinel="true">
              <button ref={ctaRef} type="button" className="jni-btn jni-dossier-buy" onClick={handleBuyNow}>
                Buy now · {rupee(payable)}
              </button>
              <button type="button" className="jni-dossier-ghost" onClick={handleAdd}>
                {added ? `Added — ${qty} in cart` : 'Add to cart'}
              </button>
            </div>

            <p className="jni-dossier-trust">UPI · Cards · COD · Dispatched in 24h</p>
          </motion.div>
        </div>
      </div>

      {/* The launch offer is this box's own price, so it is shown here and
          nowhere else among the combo pages. */}
      {bundle.slug === launchOffer.slug && (
        <div className="jni-box-offer">
          <LaunchBanner />
        </div>
      )}

      {flight &&
        createPortal(
          <motion.img
            key={flight.key}
            src={gallery[0]?.thumb || bundle.imageUrl}
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
