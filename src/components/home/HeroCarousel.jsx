import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { HERO_INTERVAL, heroSlides } from '../../data/site'
import { useMediaQuery } from '../ui/Primitives'

/**
 * The homepage hero. Note: the headline artwork is baked into each background
 * JPG on the live site — the DOM only carries an sr-only <h1>. Reproduced as-is.
 */
export default function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const resumeRef = useRef(0)
  // An auto-advancing carousel is the one piece of motion on this page a reader
  // cannot escape by not scrolling, so it holds still when the OS asks it to.
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const slide = heroSlides[index]

  useEffect(() => {
    if (paused || reduceMotion) return
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % heroSlides.length),
      HERO_INTERVAL
    )
    return () => window.clearInterval(id)
  }, [paused, reduceMotion])

  useEffect(() => () => window.clearTimeout(resumeRef.current), [])

  // Jumping to a slide pauses the rotation so the chosen slide is actually
  // readable -- but on touch there is no mouseleave to un-pause it, so the
  // carousel used to stop for good after the first tap. It now resumes once the
  // reader has had the slide to themselves for a full interval.
  const goTo = (next) => {
    setPaused(true)
    setIndex((next + heroSlides.length) % heroSlides.length)
    window.clearTimeout(resumeRef.current)
    resumeRef.current = window.setTimeout(() => setPaused(false), HERO_INTERVAL)
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
              {/* The first slide is the LCP element and is preloaded in
                  index.html, so it must not be lazy or low priority. The other
                  two are off-screen until the carousel advances. */}
              <img
                src={slide.bg}
                alt={`${slide.headline} — shop ${slide.product.name}`}
                className="block h-full w-full object-cover object-center sm:object-contain"
                width="1426"
                height="800"
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchpriority={index === 0 ? 'high' : 'auto'}
                decoding="async"
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
            aria-current={i === index ? 'true' : undefined}
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
