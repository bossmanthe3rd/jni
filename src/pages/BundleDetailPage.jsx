import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Minus, Plus, Star } from 'lucide-react'
import { getBundleBySlug, perPacketPrice, savingsPercent, products } from '../data/products'
import { useCart } from '../store/cartStore'
import { ProductCard } from '../components/product/ProductCard'
import ProductAccordion from '../components/product/ProductAccordion'
import { SmartImage, Sparkle } from '../components/ui/Primitives'

function buildBundleAccordion(bundle, perPacket) {
  return [
    { title: 'Product Description', content: <p>{bundle.description}</p> },
    {
      title: "What's Inside",
      content: (
        <ul className="space-y-1.5">
          {bundle.includes.map((line) => (
            <li key={line} className="flex items-center gap-2">
              <Check size={15} className="shrink-0 text-jalapeno" /> {line}
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: 'Product Specifications',
      content: (
        <ul className="space-y-1.5">
          <li>
            <strong className="text-sunshine">Total weight:</strong> {bundle.weight}
          </li>
          <li>
            <strong className="text-sunshine">Packs included:</strong> {bundle.packetCount}
          </li>
          <li>
            <strong className="text-sunshine">Price per packet:</strong> ₹{perPacket}
          </li>
          <li>
            <strong className="text-sunshine">Shelf life:</strong> 6 months from packaging
          </li>
          <li>
            <strong className="text-sunshine">Packaging:</strong> Resealable stand-up pouches
          </li>
        </ul>
      ),
    },
    {
      title: 'Ingredients Details',
      content: (
        <>
          <p>
            Jalapeño seasoning, sweet chilli seasoning, peri peri seasoning, green pepper, red
            chilli, crisp baked base.
          </p>
          <p className="mt-2 text-xs text-white/45">
            May contain traces of milk, soy and nuts. Manufactured in a facility that also processes
            wheat.
          </p>
        </>
      ),
    },
    {
      title: 'FAQ',
      content: (
        <div className="space-y-3">
          <div>
            <p className="font-bold text-sunshine">Can I swap the flavours in this box?</p>
            <p>
              Not yet — the mix is fixed for launch. Add singles to your cart alongside it if you
              want extras.
            </p>
          </div>
          <div>
            <p className="font-bold text-sunshine">Is this cheaper than buying singles?</p>
            <p>Yes — it works out to ₹{perPacket} per packet instead of ₹169.</p>
          </div>
          <div>
            <p className="font-bold text-sunshine">How long does delivery take?</p>
            <p>2-4 days across most metro and regional zones.</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Customer Reviews',
      content: (
        <p>
          Rated {bundle.rating.value}/5 from {bundle.rating.count} nibblers so far. Reviews are on
          the way — be the first to leave one after your order.
        </p>
      ),
    },
  ]
}

export default function BundleDetailPage() {
  const { slug } = useParams()
  const bundle = getBundleBySlug(slug)
  const [qty, setQty] = useState(1)
  const { addItem, openCart } = useCart()

  useEffect(() => {
    if (bundle) document.title = `${bundle.name} | Just Nibble It`
    setQty(1)
  }, [bundle])

  if (!bundle) return <Navigate to="/combos" replace />

  const perPacket = perPacketPrice(bundle)
  const save = savingsPercent(bundle.price, bundle.originalPrice)
  const accent = bundle.theme.accent

  const handleAdd = () => {
    addItem({ ...bundle, selectedWeight: bundle.includes.join(', ') }, qty)
    openCart()
  }

  return (
    <div className="min-w-0 flex-grow">
      <main className="bg-cream pb-20 pt-[var(--site-header-offset)] md:pb-0">
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
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="jni-card relative aspect-[4/5] max-h-[560px] overflow-hidden bg-[#F7F1C8]"
            >
              <SmartImage
                src={bundle.imageUrl}
                alt={`${bundle.name} party snack combo`}
                width="1400"
                height="1750"
                className="h-full w-full object-cover"
              />
              <span className="absolute left-3 top-3 z-[2] rounded-pill border-thick border-outline bg-sunshine px-3 py-1.5 text-[10px] font-black uppercase text-ink">
                {bundle.badge}
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="flex flex-col rounded-[28px] border-[3px] border-ink p-5 sm:p-7"
              style={{ backgroundColor: bundle.theme.ink, color: '#ffffff' }}
            >
              <p
                className="text-xs font-black uppercase tracking-[0.15em]"
                style={{ color: accent }}
              >
                FLIPO&apos;s Combo
              </p>
              <h1 className="mt-2 flex items-center gap-2 font-display text-3xl leading-[0.98] sm:text-4xl lg:text-5xl">
                {bundle.name}
                <Sparkle className="h-5 w-5" color={accent} />
              </h1>
              <p className="mt-2 text-base font-black leading-snug text-white/90 sm:text-lg">
                {bundle.subtitle}
              </p>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-0.5" style={{ color: accent }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <span className="text-xs font-bold text-white/70">
                  {bundle.rating.value}/5 | {bundle.rating.count} Reviews
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-baseline gap-3">
                <span className="font-display text-4xl" style={{ color: accent }}>
                  ₹{bundle.price}
                </span>
                <span className="text-base font-bold text-white/40 line-through">
                  ₹{bundle.originalPrice}
                </span>
                <span className="rounded-pill border-[2px] border-teal px-2.5 py-1 text-[10px] font-black uppercase text-teal">
                  Save {save}%
                </span>
              </div>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white/50">
                {bundle.weight} · ₹{perPacket} per packet
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

              <button type="button" onClick={handleAdd} className="jni-btn mt-4 w-full text-base">
                Nibble Now
              </button>

              <div className="mt-6 border-t border-white/15 pt-5">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-white/50">
                  The Flavour
                </p>
                <h2 className="mt-1 font-display text-2xl" style={{ color: accent }}>
                  {bundle.flavourHeading}
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-white/70">
                  {bundle.flavourDescription}
                </p>
              </div>

              <div className="mt-5 border-t border-white/15 pt-5">
                <p className="flex items-center gap-2 font-display text-2xl">
                  Designed for Your Desk <Sparkle className="h-4 w-4" color={accent} />
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
            <ProductAccordion items={buildBundleAccordion(bundle, perPacket)} />
          </motion.div>
        </section>

        <section className="jni-section-dark px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
          <p className="text-xs font-black uppercase text-sunshine">Inside the box</p>
          <h2 className="mb-7 mt-1 font-display text-3xl text-teal sm:text-4xl">
            Meet the flavours.
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => (
              <ProductCard key={product.slug} product={product} index={i} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
