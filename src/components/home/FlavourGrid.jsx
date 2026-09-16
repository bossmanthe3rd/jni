import { motion } from 'framer-motion'
import { bundles, products } from '../../data/products'
import { BundleCard, ProductCard } from '../product/ProductCard'
import FlipSpot from '../mascot/FlipSpot'
import { BrandHeading, Blob, Sparkle } from '../ui/Primitives'

const DOODLES = [
  '/assets/doodles/sweet.png',
  '/assets/doodles/jalapeno.png',
  '/assets/doodles/chillie_art.png',
  '/assets/doodles/rounded_chillie.png',
  '/assets/doodles/Asset_4.png',
]

/** Deterministic scatter config, identical to the live site's generator. */
function doodleConfig(i) {
  const n = i + 5
  return {
    src: DOODLES[i % DOODLES.length],
    left: ((n * 23) % 92) + 2,
    bottom: -6 + ((n * 7) % 16),
    size: 22 + ((n * 5) % 20),
    rotate: ((n * 37) % 60) - 30,
    delay: (i % 6) * 0.09,
  }
}

function FallingIngredients({ count = 11, className = '' }) {
  const items = Array.from({ length: count }, (_, i) => doodleConfig(i))
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {items.map((item, i) => (
        <motion.img
          key={i}
          src={item.src}
          alt=""
          className="absolute object-contain drop-shadow-[2px_3px_0_rgba(0,0,0,0.15)]"
          style={{
            left: `${item.left}%`,
            bottom: `${item.bottom}px`,
            width: item.size,
            height: item.size,
          }}
          initial={{ y: -160, opacity: 0, rotate: item.rotate - 40 }}
          whileInView={{ y: 0, opacity: 0.92, rotate: item.rotate }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            duration: 0.9 + (i % 4) * 0.15,
            delay: item.delay,
            ease: [0.34, 1.4, 0.64, 1],
          }}
        />
      ))}
    </div>
  )
}

/** Small cluster of triangle confetti that flanks a section heading. */
export function TriangleCluster({ className = '' }) {
  const tris = [
    { cls: 'absolute -left-8 top-1 h-5 w-5', fill: '#F3C63B' },
    { cls: 'absolute -left-3 -top-6 h-4 w-4 rotate-45', fill: '#F3C63B' },
    { cls: 'absolute left-2 -top-5 h-3.5 w-3.5 -rotate-12', fill: '#F3C63B' },
    { cls: 'absolute left-10 -top-2 h-3 w-3 rotate-6', fill: '#F3C63B' },
    { cls: 'absolute left-14 top-2 h-2.5 w-2.5 -rotate-6', fill: '#E85D4C' },
  ]
  return (
    <span className={`pointer-events-none ${className}`} aria-hidden="true">
      {tris.map((t, i) => (
        <svg key={i} className={t.cls} viewBox="0 0 20 20">
          <path d="M10 2 18 16H2Z" fill={t.fill} stroke="#071A16" strokeWidth="2" />
        </svg>
      ))}
    </span>
  )
}

const ORDER = ['sweet-chilli-rush', 'jalapeno-kick', 'peri-peri-punch']

export default function FlavourGrid() {
  const ordered = ORDER.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean)

  return (
    <section id="products" className="overflow-x-clip bg-cream py-12 sm:py-16">
      <div className="px-3 sm:px-8 lg:px-12">
        {/* The confetti hangs off the wordmark's own box -- right-full / left-full
            against a relative wrapper sized by the heading -- so it can never
            land on the letters no matter how wide the brand face renders.
            The placement lives on a plain div and the motion on a child: a
            Framer `animate` writes an inline transform that would otherwise
            cancel a Tailwind translate class outright. */}
        <div className="relative mb-12 flex justify-center sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.86, rotate: -4 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ type: 'spring', stiffness: 190, damping: 12 }}
            className="relative"
          >
            <motion.div
              animate={{ rotate: [-1.6, 1.6, -1.6], y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
            >
              <BrandHeading as="h2" fill="#F3C63B" className="text-5xl sm:text-6xl">
                Our flavours
              </BrandHeading>
            </motion.div>

            {/* Triangles need ~7rem of clear margin either side, so they only
                appear once the container actually has it. Below that the
                wordmark stands on its own. */}
            <div className="absolute right-full top-2 hidden -translate-x-[4.75rem] sm:block">
              <motion.div
                animate={{ rotate: [-8, 8, -8], y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut' }}
              >
                <TriangleCluster />
              </motion.div>
            </div>
            <div className="absolute left-full top-2 hidden translate-x-[4.75rem] scale-x-[-1] sm:block">
              <motion.div
                animate={{ rotate: [8, -8, 8], y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut' }}
              >
                <TriangleCluster />
              </motion.div>
            </div>

            <div className="absolute right-full top-7 hidden -translate-x-[1.75rem] sm:block">
              <motion.div
                animate={{ scale: [1, 1.22, 1], opacity: [0.75, 1, 0.75] }}
                transition={{ repeat: Infinity, duration: 2.9, ease: 'easeInOut' }}
              >
                <Blob className="h-7 w-7 sm:h-8 sm:w-8" />
              </motion.div>
            </div>
            <div className="absolute left-full top-7 hidden translate-x-[1.25rem] sm:block">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 7, ease: 'linear' }}
              >
                <Sparkle className="h-7 w-7 sm:h-8 sm:w-8" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        <div className="relative">
          {/* Same trick as the testimonials panel: Flip is a previous sibling of
              the bordered box, so its own border and fill cut him off at the
              rim. Hands on the edge, the rest of him genuinely behind it --
              real occlusion rather than a mascot floating beside the heading
              with his legs dangling in open cream. */}
          <FlipSpot
            mode="peek"
            width="clamp(104px, 14vw, 204px)"
            className="right-[13%] sm:right-[16%] lg:right-[12%]"
            style={{ top: 0 }}
          />

          <div className="relative overflow-hidden rounded-[28px] border-[4px] border-ink bg-cream p-2.5 sm:rounded-[36px] sm:p-6 lg:p-8">
            <div className="grid grid-cols-3 gap-2 sm:gap-5">
              {ordered.map((product, i) => (
                <ProductCard key={product.slug} product={product} index={i} />
              ))}
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-5">
              {bundles.map((bundle, i) => (
                <BundleCard key={bundle.slug} bundle={bundle} index={i + 3} />
              ))}
            </div>
            <div className="relative mt-6 h-14 overflow-hidden sm:h-20">
              <FallingIngredients />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
