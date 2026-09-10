import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, Check, ShoppingBag } from 'lucide-react'
import { bundles, perPacketPrice, savingsPercent } from '../data/products'
import { useCart } from '../store/cartStore'
import { SmartImage, Sparkle, Blob } from '../components/ui/Primitives'
import { StarDoodle } from '../components/icons/WhyIcons'

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
      className="group relative flex h-full flex-col overflow-hidden text-foam"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-card">
        <SmartImage
          src={bundle.imageUrl}
          alt={`${bundle.name} party snack combo`}
          width="1920"
          height="800"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 z-[2] rounded-full border-[3px] border-outline bg-sunshine px-2.5 py-1 text-[10px] font-black uppercase text-ink">
          {bundle.badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col pt-5">
        <div className="mb-3 w-fit rounded-full border-[3px] border-outline bg-teal px-2 py-1 text-[10px] font-black uppercase text-ink">
          Save {save}%
        </div>
        <h3 className="font-display text-2xl leading-tight text-sunshine sm:text-3xl">
          {bundle.name}
        </h3>
        <p className="mt-2 text-sm leading-5 text-foam/70">{bundle.description}</p>

        <div className="mt-4 space-y-1.5">
          {bundle.includes.map((line) => (
            <p key={line} className="flex items-center gap-2 text-xs font-bold">
              <Check size={14} className="shrink-0 text-jalapeno" /> {line}
            </p>
          ))}
        </div>

        <div className="mt-auto pt-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="font-display text-3xl text-sunshine">₹{bundle.price}</p>
            <span className="text-sm font-bold text-foam/45 line-through">
              ₹{bundle.originalPrice}
            </span>
            <span className="rounded-full border-[3px] border-outline bg-jalapeno px-2.5 py-1 text-[11px] font-black uppercase text-ink">
              Just ₹{perPacket} / packet
            </span>
          </div>
          <p className="mb-3 text-xs font-bold text-foam/55">
            ₹{bundle.price} ({bundle.packetCount} packs · ₹{perPacket}/packet)
          </p>
          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Add ${bundle.name}`}
            className="jni-btn w-full"
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
      <main className="bg-forest pt-[var(--site-header-offset)]">
        {/* Hero banner */}
        <section className="relative aspect-[4/5] min-h-[430px] overflow-hidden md:aspect-[2.4/1] md:min-h-[340px]">
          <img
            src="/assets/products/flipos-promo.webp"
            alt="FLIPO's party snack combo banner"
            width="1920"
            height="800"
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-forest/45 md:bg-forest/25" />
          <div className="absolute inset-y-0 left-0 hidden w-[58%] bg-forest/80 md:block" />
          <div className="absolute inset-x-0 bottom-0 h-[72%] bg-forest/80 md:hidden" />
          <div className="absolute inset-0 flex max-w-3xl flex-col justify-end px-5 pb-7 text-foam sm:px-8 md:justify-center md:px-[6vw] md:pb-0">
            <p className="text-xs font-black uppercase text-sunshine">More packs. Better maths.</p>
            <h1 className="mt-2 font-display text-4xl leading-[0.98] text-teal sm:text-5xl lg:text-6xl">
              Build the loudest
              <br />
              snack table.
            </h1>
            <a href="#bundles" className="jni-btn mt-5 w-fit">
              See combo pricing <ArrowDown size={16} />
            </a>
          </div>
        </section>

        {/* Bundles */}
        <section
          id="bundles"
          className="jni-section-dark relative overflow-x-hidden py-12 sm:py-14 lg:py-16"
        >
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
      </main>
    </div>
  )
}
