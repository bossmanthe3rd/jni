import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import {
  TESTIMONIAL_INTERVAL,
  TESTIMONIAL_STAR_COLOR,
  testimonials,
} from '../../data/site'
import { BrandHeading, useMediaQuery } from '../ui/Primitives'
import { StarDoodle } from '../icons/WhyIcons'
import { TriangleCluster } from './FlavourGrid'

function ReviewCard({ review }) {
  return (
    <blockquote className="flex h-full flex-col rounded-[22px] border-[3px] border-ink bg-cream p-5 shadow-doodle">
      <div className="mb-3 flex items-center gap-0.5" style={{ color: TESTIMONIAL_STAR_COLOR }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
        ))}
      </div>
      <p className="flex-1 text-sm font-bold leading-6 text-ink">&ldquo;{review.text}&rdquo;</p>
      <footer className="mt-4 border-t-2 border-ink/10 pt-3 text-sm font-black uppercase tracking-wide text-ink">
        {review.name}
        <span className="block text-[11px] font-bold normal-case tracking-normal text-ink/55">
          {review.location}
        </span>
      </footer>
    </blockquote>
  )
}

export default function Testimonials() {
  const isLarge = useMediaQuery('(min-width: 1024px)')
  const isSmall = useMediaQuery('(min-width: 640px)')
  const perPage = isLarge ? 3 : isSmall ? 2 : 1
  const pages = Math.ceil(testimonials.length / perPage)
  const [page, setPage] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setPage((p) => Math.min(p, pages - 1))
  }, [pages])

  useEffect(() => {
    if (paused || pages < 2) return
    const id = window.setInterval(() => setPage((p) => (p + 1) % pages), TESTIMONIAL_INTERVAL)
    return () => window.clearInterval(id)
  }, [paused, pages])

  const go = (next) => setPage((next + pages) % pages)
  const visible = testimonials.slice(page * perPage, page * perPage + perPage)

  return (
    <section id="reviews" className="bg-cream px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <div className="relative mb-8 flex items-center justify-center">
        <TriangleCluster className="absolute left-1/2 top-1 -translate-x-[12rem] sm:-translate-x-[16rem]" />
        <StarDoodle className="absolute left-1/2 top-2 h-8 w-8 -translate-x-[9rem] sm:-translate-x-[12rem]" />

        <BrandHeading as="h2" fill="#F3C63B" className="text-5xl sm:text-6xl">
          Testimonials
        </BrandHeading>

        <StarDoodle className="absolute left-1/2 top-2 h-8 w-8 translate-x-[8.5rem] sm:translate-x-[11.5rem]" />
        <TriangleCluster className="absolute left-1/2 top-1 translate-x-[10rem] scale-x-[-1] sm:translate-x-[14rem]" />
      </div>

      <div
        className="relative mx-auto max-w-6xl overflow-hidden rounded-t-[48px] border-[4px] border-b-0 border-ink bg-sunshine px-5 pb-20 pt-9 sm:px-10 sm:pt-10"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative min-h-[210px] sm:min-h-[200px]">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
          >
            {visible.map((review) => (
              <ReviewCard key={review.name} review={review} />
            ))}
          </motion.div>
        </div>

        <div className="mt-7 flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Previous reviews"
            onClick={() => go(page - 1)}
            className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink bg-cream text-ink transition hover:-translate-y-0.5 hover:shadow-doodle"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to review page ${i + 1}`}
                onClick={() => go(i)}
                className={`h-2.5 rounded-full border-2 border-ink transition-all ${
                  i === page ? 'w-8 bg-ink' : 'w-2.5 bg-cream'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next reviews"
            onClick={() => go(page + 1)}
            className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-ink bg-cream text-ink transition hover:-translate-y-0.5 hover:shadow-doodle"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Wavy cream lip along the bottom of the yellow panel */}
        <svg
          className="absolute inset-x-0 -bottom-px h-14 w-full"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="#FBF6D0"
            stroke="#071A16"
            strokeWidth="6"
            d="M0 24 C 180 72 360 4 540 36 C 720 68 900 8 1080 40 C 1260 72 1380 20 1440 36 L1440 80 L0 80 Z"
          />
        </svg>
      </div>
    </section>
  )
}
