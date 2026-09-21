import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { bundles, products } from '../../data/products'
import { BundleCard, ProductCard } from '../product/ProductCard'
import FlipSpot from '../mascot/FlipSpot'
import DoodleField from '../ui/DoodleField'
import FlavourProbeOverlay from './FlavourProbeOverlay'
import { packPalettes } from '../icons/PackDoodles'
import { BrandHeading, Sparkle } from '../ui/Primitives'
import { PROBE_DWELL } from '../../data/site'
import { Rosette } from '../icons/WhyIcons'

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

/* One gesture, two beats.
 *
 * Touching a pack floods the section with its colour straight away -- that is
 * the answer to "is this thing listening", and it costs nothing to undo. The
 * probe is the second beat, behind PROBE_DWELL, because reading the pouch is
 * something you stop to do, and firing it on contact would strobe arrows
 * across all three cards on the way down to the bundles.
 *
 * Taking the pointer off waits CLOSE before anything unwinds, so crossing the
 * grid neither fires it nor makes it flicker -- and so the pointer can travel
 * from the card onto the panel the card opened without the panel dying on the
 * way across the gap. */
const CLOSE = 420

export default function FlavourGrid() {
  const ordered = ORDER.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean)
  /*
   * A single state. The flood, the dissolved background, the raised pouch and
   * its arrows are one thing that is either happening to a flavour or is not --
   * an earlier pass had the colour arrive on contact and the annotation follow
   * later, which read as two effects stacked on each other rather than one.
   */
  const [live, setLive] = useState(null) // flooded -- instant
  const [probe, setProbe] = useState(null) // opened  -- after the dwell
  const [rect, setRect] = useState(null)
  const liveProduct = ordered.find((p) => p.slug === probe) || null
  const floodProduct = ordered.find((p) => p.slug === live) || null
  const sectionRef = useRef(null)
  const open = useRef(0)
  const close = useRef(0)

  const point = (slug) => {
    window.clearTimeout(open.current)
    window.clearTimeout(close.current)
    if (!slug) {
      close.current = window.setTimeout(() => {
        setLive(null)
        setProbe(null)
      }, CLOSE)
      return
    }
    setLive(slug)
    if (probe === slug) return
    // Moving from one pack to another drops the first immediately rather than
    // holding it through the new one's wait, which would show the wrong pouch.
    if (probe) setProbe(null)
    open.current = window.setTimeout(() => setProbe(slug), PROBE_DWELL)
  }

  const dismiss = () => {
    window.clearTimeout(open.current)
    window.clearTimeout(close.current)
    setLive(null)
    setProbe(null)
  }

  /* Escape closes it. A pointer can always be moved away, but someone who
     tabbed into a card had no way back out of the panel it opened. */
  useEffect(() => {
    if (!probe) return
    const onKey = (e) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [probe])

  /* The social-proof toast is fixed to the viewport and knows nothing about
     this section, so while the probe is open the two compete for the same
     corner of the same screen. A flag on <body> is the only handle the toast
     can see from where it is rendered; index.css reads it. */
  useEffect(() => {
    if (probe) document.body.dataset.flavourProbe = probe
    else delete document.body.dataset.flavourProbe
    return () => {
      delete document.body.dataset.flavourProbe
    }
  }, [probe])

  useEffect(
    () => () => {
      window.clearTimeout(open.current)
      window.clearTimeout(close.current)
    },
    []
  )

  // The raised pouch is a sibling of the grid rather than a child of the card,
  // so it has to be told where the card's photo is. Section-relative, so only a
  // resize can invalidate it -- scrolling moves both together.
  useLayoutEffect(() => {
    if (!probe) return setRect(null)
    const measure = () => {
      const tile = sectionRef.current?.querySelector(`[data-slug="${probe}"] .jni-probe-media`)
      if (!tile) return setRect(null)
      const t = tile.getBoundingClientRect()
      // `pull` is gone with the layout that needed it: the pouch used to stay
      // where its card was, so an outer one sat badly off to one side and had
      // to be nudged in. The probe now lays itself out as a spread, and this
      // rect is only the frame the pack animates away from.
      //
      // Measured once per open. These are viewport coordinates now, so
      // scrolling does invalidate them -- but nothing reads them after the
      // pack has travelled, and re-measuring mid-scroll would restart the
      // journey on every frame.
      // Viewport coordinates, because the probe layer is position:fixed.
      setRect({ left: t.left, top: t.top, width: t.width, height: t.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [probe])

  return (
    <section
      ref={sectionRef}
      id="products"
      data-flavour-live={live || undefined}
      data-flavour-probe={probe || undefined}
      onPointerLeave={() => point(null)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) point(null)
      }}
      className="jni-flavour-section relative isolate overflow-x-clip bg-cream py-12 sm:py-16"
    >
      {/* The only homepage section that had no doodle ground: its own doodles
          (FallingIngredients) live in a ~16px strip at the very bottom, so
          everything above them was bare cream. DoodleField is absolutely
          positioned at -z-10, hence the relative/isolate on the section. */}
      <DoodleField
        flavour="peri-peri-punch"
        ground="#fbf6d0"
        intensity="subtle"
        count={20}
        seed={41}
        className="jni-flavour-doodles"
      />
      <div className="jni-probe-stage px-3 sm:px-8 lg:px-12">
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
              {/* The rosette is the owner's own heading ornament -- it flanks
                  every section title in the designs. */}
              <Rosette className="absolute -left-14 top-3 hidden h-8 w-8 xs:block" />
              <Rosette className="absolute -right-14 top-3 hidden h-8 w-8 xs:block" />
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

        {/* The section says what it is being pointed at. The big heading is
            left alone -- it is a brand asset with its own confetti anchored to
            its box, and renaming it would move all of that on every hover -- so
            the naming happens here, in a cell of fixed height that cannot push
            the panel around when the text swaps. */}
        <div className="relative mx-auto mb-7 grid min-h-[3.75rem] max-w-xl place-items-center text-center sm:mb-9">
          <AnimatePresence mode="wait" initial={false}>
            {floodProduct ? (
              <motion.p
                key={floodProduct.slug}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="col-start-1 row-start-1 text-foam"
              >
                <span
                  className="font-brand text-2xl sm:text-3xl"
                  style={{ color: packPalettes[floodProduct.slug]?.fill }}
                >
                  {floodProduct.shortName}.
                </span>{' '}
                <span className="text-sm sm:text-base">{floodProduct.tagline}</span>
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="relative">
          {/* This panel used to be bg-cream on a bg-cream section, so it drew
              an outline and nothing else -- the cards had no ground to sit on.
              It needs a fill that carries both kinds of card: the product
              cards are cream, the bundle cards are a hardcoded near-black
              (#0C1B17), so a dark panel would have swallowed the latter and
              their ink borders with them. Sunshine is spoken for by the
              testimonials panel directly below. Teal is the brand accent that
              was not yet doing any work, and both card treatments read on it. */
          }
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

          <div className="jni-flavour-panel relative isolate overflow-hidden rounded-[28px] border-[4px] border-ink bg-teal p-2.5 shadow-doodle-lg sm:rounded-[36px] sm:p-6 lg:p-8">
            {/* The panel's own doodle ground: the outer field behind the whole
                section stops at the panel's opaque edge, so everything inside
                it -- the gutters between cards, the space above the bottom
                strip -- was bare teal. Jalapeño here for variety against the
                outer field's peri-peri. */}
            <DoodleField
              flavour="jalapeno-kick"
              ground="#4DB8AE"
              intensity="subtle"
              count={16}
              seed={55}
              className="jni-flavour-doodles"
            />
            <div className="relative grid grid-cols-3 gap-2 sm:gap-5">
              {ordered.map((product, i) => (
                <ProductCard
                  key={product.slug}
                  product={product}
                  index={i}
                  onLive={point}
                />
              ))}
            </div>
            <div className="relative mt-2.5 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-5">
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

      {/* Outside .jni-probe-stage on purpose: it is the one thing that must not
          dissolve with the rest, and outside the panel too, which clips its own
          overflow and would otherwise cut the notes off at its rim.
          AnimatePresence so it can settle back onto the card on the way out
          instead of vanishing off the top of the lift. */}
      <AnimatePresence>
        {liveProduct && rect && (
          <FlavourProbeOverlay
            key={liveProduct.slug}
            product={liveProduct}
            rect={rect}
            onHold={point}
            onClose={dismiss}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
