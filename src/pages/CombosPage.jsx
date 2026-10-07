import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, ShoppingBag } from 'lucide-react'
import { bundles, perPacketPrice, savingsPercent } from '../data/products'
import { useCart } from '../store/cartStore'
import { SmartImage, Sparkle, Blob } from '../components/ui/Primitives'
import { StarDoodle } from '../components/icons/WhyIcons'
import DoodleField from '../components/ui/DoodleField'
import LaunchBanner from '../components/promo/LaunchBanner'

function ComboCard({ bundle, index }) {
  const { addItem, openCart } = useCart()
  const save = savingsPercent(bundle.price, bundle.originalPrice)
  const perPacket = perPacketPrice(bundle)

  const handleAdd = () => {
    addItem({ ...bundle, selectedWeight: bundle.includes.join(', ') })
    openCart()
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border-[4px] border-ink bg-cream p-5 text-ink shadow-doodle-lg sm:rounded-[36px] sm:p-7"
    >
      <div className="relative">
        <div className="overflow-hidden rounded-card">
          <SmartImage
            src={bundle.imageUrl}
            alt={`${bundle.name} party snack combo`}
            width="1920"
            height="800"
            className="aspect-[16/10] h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        </div>
        <span className="absolute left-3 top-3 z-[2] rounded-full border-[3px] border-outline bg-sunshine px-2.5 py-1 text-xs font-black uppercase text-ink">
          {bundle.badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col pt-5 text-ink">
        <div className="mb-3 w-fit rounded-full border-[3px] border-outline bg-teal px-2 py-1 text-xs font-black uppercase text-ink">
          Save {save}%
        </div>
        <h3 className="font-display text-2xl leading-tight text-forest sm:text-3xl">
          {bundle.name}
        </h3>
        <p className="mt-2 text-sm leading-5 text-ink/70">{bundle.description}</p>

        <div className="mt-4 space-y-1.5">
          {bundle.includes.map((line) => (
            <p key={line} className="flex items-center gap-2 text-xs font-bold">
              <Check size={14} className="shrink-0 text-forest" /> {line}
            </p>
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center pt-5">
          <div className="mb-3 flex w-full flex-wrap items-center gap-2">
            <p className="text-3xl text-forest">₹{bundle.price}</p>
            <span className="text-sm font-bold text-ink/45 line-through">
              ₹{bundle.originalPrice}
            </span>
            <span className="rounded-full border-[3px] border-outline bg-jalapeno px-2.5 py-1 text-xs font-black uppercase text-ink">
              Just ₹{perPacket} / packet
            </span>
          </div>
          <p className="mb-4 w-full text-xs font-bold text-ink/55">
            ₹{bundle.price} ({bundle.packetCount} packs · ₹{perPacket}/packet)
          </p>
          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Add ${bundle.name}`}
            className="jni-btn px-12 py-3 text-base"
          >
            <ShoppingBag size={16} />
            Add the bundle
          </button>
        </div>
      </div>
    </motion.article>
  )
}

export default function CombosPage() {
  useEffect(() => {
    document.title = "Combo Packs | Just Nibble It"
  }, [])

  return (
    <div className="min-w-0 flex-grow">
      <div className="bg-forest pt-[var(--site-header-offset)]">
        {/* Hero banner.

            It used to be a photo composite under a forest scrim with an
            overlaid headline. The launch artwork carries its own headline,
            price and timer, so scrimming it would bury the thing it exists to
            say -- it runs unscrimmed, and the offer is restated as text
            underneath where a crawler and a screen reader can reach it. */}
        {/* A little ground above it: the header badge carries the lockup too,
            and with the banner flush to the row the two stacked up a few pixels
            apart. */}
        <LaunchBanner className="pt-3 sm:pt-5" />

        {/* Bundles */}
        <section
          id="bundles"
          className="jni-section-dark relative isolate overflow-hidden py-12 sm:py-14 lg:py-16"
        >
          {/* All three flavours share this band, so it takes the house green
              rather than picking a side. */}
          <DoodleField
            flavour="jalapeno-kick"
            ground="#071A16"
            intensity="medium"
            count={24}
            seed={19}
          />
          <Blob className="absolute left-[3%] top-16 h-6 w-6 opacity-70" />
          <StarDoodle className="absolute right-[8%] top-24 h-6 w-6 opacity-60" />
          <Sparkle className="absolute left-[28%] bottom-24 h-6 w-6 opacity-50" />

          <div className="relative z-[1] px-5 sm:px-8 lg:px-12">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 text-xs font-black uppercase text-teal">Combo drops</p>
                <h2 className="font-display text-4xl leading-[1.02] text-sunshine sm:text-5xl lg:text-6xl">
                  More bags.
                  <br />
                  Better maths.
                </h2>
              </div>
              <p className="max-w-sm text-sm font-bold leading-6 text-foam/65 md:text-right">
                Launch pricing for desks, movie nights, parties, and mysterious private stashes.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {bundles.map((bundle, i) => (
                <ComboCard key={bundle.slug} bundle={bundle} index={i} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
