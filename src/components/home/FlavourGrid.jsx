import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { bundles, products } from '../../data/products'
import { BundleCard, ProductCard } from '../product/ProductCard'
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

/** Two googly eyes whose pupils track the pointer (and device tilt). */
function GooglyEyes({ className = '', size = 34 }) {
  const hostRef = useRef(null)
  const leftPupil = useRef(null)
  const rightPupil = useRef(null)

  useEffect(() => {
    const range = size * 0.16
    const apply = (dx, dy) => {
      const x = Math.max(-1, Math.min(1, dx)) * range
      const y = Math.max(-1, Math.min(1, dy)) * range
      const transform = `translate(${x}px, ${y}px)`
      if (leftPupil.current) leftPupil.current.style.transform = transform
      if (rightPupil.current) rightPupil.current.style.transform = transform
    }
    const onPointer = (e) => {
      const host = hostRef.current
      if (!host) return
      const rect = host.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      apply((e.clientX - cx) / (window.innerWidth / 2), (e.clientY - cy) / (window.innerHeight / 2))
    }
    const onOrientation = (e) => apply((e.gamma || 0) / 45, ((e.beta || 0) - 45) / 45)

    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('deviceorientation', onOrientation, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('deviceorientation', onOrientation)
    }
  }, [size])

  return (
    <span
      ref={hostRef}
      className={`pointer-events-none inline-flex items-center gap-1.5 ${className}`}
      aria-hidden="true"
    >
      {[leftPupil, rightPupil].map((ref, i) => (
        <span
          key={i}
          className="relative inline-block shrink-0 rounded-full border-[3px] border-ink bg-white"
          style={{ width: size, height: size }}
        >
          <span
            ref={ref}
            className="absolute rounded-full bg-ink transition-transform duration-100 ease-out"
            style={{
              width: size * 0.42,
              height: size * 0.42,
              left: '50%',
              top: '50%',
              marginLeft: -(size * 0.21),
              marginTop: -(size * 0.21),
            }}
          />
        </span>
      ))}
    </span>
  )
}

/** Small cluster of triangle confetti to the left of the heading. */
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
    <section id="products" className="bg-cream py-12 sm:py-16">
      <div className="px-3 sm:px-8 lg:px-12">
        <div className="relative mb-8 flex justify-center">
          <motion.div
            animate={{ rotate: [-8, 8, -8], y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut' }}
            className="absolute left-1/2 top-0 -translate-x-[9.5rem] sm:-translate-x-[13rem]"
          >
            <TriangleCluster />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ repeat: Infinity, duration: 2.9, ease: 'easeInOut' }}
            className="absolute left-1/2 top-2 -translate-x-[8rem] sm:-translate-x-[11rem]"
          >
            <Blob className="h-8 w-8" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.86, rotate: -4 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ type: 'spring', stiffness: 190, damping: 12 }}
          >
            <motion.div
              animate={{ rotate: [-1.6, 1.6, -1.6], y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
            >
              <BrandHeading as="h2" fill="#F3C63B" className="text-5xl sm:text-6xl">
                Our flavours
              </BrandHeading>
            </motion.div>
          </motion.div>

          <GooglyEyes
            size={30}
            className="absolute left-1/2 top-3 translate-x-[7.5rem] sm:translate-x-[10.5rem]"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 7, ease: 'linear' }}
            className="absolute left-1/2 top-0 translate-x-[10rem] sm:translate-x-[13.5rem]"
          >
            <Sparkle className="h-8 w-8" />
          </motion.div>
        </div>

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
    </section>
  )
}
