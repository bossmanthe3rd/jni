import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { comboStage, flavourStages } from '../../data/site'
import { getBundleBySlug, getProductBySlug } from '../../data/products'
import { ASPECT, doodleComponents, packPalettes } from '../icons/PackDoodles'
import { BrandHeading, useMediaQuery } from '../ui/Primitives'
import { responsiveImage } from '../../lib/responsiveImage'

/*
 * The flavour stage: a pinned, scroll-driven introduction to the three FLIPO's
 * flavours.
 *
 * Direction. The subject is a chip packet, so the stage is built like the inside
 * of one. The ground takes the pouch's own print colour, the four corners wear
 * the zigzag crimp a packet gets where it is heat-sealed, and the ingredient
 * doodles lifted off the pouch artwork tumble around the pack shot. Scrolling
 * re-crimps the corners, repaints the ground and re-shuffles the doodles into
 * the next flavour's set — one packet, opened three times.
 *
 * Everything except the copy swap is scroll-linked rather than timed, so the
 * transition tracks the finger instead of running away from it.
 *
 * Colour comes straight from `packPalettes` (the pouch print colours), type from
 * the site's existing bubble display face and Inter utility caps. Order is the
 * heat ramp — sweet, fresh, big — which is what the rail's rising bars measure.
 *
 * The launch combo opens the stage, ahead of the ramp: it is the offer, and the
 * three flavours after it are what is in it. Its rail mark is a dot rather than
 * a bar, because it has no place on the heat ramp.
 */

const CHAPTERS = [comboStage, ...flavourStages]
const FLAVOUR_PALETTES = flavourStages.map((s) => packPalettes[s.slug])

const FOAM = '#f5f0dc'

// Doodle viewBox heights, so `weight` can be normalised to one on-screen
// keyline thickness however large a shape ends up being drawn.
const VIEWBOX_H = {
  'chilli-whole': 258,
  'chilli-half': 258,
  'chilli-slice': 148,
  'pepper-section': 148,
  jalapeno: 244,
  seed: 34,
}
const KEYLINE = 2.4

/**
 * Scatter slots, in the order `flavourStages[].shapes` fills them. `l`/`t` are
 * percentages of the stage, `h` the rendered height in px, `depth` how far the
 * slot drifts under parallax and `spin` how far it turns. `m` re-places the slot
 * for the stacked mobile layout; slots without it sit out on small screens.
 */
const SLOTS = [
  { id: 'a', l: 19, t: 13, h: 190, depth: 0.9, spin: -16, m: { l: 12, t: 10, h: 86 } },
  { id: 'b', l: 33, t: 23, h: 30, depth: 0.5, spin: 24 },
  { id: 'c', l: 48, t: 10, h: 160, depth: 1.1, spin: 14 },
  { id: 'd', l: 64, t: 9, h: 110, depth: 0.7, spin: -22 },
  { id: 'e', l: 91, t: 31, h: 210, depth: 1.2, spin: 12, m: { l: 92, t: 14, h: 104 } },
  { id: 'f', l: 96, t: 67, h: 155, depth: 0.8, spin: -18, m: { l: 95, t: 84, h: 78 } },
  { id: 'g', l: 51, t: 47, h: 80, depth: 1.0, spin: 26, m: { l: 4, t: 44, h: 62 } },
  { id: 'h', l: 49, t: 80, h: 165, depth: 1.1, spin: -14 },
  { id: 'i', l: 69, t: 87, h: 30, depth: 0.5, spin: 30, m: { l: 96, t: 48, h: 26 } },
  { id: 'j', l: 32, t: 83, h: 140, depth: 0.9, spin: 18, m: { l: 8, t: 86, h: 88 } },
  { id: 'k', l: 2, t: 62, h: 130, depth: 0.7, spin: -24 },
  { id: 'l', l: 3, t: 31, h: 100, depth: 1.0, spin: 20 },
]

/**
 * Ramp stops for one chapter: hold the value through the middle of the chapter
 * and cross-fade across its boundary, so the change lands exactly where the copy
 * swaps. The first and last chapters hold past the ends of the track.
 */
function bandRamp(index, count, low, high, spread = 0.3, hold = 0.07) {
  const centre = (index + 0.5) / count
  const stops = [centre - spread, centre - hold, centre + hold, centre + spread]
  const values = [low, high, high, low]
  if (index === 0) {
    stops[0] = -1
    values[0] = high
  }
  if (index === count - 1) {
    stops[3] = 2
    values[3] = high
  }
  return [stops, values]
}

