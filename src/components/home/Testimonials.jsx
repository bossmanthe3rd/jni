import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TESTIMONIAL_INTERVAL, testimonials } from '../../data/site'
import { BrandHeading, useMediaQuery } from '../ui/Primitives'
import { StarDoodle } from '../icons/WhyIcons'
import { TriangleCluster } from '../ui/TriangleCluster'
import FlipSpot from '../mascot/FlipSpot'
import DoodleField from '../ui/DoodleField'
import DoodleBorder from '../ui/DoodleBorder'
import { jaggedEdge } from '../ui/jaggedEdge'

/*
 * The panel is cut like the pouch: a crimped seal along the top and down both
 * sides, a tear along the bottom. Pixels, not percentages -- a phone gets fewer teeth, not smaller
 * ones. The seal's teeth are kept big enough that a doodle visibly climbs each
 * one; a true pouch crimp at this scale would just make them jitter.
 */
const SEAL = { period: 88, depth: 18 }
const TEAR = { step: [38, 84], depth: [12, 28] }
const EDGE_SEED = 11

/** FlipSpot's own width rule, in px, for the shelf his hands rest on. */
const flipWidth = () => Math.min(218, Math.max(102, window.innerWidth * 0.15))
const FLIP_AT = 0.21

/**
 * The panel's edge, measured once and shared: the panel is clipped to it and
 * the doodle border rides it, from the one object.
 */
