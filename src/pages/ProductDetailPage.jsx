import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Minus, Plus, Star } from 'lucide-react'
import { bundles, getProductBySlug, panelAccent, toCartProduct } from '../data/products'
import { useCart } from '../store/cartStore'
import Testimonials from '../components/home/Testimonials'
import { ProductCard } from '../components/product/ProductCard'
import ProductAccordion, { buildAccordionItems } from '../components/product/ProductAccordion'
import { Sparkle } from '../components/ui/Primitives'
import DoodleField from '../components/ui/DoodleField'
import HeatMeter from '../components/product/HeatMeter'
import StickyAtcBar from '../components/product/StickyAtcBar'
import { FlameIcon } from '../components/icons/WhyIcons'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const product = getProductBySlug(slug)
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const ctaRef = useRef(null)
  const { addItem, openCart } = useCart()

  // The live site injects Product JSON-LD per PDP.
  useEffect(() => {
    if (!product) return
    document.title = `${product.name} | Just Nibble It`
    const tag = document.createElement('script')
    tag.type = 'application/ld+json'
    tag.dataset.productSchema = product.slug
    tag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: [product.images.pdp],
      description: product.description,
      brand: { '@type': 'Brand', name: 'Just Nibble It' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: product.price,
        availability: 'https://schema.org/InStock',
      },
    })
    document.head.appendChild(tag)
    return () => tag.remove()
  }, [product])

  useEffect(() => {
    setActiveImage(0)
    setQty(1)
  }, [slug])

  if (!product) return <Navigate to="/flavours" replace />

  const theme = product.theme
  // theme.accent is a near-neighbour of theme.ink on two of the three flavours;
  // see panelAccent in data/products.js.
  const accentOnPanel = panelAccent(theme)
  const gallery = product.gallery
  const current = gallery[activeImage] || gallery[0]

  const handleAdd = () => {
    addItem(toCartProduct(product), qty)
    openCart()
  }

  return (
    <div className="min-w-0 flex-grow">
      <div className="bg-cream pb-20 pt-[var(--site-header-offset)] md:pb-0">
        <section className="px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              to="/"
              className="group mb-5 inline-flex h-12 items-center gap-2 rounded-pill border-[3px] border-ink bg-sunshine px-5 text-sm font-black text-ink shadow-doodle transition hover:-translate-y-0.5 hover:shadow-doodle-lg"
            >
              <ArrowLeft size={16} /> Back home
            </Link>
          </motion.div>

          <div className="grid gap-5 lg:grid-cols-[1.05fr,0.95fr] lg:gap-7">
            {/* Gallery */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-row gap-2.5 sm:gap-4">
                <div className="flex w-16 flex-none flex-col gap-2 sm:w-20 sm:gap-3">
                  {gallery.map((img, i) => (
                    <button
                      key={img.thumb}
                      type="button"
                      aria-label={`View image ${i + 1} of ${gallery.length}`}
                      aria-current={i === activeImage}
                      onClick={() => setActiveImage(i)}
                      className={`aspect-square w-full shrink-0 overflow-hidden rounded-xl border-[3px] bg-[#F7F1C8] transition sm:rounded-2xl ${
                        i === activeImage
                          ? 'border-ink shadow-doodle'
                          : 'border-ink/15 hover:border-ink/40'
                      }`}
                    >
                      <img
                        src={img.thumb}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                <div className="jni-card relative aspect-[4/5] max-h-[560px] min-w-0 flex-1 overflow-hidden bg-[#F7F1C8]">
                  <motion.img
                    key={current.src}
                    src={current.src}
                    alt={current.alt}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="absolute left-3 top-3 z-[1] rounded-pill border-thick border-outline bg-sunshine px-3 py-1.5 text-[10px] font-black uppercase text-ink">
                    {product.badge}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Themed info panel */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="flex flex-col rounded-[28px] border-[3px] border-ink p-6 sm:p-9"
              style={{ backgroundColor: theme.ink, color: '#ffffff' }}
            >
              {/* Kicker, rating and price are chips on the live site, not bare
                  text. On a saturated panel the flat versions all landed at the
                  same weight, so nothing in the column had a hierarchy -- the
                  price read no louder than the weight under it. */}
              <span className="inline-flex w-fit items-center rounded-pill border-[3px] border-ink bg-teal px-4 py-1.5 font-brand text-sm text-ink shadow-doodle sm:text-base">
                {product.category}
              </span>
              <h1 className="mt-4 flex items-center gap-3 font-display text-4xl leading-[0.98] sm:text-5xl lg:text-6xl">
                {product.shortName}
                {/* Outlined flame in the flavour's accent, the way the live PDP
                    marks heat -- the sparkle here rendered as a dark blot
                    against the panel. */}
                <FlameIcon
                  className="h-7 w-7 shrink-0 sm:h-9 sm:w-9"
                  fill="none"
                  stroke={accentOnPanel}
                  spark={null}
                />
              </h1>
              <p className="mt-3 text-lg font-black leading-snug text-white/90 sm:text-xl">
                {product.subtitle}
              </p>

              <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-pill border-2 border-white/30 px-3.5 py-1.5">
                <div className="flex items-center gap-0.5 text-sunshine">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <span className="text-sm font-bold text-white/80">
                  {product.rating.value}/5 | {product.rating.count} Reviews
                </span>
              </div>

              {/* The brand has a heat ramp and the homepage shows it, but the
                  page where you actually decide never mentioned heat. */}
              <HeatMeter
                product={product}
                flavour={product.slug}
                litFill={accentOnPanel}
                className="mt-3.5"
              />

              <div
                className="mt-5 flex flex-wrap items-center gap-4"
                data-pdp-atc-sentinel="true"
              >
                <span className="rounded-[18px] border-[3px] border-ink bg-[var(--color-cta-yellow)] px-4 py-1.5 font-display text-4xl text-ink shadow-doodle sm:text-5xl">
                  ₹{product.price}
                </span>
                <span className="text-lg font-bold text-white/40 line-through">
                  ₹{product.originalPrice}
                </span>
                {product.originalPrice > product.price && (
                  <span className="rounded-pill border-2 border-teal px-3 py-1 text-xs font-black uppercase tracking-wide text-teal">
                    Save ₹{product.originalPrice - product.price}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs font-bold uppercase tracking-wide text-white/50">
                {product.weight}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 items-center justify-between rounded-pill border-[3px] border-white/25 bg-white/10 p-1">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-9 w-9 place-items-center rounded-pill text-white"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-6 text-center text-sm font-black">{qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => q + 1)}
                    className="grid h-9 w-9 place-items-center rounded-pill text-white"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {/* A pill, centred -- not a full-bleed bar. Stretched edge to edge
                  the CTA lost the organic button silhouette the rest of the site
                  uses and read as a form submit. */}
              <button
                ref={ctaRef}
                type="button"
                onClick={handleAdd}
                className="jni-btn mt-6 self-center px-10 py-3 text-base sm:text-lg"
              >
                Nibble Now
              </button>

              <div className="mt-6 border-t border-white/15 pt-5">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-white/50">
                  The Flavour
                </p>
                <h2 className="mt-1 font-display text-2xl" style={{ color: accentOnPanel }}>
                  {product.flavourHeading}
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-white/70">
                  {product.flavourDescription}
                </p>
              </div>

              <div className="mt-5 border-t border-white/15 pt-5">
                <p className="flex items-center gap-2 font-display text-2xl">
                  Designed for Your Desk <Sparkle className="h-4 w-4" color={accentOnPanel} />
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-white/70">
                  Between meetings. During that 4 PM slump. While finishing the last email.
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            className="mt-6"
          >
            <ProductAccordion items={buildAccordionItems(product)} />
          </motion.div>
        </section>

        {/* Bundle upsell */}
        <section
          className="jni-section-dark relative isolate overflow-hidden px-5 py-10 sm:px-8 sm:py-12 lg:px-12"
        >
          {/* Tinted to the flavour being viewed, so the band belongs to this
              product rather than being the same dark slab on every PDP. */}
          <DoodleField
            flavour={product.slug}
            ground="#071A16"
            intensity="medium"
            count={26}
            seed={product.id * 13 + 3}
          />
          <div className="relative z-10">
          <p className="text-xs font-black uppercase text-sunshine">Do not stop now</p>
          <h2 className="mb-7 mt-1 font-display text-3xl text-teal sm:text-4xl">
            Go for the pack of 3 or the pack of 6.
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {bundles.map((bundle, i) => (
              <ProductCard key={bundle.slug} product={bundle} index={i} />
            ))}
          </div>
        </div>
        </section>
      </div>

      <Testimonials />

      <StickyAtcBar
        name={product.shortName || product.name}
        price={product.price}
        originalPrice={product.originalPrice}
        onAdd={handleAdd}
        watchRef={ctaRef}
      />
    </div>
  )
}