/** Stops that hold each colour through its chapter and blend across boundaries. */
function colourRamp(colours) {
  const n = colours.length
  const stops = []
  const values = []
  colours.forEach((colour, i) => {
    stops.push(i === 0 ? 0 : i / n + 0.09, i === n - 1 ? 1 : (i + 1) / n - 0.09)
    values.push(colour, colour)
  })
  return [stops, values]
}

/**
 * One corner of the pouch's crimped seal, drawn as a single polygon so the
 * keyline runs unbroken around it: two arms meeting at the corner block, each
 * with the zigzag teeth of a heat-sealed packet. Mirrored into the other three.
 */
function crimpCornerPath(span = 200, band = 26, teeth = 5) {
  const tooth = band * 0.58
  const step = (span - band) / teeth
  let d = `M${span} 0 L0 0 L0 ${span} L${band} ${span}`
  for (let k = 0; k < teeth; k += 1) {
    d += ` L${(band + tooth).toFixed(1)} ${(span - (k + 0.5) * step).toFixed(1)}`
    d += ` L${band} ${(span - (k + 1) * step).toFixed(1)}`
  }
  for (let k = 0; k < teeth; k += 1) {
    d += ` L${(band + (k + 0.5) * step).toFixed(1)} ${(band + tooth).toFixed(1)}`
    d += ` L${(band + (k + 1) * step).toFixed(1)} ${band}`
  }
  return `${d} Z`
}

const CRIMP_SPAN = 200
const CRIMP_PATH = crimpCornerPath(CRIMP_SPAN)

function PouchCrimp({ fill, line, flipX = false, flipY = false, className = '' }) {
  return (
    <svg
      viewBox={`0 0 ${CRIMP_SPAN} ${CRIMP_SPAN}`}
      className={`absolute h-[104px] w-[104px] sm:h-[150px] sm:w-[150px] lg:h-[190px] lg:w-[190px] ${className}`}
      style={{ transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})` }}
      aria-hidden="true"
    >
      <motion.path
        d={CRIMP_PATH}
        strokeWidth="5"
        strokeLinejoin="round"
        style={{ fill, stroke: line }}
      />
    </svg>
  )
}

/** One scattered pack doodle: parallax on the outer node, chapter pop on the inner. */
function StageDoodle({ shape, palette, slot, order, count, index, progress, reduce }) {
  const Doodle = doodleComponents[shape]
  const height = slot.h
  const width = height * (ASPECT[shape] ?? 1)
  // Keep the keyline the same thickness on screen no matter how big the shape is.
  const weight = Math.min(11, (KEYLINE * (VIEWBOX_H[shape] ?? 258)) / height)

  const centre = (index + 0.5) / count
  const drift = reduce ? 0 : slot.depth * 95
  const y = useTransform(progress, [centre - 0.33, centre + 0.33], [drift, -drift])
  const turn = reduce ? 0 : slot.spin
  const rotate = useTransform(progress, [centre - 0.33, centre + 0.33], [-turn, turn])

  // Stagger the pop by slot so the set shakes out of the bag rather than
  // appearing all at once.
  const jitter = (order % 5) * 0.014
  const [scaleStops, scaleValues] = bandRamp(index, count, 0.32, 1, 0.3 - jitter, 0.07)
  const scale = useTransform(progress, scaleStops, scaleValues)

  if (!Doodle) return null

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${slot.l}%`,
        top: `${slot.t}%`,
        width,
        height,
        marginLeft: -width / 2,
        marginTop: -height / 2,
        y,
        rotate,
        // Its own layer, so the parallax drift and turn -- which change on
        // every scroll frame -- move a finished bitmap instead of repainting
        // the doodle and its drop shadow each time. The chapter pop's scale
        // stays on the inner node, which repaints only while it is popping,
        // so the doodle is drawn at its real size and stays crisp.
        willChange: reduce ? undefined : 'transform',
      }}
    >
      <motion.div
        className="h-full w-full drop-shadow-[3px_4px_0_rgba(0,0,0,0.22)]"
        style={{ scale }}
      >
        <Doodle palette={palette} weight={weight} className="h-full w-full" />
      </motion.div>
    </motion.div>
  )
}

