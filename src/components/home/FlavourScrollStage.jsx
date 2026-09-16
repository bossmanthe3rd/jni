import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { flavourStages } from '../../data/site'
import { getProductBySlug } from '../../data/products'
import { ASPECT, doodleComponents, packPalettes } from '../icons/PackDoodles'
import { BrandHeading, WaveDivider, useMediaQuery } from '../ui/Primitives'
import FlipSpot from '../mascot/FlipSpot'

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
 */

const CREAM = '#fbf6d0'
const SUNSHINE = '#f3c63b'
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

/** The doodle set for one flavour, faded in across its chapter. */
function DoodleLayer({ stage, slots, index, count, progress, reduce }) {
  const [stops, values] = bandRamp(index, count, 0, 1)
  const opacity = useTransform(progress, stops, values)
  const palette = packPalettes[stage.slug]

  return (
    <motion.div className="absolute inset-0" style={{ opacity }} aria-hidden="true">
      {slots.map((slot) => (
        <StageDoodle
          key={slot.id}
          shape={stage.shapes[slot.order]}
          palette={palette}
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
}

export default function FlavourScrollStage() {
  const trackRef = useRef(null)
  const reduce = useReducedMotion()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [active, setActive] = useState(0)

  const count = flavourStages.length
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const next = Math.min(count - 1, Math.max(0, Math.floor(p * count)))
    setActive((current) => (current === next ? current : next))
  })

  const palettes = useMemo(() => flavourStages.map((s) => packPalettes[s.slug]), [])

  const [groundStops, groundValues] = useMemo(
    () => colourRamp(flavourStages.map((s) => s.ground)),
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

  // WhyFlipos closes on a sunshine wave: carry it over, then peel it off as the
  // stage takes hold. The cream page pours back in as the pin releases.
  const topWaveOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0])
  const topWaveY = useTransform(scrollYProgress, [0, 0.1], ['0%', '-100%'])
  const bottomWaveOpacity = useTransform(scrollYProgress, [0.9, 1], [0, 1])
  const bottomWaveY = useTransform(scrollYProgress, [0.9, 1], ['100%', '0%'])

  // Pack shot parallax, opposite the doodles so the two planes separate. Only
  // at md and up: in the stacked layout the offset would ride over the CTA.
  const packDrift = reduce || !isDesktop ? 0 : 42
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

  const stage = flavourStages[active]
  const product = getProductBySlug(stage.slug)
  const palette = palettes[active]

  return (
    <section
      id="flavour-stage"
      ref={trackRef}
      className="relative h-[320vh] md:h-[380vh]"
      style={{ backgroundColor: flavourStages[0].ground }}
      aria-label="The three flavours"
    >
      <div className="sticky top-[var(--site-header-offset)] h-[calc(100vh-var(--site-header-offset))] overflow-hidden">
        <motion.div className="absolute inset-0" style={{ backgroundColor: ground }} />

        {/* Ingredient doodles, one set per flavour, cross-faded on scroll. */}
        <div className="absolute inset-0 z-10">
          {flavourStages.map((item, i) => (
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

        {/* Copy and pack shot. */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 pb-16 pt-10 sm:px-10 sm:pb-20 sm:pt-16 md:flex-row md:items-center md:justify-between md:gap-10 md:px-[8vw] md:pb-16 md:pt-16 lg:gap-16">
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
                  className="mb-3 text-[11px] font-black uppercase tracking-[0.32em] sm:text-xs"
                  style={{ color: palette.seed }}
                >
                  {stage.heat}
                </p>

                <BrandHeading
                  as="h2"
                  fill="#f3c63b"
                  stroke={palette.line}
                  className="text-[clamp(1.95rem,8.4vw,2.8rem)] leading-[0.88] sm:text-6xl lg:text-[5.2rem]"
                >
                  {product.shortName}
                </BrandHeading>

                <p
                  className="mx-auto mt-4 max-w-[28rem] text-[0.9rem] font-bold leading-6 sm:mt-5 sm:text-base sm:leading-7 md:mx-0"
                  style={{ color: FOAM }}
                >
                  {stage.note}
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:mt-6 md:justify-start">
                  <Link to={`/flavours/${stage.slug}`} className="jni-btn">
                    Shop {product.shortName}
                  </Link>
                  <p className="text-sm font-black" style={{ color: FOAM }}>
                    &#8377;{product.price}
                    <span
                      className="ml-2 text-[11px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: palette.seed }}
                    >
                      {product.weight}
                    </span>
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.div
            className="mt-6 w-[40vw] max-w-[10.5rem] shrink-0 sm:w-[46vw] sm:max-w-[15rem] md:mt-0 md:w-[32vw] md:max-w-[22rem]"
            style={{ y: packY }}
          >
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
                <img
                  src={stage.pack}
                  alt={stage.packAlt}
                  loading="lazy"
                  decoding="async"
                  className="block aspect-square w-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* WhyFlipos closes on a sunshine wave: carry it over, peel it away as
            the stage takes hold, then pour the cream page back in at the end. */}
        <motion.div
          className="absolute inset-x-0 top-0 z-[45] h-[52px] sm:h-[74px]"
          style={{ opacity: topWaveOpacity, y: topWaveY }}
          aria-hidden="true"
        >
          <WaveDivider fill={SUNSHINE} flip className="h-full w-full" />
        </motion.div>
        <motion.div
          className="absolute inset-x-0 bottom-0 z-[45] h-[52px] sm:h-[74px]"
          style={{ opacity: bottomWaveOpacity, y: bottomWaveY }}
          aria-hidden="true"
        >
          <WaveDivider fill={CREAM} className="h-full w-full" />
        </motion.div>

        {/* A loose chip in the pouch, between the copy and the pack shot. He
            re-seasons as the stage does, so he reads the heat with you. */}
        <FlipSpot
          mode="float"
          tint={stage.slug}
          progress={() => scrollYProgress.get()}
          width="clamp(100px, 12vw, 172px)"
          className="z-20"
          style={{ left: '61%', top: '64%', display: isDesktop ? 'block' : 'none' }}
        />

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
          <ol className="flex items-center gap-3 sm:gap-5">
            {flavourStages.map((item, i) => {
              const on = i === active
              return (
                <li key={item.slug}>
                  <button
                    type="button"
                    onClick={() => scrollToChapter(i)}
                    aria-current={on ? 'true' : undefined}
                    className="flex items-center gap-2.5 rounded-pill py-1 pr-1 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ '--tw-ring-color': FOAM, '--tw-ring-offset-color': stage.ground }}
                  >
                    <span
                      className="block rounded-pill border-2 transition-all duration-300"
                      style={{
                        width: 18 + i * 11,
                        height: on ? 9 : 6,
                        borderColor: on ? palette.line : 'transparent',
                        backgroundColor: on ? palette.fill : FOAM,
                        opacity: on ? 1 : 0.4,
                      }}
                    />
                    <span
                      className="hidden text-[10px] font-black uppercase tracking-[0.24em] transition-opacity duration-300 sm:block"
                      style={{ color: FOAM, opacity: on ? 1 : 0.5 }}
                    >
                      {item.heat}
                    </span>
                    <span className="sr-only sm:hidden">{item.heat}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>
      </div>
    </section>
  )
}
