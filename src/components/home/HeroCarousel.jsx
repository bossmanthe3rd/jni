import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { HERO_INTERVAL, heroSlides } from '../../data/site'

/**
 * The homepage hero. Note: the headline artwork is baked into each background
 * JPG on the live site — the DOM only carries an sr-only <h1>. Reproduced as-is.
 */
export default function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const slide = heroSlides[index]

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % heroSlides.length),
      HERO_INTERVAL
    )
    return () => window.clearInterval(id)
  }, [paused])

  const goTo = (next) => {
    setPaused(true)
    setIndex((next + heroSlides.length) % heroSlides.length)
  }

  return (
    <section
      className="relative mt-[var(--site-header-offset)] w-full overflow-hidden bg-cream"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => setTouchStart(e.changedTouches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const start = touchStart
        const end = e.changedTouches[0]?.clientX
        setTouchStart(null)
        if (start == null || end == null) return
        if (Math.abs(end - start) < 48) return
        goTo(index + (end - start < 0 ? 1 : -1))
      }}
    >
      <div className="relative aspect-[3/2] w-full bg-cream sm:aspect-[1426/800]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.bg}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <Link
              to={`/flavours/${slide.product.slug}`}
              aria-label={`Shop ${slide.product.name}`}
              className="block h-full w-full"
            >
              <img
                src={slide.bg}
                alt={`${slide.headline} — shop ${slide.product.name}`}
                className="block h-full w-full object-cover object-center sm:object-contain"
                width="1426"
                height="800"
              />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      <h1 className="sr-only">{slide.headline}</h1>

      <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2 sm:bottom-6">
        {heroSlides.map((s, i) => (
          <button
            key={s.kicker}
            type="button"
            aria-label={`Show ${s.kicker}`}
            onClick={() => goTo(i)}
            className={`h-2.5 rounded-full border-2 border-ink transition-all ${
              i === index ? 'w-8 bg-ink' : 'w-2.5 bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