/**
 * The doodle set for one flavour, faded in across its chapter. Memoised:
 * none of its props change when the chapter does, and without it every
 * chapter change re-rendered all three sets, every doodle in each.
 */
const DoodleLayer = memo(function DoodleLayer({ stage, slots, index, count, progress, reduce }) {
  const [stops, values] = bandRamp(index, count, 0, 1)
  const opacity = useTransform(progress, stops, values)
  // The combo deals its doodles out across all three flavours' colours.
  const paletteFor = (order) =>
    stage.mixed ? FLAVOUR_PALETTES[order % FLAVOUR_PALETTES.length] : packPalettes[stage.slug]

  // A set faded all the way out is taken out of rendering, so the two
  // flavours not on screen cost nothing per frame. Written straight to the
  // node: a re-render here would re-render every doodle in the set.
  const layerRef = useRef(null)
  const hideWhenClear = useCallback((v) => {
    if (layerRef.current) layerRef.current.style.visibility = v <= 0 ? 'hidden' : ''
  }, [])
  useMotionValueEvent(opacity, 'change', hideWhenClear)
  useLayoutEffect(() => hideWhenClear(opacity.get()), [hideWhenClear, opacity])

  return (
    <motion.div ref={layerRef} className="absolute inset-0" style={{ opacity }} aria-hidden="true">
      {slots.map((slot) => (
        <StageDoodle
          key={slot.id}
          shape={stage.shapes[slot.order]}
          palette={paletteFor(slot.order)}
          slot={slot}
          order={slot.order}
          index={index}
          count={count}
          progress={progress}
          reduce={reduce}
        />
      ))}
    </motion.div>
  )
})

// Transparent through the ticker, full strength a little below it.
const DOODLE_MASK =
  'linear-gradient(to bottom, transparent 0, transparent var(--site-ticker-height, 0px),' +
  ' #000 calc(var(--site-ticker-height, 0px) + 3.5rem), #000 100%)'