function usePanelEdge(ref) {
  const [geometry, setGeometry] = useState(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let last = ''
    const measure = () => {
      // Whole pixels: a path rebuilt on every sub-pixel reflow would restart
      // every doodle mid-travel.
      const w = Math.round(el.offsetWidth)
      const h = Math.round(el.offsetHeight)
      const fw = Math.round(flipWidth())
      const key = `${w}x${h}x${fw}`
      if (key === last || !w || !h) return
      last = key
      setGeometry(
        jaggedEdge(w, h, {
          seal: SEAL,
          tear: TEAR,
          // A flat run in the crimp where his hands grip it: on a peak he'd be
          // hanging off a point.
          shelf: { x: w * FLIP_AT, width: fw * 0.56 },
          // Rounded right out: the brand asked for a wave, not sharp ridges.
          wave: true,
          seed: EDGE_SEED,
        }),
      )
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return geometry
}

/** A small alternating tilt, so a row of reviews reads as a pinned-up wall
 * rather than a grid. Kept under 2deg: the cards still have to line up. */
const CARD_TILT = [-1.6, 1.1, -0.7]

function ReviewCard({ review, index }) {
  return (
    <blockquote
      className="flex h-full flex-col rounded-[22px] border-[3px] border-ink bg-cream p-5 shadow-doodle"
      style={{ transform: `rotate(${CARD_TILT[index % CARD_TILT.length]}deg)` }}
    >
      {/* The brand's own drawn star, in the site's star colour. */}
      <div className="mb-3 flex items-center gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <StarDoodle key={i} className="h-4 w-4" />
        ))}
      </div>
      <p className="flex-1 text-sm font-bold leading-6 text-ink">&ldquo;{review.text}&rdquo;</p>
      <footer className="mt-4 border-t-2 border-ink/10 pt-3 text-sm font-black uppercase tracking-wide text-ink">
        {review.name}
        <span className="block text-xs font-bold normal-case tracking-normal text-ink/55">
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
  // `page` is on screen, `leaving` is sliding out, `dir` which way they go:
  // 1 is forward -- out to the left, in from the right.
  const [{ page, leaving, dir }, setPaging] = useState({ page: 0, leaving: null, dir: 1 })
  const setPage = (fn) =>
    setPaging((s) => {
      const next = typeof fn === 'function' ? fn(s.page) : fn
      return next === s.page ? s : { page: next, leaving: s.page, dir: 1 }
    })
  const [paused, setPaused] = useState(false)
  const frame = useRef(null)
  const edge = usePanelEdge(frame)
  const inView = useInView(frame, { amount: 0.3 })
  const reduce = useReducedMotion()
  const touch = useRef(null)

  useEffect(() => {
    setPage((p) => Math.min(p, pages - 1))
  }, [pages])

  useEffect(() => {
    // Only while someone can see it, and never under reduced motion: the
    // cards moving on by themselves is exactly what that setting asks to stop.
    if (paused || pages < 2 || !inView || reduce) return
    const id = window.setInterval(() => setPage((p) => (p + 1) % pages), TESTIMONIAL_INTERVAL)
    return () => window.clearInterval(id)
  }, [paused, pages, inView, reduce])

  const go = (next, d = next > page ? 1 : -1) =>
    setPaging((s) => {
      const to = (next + pages) % pages
      return to === s.page ? s : { page: to, leaving: s.page, dir: d }
    })
  const pageList = Array.from({ length: pages }, (_, i) =>
    testimonials.slice(i * perPage, i * perPage + perPage)
  )

  /* Swipe between pages on touch. Horizontal only -- a flick that is mostly
     vertical is someone scrolling past, not paging. Touching also stops the
     auto-advance: the reader has taken over. */
  const onTouchStart = (e) => {
    const t = e.touches[0]
    touch.current = { x: t.clientX, y: t.clientY }
    setPaused(true)
  }
  const onTouchEnd = (e) => {
    const start = touch.current
    touch.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return
    go(page + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1)
  }

  return (
    <section
      id="reviews"
      // overflow-x-clip: the doodles riding the panel edge travel out past the
      // viewport on phones, and without a clip here they widened the whole
      // document -- the fixed header stretched with it and the cart button
      // was pushed off the right edge.
      className="overflow-x-clip bg-cream px-5 py-12 sm:px-8 sm:py-16 lg:px-12"
    >
      <div className="relative mb-8 flex items-center justify-center">
        {/* Hidden on the narrowest screens: at 390px the outer pair reached
            past both edges of the viewport, and a confetti triangle is not
            worth a page that scrolls sideways. */}
        <TriangleCluster className="absolute left-1/2 top-1 hidden -translate-x-[12rem] xs:block sm:-translate-x-[16rem]" />

        <BrandHeading as="h2" fill="#F3C63B" className="text-5xl sm:text-6xl">
          Testimonials
        </BrandHeading>

        <TriangleCluster className="absolute left-1/2 top-1 hidden translate-x-[10rem] scale-x-[-1] xs:block sm:translate-x-[14rem]" />
      </div>

      <div ref={frame} className="relative mx-auto max-w-6xl">
        {/* Hands on the rim, the rest of him behind the panel -- on the flat
            shelf the seal leaves for him, one crimp-depth down. Tucked deeper
            under 640px, where the heading sits close above the panel and a head
            poking up into it is exactly the thing to avoid. */}
        <FlipSpot
          mode="peek"
          width="clamp(102px, 15vw, 218px)"
          className="translate-y-[13px] sm:translate-y-0"
          style={{ left: `${FLIP_AT * 100}%`, top: SEAL.depth }}
        />

        {/* No keyline. The edge is the cut itself -- crimp and tear -- with the
            doodle procession below laid over it rather than inside it: the
            panel clips its own field, and a border that sits ON the edge has
            to be half outside it. */}
        <div
          className="jni-doodle-edge relative isolate overflow-hidden bg-sunshine px-9 pb-20 pt-11 sm:px-14 sm:pt-12"
          style={edge ? { clipPath: `path("${edge.d}")` } : undefined}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          // The whole panel takes the swipe, not just the card: on a phone the
          // card is ~260px of a 375px panel, and a swipe on the yellow did nothing.
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Sunshine is a light ground, so the doodles tint toward it and stay
              subtle -- the review cards are the content here. Kept sparse: the
              edge is the section's one loud thing, and a busy field inside it
              drowns the procession out. */}
          <DoodleField
            flavour="sweet-chilli-rush"
            ground="#F3C63B"
            intensity="subtle"
            count={8}
            seed={23}
          />
          {/* Every page is laid into the same grid cell, and only the current
              one is visible. The cell is therefore as tall as the tallest
              page, so paging never changes the panel's height -- which used
              to re-cut its clip path and restart the doodle procession. */}
          <div
            className="relative grid [&>*]:col-start-1 [&>*]:row-start-1"
          >
            {pageList.map((reviews, p) => {
              // On screen, sliding out the way the pages are going, or waiting
              // off the far side for its turn -- moved there instantly, unseen.
              const shown = p === page
              const out = p === leaving
              const state = shown
                ? { opacity: 1, x: '0%', transition: { duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] } }
                : out
                  ? { opacity: 0, x: `${-dir * 60}%`, transition: { duration: reduce ? 0 : 0.4, ease: 'easeIn' } }
                  : { opacity: 0, x: `${dir * 60}%`, transition: { duration: 0 } }
              return (
              <motion.div
                key={`${perPage}-${p}`}
                initial={false}
                animate={state}
                aria-hidden={!shown}
                className={`grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 ${
                  shown ? '' : out ? 'pointer-events-none' : 'pointer-events-none invisible'
                }`}
              >
                {reviews.map((review, i) => (
                  <ReviewCard key={review.name} review={review} index={i} />
                ))}
              </motion.div>
              )
            })}
          </div>

          <div className="mt-7 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous reviews"
              onClick={() => go(page - 1)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-cream text-ink transition hover:-translate-y-0.5 hover:shadow-doodle"
            >
              <ChevronLeft size={18} />
            </button>
            {/* Nine one-card pages make nine dots on a phone -- wider than the
                panel, and each a 10px target. A count reads better there. */}
            <p className="min-w-[4.5rem] text-center font-brand text-lg text-ink sm:hidden" aria-live="polite">
              {page + 1} <span className="text-ink/50">/ {pages}</span>
            </p>
            <div className="hidden items-center gap-2 sm:flex">
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
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-[3px] border-ink bg-cream text-ink transition hover:-translate-y-0.5 hover:shadow-doodle"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* One doodle roughly every 230px of edge: at 118px apart the procession
            crowded the panel and competed with the reviews. */}
        <DoodleBorder geometry={edge} spacing={230} duration={26} className="z-30" />
      </div>
    </section>
  )
}