export default function FlavourScrollStage() {
  const trackRef = useRef(null)
  const reduce = useReducedMotion()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [active, setActive] = useState(0)

  const count = CHAPTERS.length
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const next = Math.min(count - 1, Math.max(0, Math.floor(p * count)))
    setActive((current) => (current === next ? current : next))
  })

  const palettes = useMemo(() => CHAPTERS.map((s) => s.palette ?? packPalettes[s.slug]), [])

  const [groundStops, groundValues] = useMemo(
    () => colourRamp(CHAPTERS.map((s) => s.ground)),
    []
  )
  const [crimpFillStops, crimpFillValues] = useMemo(
    () => colourRamp(palettes.map((p) => p.fill)),
    [palettes]
  )
  const [crimpLineStops, crimpLineValues] = useMemo(
    () => colourRamp(palettes.map((p) => p.line)),
    [palettes]
  )

  const ground = useTransform(scrollYProgress, groundStops, groundValues)
  const crimpFill = useTransform(scrollYProgress, crimpFillStops, crimpFillValues)
  const crimpLine = useTransform(scrollYProgress, crimpLineStops, crimpLineValues)

  // The cream page pours back in as the pin releases.

  // Pack shot parallax, opposite the doodles so the two planes separate. It
  // moves the shot and the CTA under it together. Only at md and up: stacked,
  // the drift would push the column into the copy above it.
  const packDrift = reduce || !isDesktop ? 0 : 24
  const packY = useTransform(scrollYProgress, [0, 1], [-packDrift, packDrift])

  const slots = useMemo(() => {
    const withOrder = SLOTS.map((slot, order) => ({ ...slot, order }))
    if (isDesktop) return withOrder
    return withOrder.filter((slot) => slot.m).map((slot) => ({ ...slot, ...slot.m }))
  }, [isDesktop])

  const scrollToChapter = useCallback(
    (index) => {
      const el = trackRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY
      const scrollable = Math.max(1, el.offsetHeight - window.innerHeight)
      window.scrollTo({
        top: Math.round(top + ((index + 0.5) / count) * scrollable),
        behavior: reduce ? 'auto' : 'smooth',
      })
    },
    [count, reduce]
  )

  const stage = CHAPTERS[active]
  const product = stage.bundle ? getBundleBySlug(stage.slug) : getProductBySlug(stage.slug)
  const palette = palettes[active]
  const href = stage.bundle ? `/combos/${stage.slug}` : `/flavours/${stage.slug}`

  return (
    // The track's own ground rides the same ramp as the panel's. It used to be
    // pinned to flavourStages[0], which meant Sweet Chilli's #7d1206 was what
    // showed anywhere the sticky panel did not cover -- rubber-band overscroll
    // at either end of the 320vh track, and the moment the pin releases --
    // however far into the Jalapeno chapter you were.
    <motion.section
      id="flavour-stage"
      ref={trackRef}
      // The track is padded by exactly the distance the ground reaches up from
      // the sticky panel below. Without it the bleed would start above the
      // section itself and lay a band of the flavour's colour over the bottom
      // of Why Flipo's for as long as the stage was scrolling into view --
      // visible only in the moments before the panel pins, which is the worst
      // kind of bug to find later. Padded, the reach lands on the track's own
      // top edge and can never escape it.
      className="relative h-[420vh] pt-[var(--site-header-offset)] md:h-[500vh]"
      style={{ backgroundColor: ground }}
      aria-label="The launch combo and the three flavours"
    >
      <div className="sticky top-[var(--site-header-offset)] h-[calc(100vh-var(--site-header-offset))]">
        {/* The ground and its doodles run up behind the header; everything else
            stays clipped to the panel.

            The panel is pinned below the header, so the strip behind the header
            fell through to the track's background and sat there in one flavour's
            colour while the panel underneath was in another's. Reaching up from
            here rather than repositioning the panel is what keeps the copy, the
            pack, Flip, the crimp and the heat rail on the exact pixels they were
            already on.

            The clip moves off the sticky box and onto the two boxes below,
            because it was the thing that made the bleed impossible -- and the
            second one still has to exist, or the waves would slide out of the
            panel instead of being wiped away by its edge. */}
        <div
          className="absolute inset-x-0 bottom-0 overflow-hidden"
          style={{ top: 'calc(var(--site-header-offset) * -1)' }}
        >
          <motion.div className="absolute inset-0" style={{ backgroundColor: ground }} />

          {/* Ingredient doodles, one set per flavour, cross-faded on scroll.

              Masked away behind the ticker. The ground reaches y=0 so the
              strip behind the header carries the flavour's colour, but the
              ticker paints solid over the top of it, and a doodle that ran
              under the bar came back out with a flat edge sliced across it.
              The mask is in absolute lengths off the ticker's own measured
              height rather than in per cent, so it lands on the bar's edge
              exactly whatever the panel is tall. The slots stay where they
              are -- they are composed positions, not a generated field. */}
          <div
            className="absolute inset-0 z-10"
            style={{
              maskImage: DOODLE_MASK,
              WebkitMaskImage: DOODLE_MASK,
            }}
          >
            {CHAPTERS.map((item, i) => (
              <DoodleLayer
                key={item.slug}
                stage={item}
                slots={slots}
                index={i}
                count={count}
                progress={scrollYProgress}
                reduce={reduce}
              />
            ))}
          </div>
        </div>

        {/* Copy and pack shot. Clipped in its own right now that the sticky box
            no longer clips: the pack shot drifts +-42px on the parallax and
            used to be trimmed by the panel's edge. */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-10 sm:px-10 sm:pb-20 sm:pt-16 md:flex-row md:items-center md:justify-between md:gap-10 md:px-[8vw] md:pb-16 md:pt-16 lg:gap-16">
          <div className="w-full max-w-[34rem] text-center md:w-[46%] md:text-left">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={stage.slug}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 26 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -18 }}
                transition={{ duration: reduce ? 0.15 : 0.34, ease: [0.22, 1, 0.36, 1] }}
              >
                <p
                  className="mb-3 text-xs font-black uppercase tracking-[0.32em] sm:text-xs"
                  style={{ color: palette.seed }}
                >
                  {stage.heat}
                </p>

                <BrandHeading
                  as="h2"
                  fill="#f3c63b"
                  // The outline takes the chapter's own pouch colour, so the
                  // name sits in the same set as the crimp and doodles.
                  stroke={stage.outline ?? palette.outline ?? palette.fill}
                  className="bubble-title--slim text-[clamp(1.95rem,8.4vw,2.8rem)] leading-[0.88] sm:text-6xl lg:text-[5.2rem]"
                >
                  {stage.title ?? product.shortName}
                </BrandHeading>

                <p
                  className="mx-auto mt-4 max-w-[28rem] text-[0.9rem] font-bold leading-6 sm:mt-5 sm:text-base sm:leading-7 md:mx-0"
                  style={{ color: FOAM }}
                >
                  {stage.note}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* The shot, with the CTA and price set under it. The column rides the
              parallax as one, so the button never slides under the pack.

              The combo's shot is a landscape spread of all six packs, so its
              frame is wider rather than cropping packs off the ends. */}
          <motion.div
            className="mt-5 flex shrink-0 flex-col items-center md:mt-0"
            style={{ y: packY }}
          >
            <div className={`fs-media ${stage.bundle ? 'fs-media--combo' : ''}`}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={stage.slug}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, rotate: 6 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: -2.5 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.92, rotate: -9 }}
                  transition={{ duration: reduce ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden rounded-[26px] border-[4px] sm:rounded-[32px]"
                  style={{
                    borderColor: FOAM,
                    boxShadow: `9px 10px 0 ${palette.line}`,
                  }}
                >
                  <Link to={href} aria-label={`Nibble now: ${product.name}`} className="block">
                    <img
                      {...responsiveImage(
                        stage.pack,
                        stage.bundle
                          ? '(min-width: 768px) min(40vw, 672px), min(86vw, 480px)'
                          : '(min-width: 768px) min(34vw, 512px), min(62vw, 320px)'
                      )}
                      alt={stage.packAlt}
                      loading="lazy"
                      decoding="async"
                      className={`block w-full object-cover ${stage.bundle ? 'aspect-[3/2]' : 'aspect-square'}`}
                    />
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={stage.slug}
                className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:mt-6"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: reduce ? 0.15 : 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link to={href} className="jni-btn" aria-label={`Nibble now: ${product.name}`}>
                  Nibble now
                </Link>
                <p className="text-sm font-black" style={{ color: FOAM }}>
                  {stage.bundle && product.originalPrice && (
                    <s className="mr-2 font-bold opacity-60">&#8377;{product.originalPrice}</s>
                  )}
                  &#8377;{product.price}
                  <span
                    className="ml-1.5 text-xs font-bold uppercase tracking-[0.14em]"
                    style={{ color: palette.seed }}
                  >
                    / {product.weight}
                  </span>
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* The crimped pouch seal, re-crimped in the live flavour's colours. */}
        <div className="pointer-events-none absolute inset-0 z-40" aria-hidden="true">
          <PouchCrimp fill={crimpFill} line={crimpLine} className="left-0 top-0" />
          <PouchCrimp fill={crimpFill} line={crimpLine} flipX className="right-0 top-0" />
          <PouchCrimp fill={crimpFill} line={crimpLine} flipY className="bottom-0 left-0" />
          <PouchCrimp fill={crimpFill} line={crimpLine} flipX flipY className="bottom-0 right-0" />
        </div>

        {/* Heat rail: bar length is position on the ramp, not decoration. */}
        <nav
          aria-label="Jump to a flavour"
          className="absolute inset-x-0 bottom-4 z-50 flex justify-center sm:bottom-6"
        >
          <ol className="flex items-center gap-1 sm:gap-5">
            {CHAPTERS.map((item, i) => {
              const on = i === active
              // Flavours climb the heat ramp; the combo sits before it as a dot.
              const barWidth = item.bundle ? 9 : 18 + (i - 1) * 11
              return (
                <li key={item.slug}>
                  <button
                    type="button"
                    onClick={() => scrollToChapter(i)}
                    aria-current={on ? 'true' : undefined}
                    className="flex min-h-[44px] items-center gap-2.5 rounded-pill px-2 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:pl-0 sm:pr-1"
                    style={{ '--tw-ring-color': FOAM, '--tw-ring-offset-color': stage.ground }}
                  >
                    <span
                      className="block rounded-pill border-2 transition-all duration-300"
                      style={{
                        width: barWidth,
                        height: on ? 9 : 6,
                        borderColor: on ? palette.line : 'transparent',
                        backgroundColor: on ? palette.fill : FOAM,
                        opacity: on ? 1 : 0.4,
                      }}
                    />
                    <span
                      className="hidden text-xs font-black uppercase tracking-[0.24em] transition-opacity duration-300 sm:block"
                      style={{ color: FOAM, opacity: on ? 1 : 0.5 }}
                    >
                      {item.rail ?? item.heat}
                    </span>
                    <span className="sr-only sm:hidden">{item.rail ?? item.heat}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>
      </div>
    </motion.section>
  )
}
