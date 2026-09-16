import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion'
import { HERO_INTERVAL, heroSlides, flavourStages } from '../../data/site'
import { doodleComponents, packPalettes } from '../icons/PackDoodles'
import { BrandHeading, Sparkle, Blob, Stars, useMediaQuery } from '../ui/Primitives'
import { BLOB_PATHS, blobShape, blobClip } from '../ui/BlobShapes'
import { TriangleCluster } from './FlavourGrid'
import DoodleField from '../ui/DoodleField'
import FlipSpot from '../mascot/FlipSpot'

const INK = '#0D2818'

/** Blend `hex` toward `toward` by t (0 = unchanged, 1 = fully the target). */
function mixHex(hex, toward, t) {
  const parse = (h) => {
    const v = parseInt(h.replace('#', ''), 16)
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
  }
  const [r1, g1, b1] = parse(hex)
  const [r2, g2, b2] = parse(toward)
  const c = (a, b) => Math.round(a + (b - a) * t)
  return `rgb(${c(r1, r2)}, ${c(g1, g2)}, ${c(b1, b2)})`
}
// The hero now holds one fixed brand colour rather than repainting itself per
// flavour like the scroll stage does -- flavour identity lives in the pack,
// the doodle tint, the heat-rail pips and Flip's own colours instead.
//
// That colour is the site's cream. Every other page already sits its content
// on cream directly under the near-black header, so this is what puts the
// homepage on the same ground as the rest of the site -- and it means the
// hero no longer hard-cuts into the cream Why Flipo's section below it.
const HERO_GROUND = '#fbf6d0'

/** flavourStages carries the heat label and propped pack shot already built
 * for the scroll stage below -- keyed by slug so the hero can borrow them. */
const stageBySlug = Object.fromEntries(flavourStages.map((s) => [s.slug, s]))

/** One reaction per flavour, played by Flip's 'hero' rig mode -- see
 * FlipSpot.jsx for how each borrows an existing rig lever (the wave arm, the
 * rush threshold, a solo wink) rather than needing new artwork. */
const HERO_EMOTES = {
  'sweet-chilli-rush': 'delighted',
  'jalapeno-kick': 'cheeky',
  'peri-peri-punch': 'shocked',
}

/**
 * Family-shot fan slots, keyed by how many steps a pack sits behind the
 * active one in the rotation order (0 = front/active, 1 and 2 = receding
 * behind it). left/top are the stage box's own percentages, top-left
 * anchored.
 */
const PACK_SLOTS = [
  { left: '12%', top: '20%', width: '78%', rotate: -6, zIndex: 30, fade: 0 },
  { left: '56%', top: '0%', width: '38%', rotate: 14, zIndex: 20, fade: 0.4 },
  { left: '0%', top: '4%', width: '36%', rotate: -18, zIndex: 10, fade: 0.45 },
]

/** Hand-drawn arrow aiming the eye at the hero CTA, the way the brand's own
 * reference layouts annotate their button rather than leaving it to be found. */
function ArrowDoodle({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 96 78" fill="none" aria-hidden="true">
      <path
        d="M8 8c10 26 4 46 30 58 14 6.5 30 4 44-4"
        stroke={INK}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M64 56 82 62 76 44"
        stroke={INK}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** One-time doodle burst on first paint -- the hero's own opening beat,
 * played once and never repeated on later auto-rotations, distinct from the
 * per-slide crossfade those use. angle°, distance (vw), size (px), spin°,
 * doodle name. */
const HERO_BURST = [
  { a: -75, d: 11, size: 46, spin: 150, shape: 'chilli-half' },
  { a: -30, d: 14, size: 32, spin: -170, shape: 'seed' },
  { a: 8, d: 12, size: 40, spin: 130, shape: 'chilli-slice' },
  { a: 50, d: 15, size: 44, spin: -140, shape: 'pepper-section' },
  { a: 95, d: 12, size: 30, spin: 190, shape: 'seed' },
  { a: 135, d: 14, size: 42, spin: -120, shape: 'jalapeno' },
  { a: -165, d: 13, size: 28, spin: 160, shape: 'seed' },
  { a: -115, d: 11, size: 36, spin: -150, shape: 'chilli-half' },
]

/** A pack shot clipped to its flavour's own signature blob silhouette, with a
 * hand-drawn keyline traced around the exact same outline and a drop-shadow
 * that hugs it -- the organic alternative to the rounded-rect-with-border
 * card used on the PDP gallery, bundle cards and the flavour stage below. */
function BlobPack({ blobName, lineColor, fade = 0, children }) {
  // A receded pack used to be dimmed with element opacity, which made the pack
  // itself translucent and let the doodle field show straight through the art.
  // Instead the pack stays fully opaque and is washed toward the ground colour
  // by a veil inside the clip -- with the keyline and its hard shadow mixed the
  // same distance, so the whole pack recedes as one piece.
  const line = fade > 0 ? mixHex(lineColor, HERO_GROUND, fade) : lineColor
  return (
    <div className="relative h-full w-full" style={{ filter: `drop-shadow(5px 6px 0 ${line})` }}>
      <div className="relative h-full w-full" style={blobClip(blobName)}>
        {children}
        {fade > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: HERO_GROUND, opacity: fade }}
          />
        )}
      </div>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={BLOB_PATHS[blobName]} fill="none" stroke={line} strokeWidth="0.024" />
      </svg>
    </div>
  )
}

/** A gentle cursor-tilt on the active pack only -- a desktop delighter that
 * is naturally inert on touch, since nothing there fires mousemove. */
function TiltCard({ children }) {
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 150, damping: 14 })
  const sry = useSpring(ry, { stiffness: 150, damping: 14 })

  return (
    <motion.div
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width - 0.5
        const py = (e.clientY - rect.top) / rect.height - 0.5
        ry.set(px * 16)
        rx.set(py * -16)
      }}
      onMouseLeave={() => {
        rx.set(0)
        ry.set(0)
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * The homepage hero.
 *
 * Previously an auto-rotating photo carousel with the headline baked into each
 * background JPG. It now borrows the flavour-stage's grammar (live bubble
 * heading, doodle field, propped pack shots) but stays deliberately distinct
 * from it: one fixed brand colour instead of a full per-flavour repaint,
 * blob-clipped packs instead of the rounded-rect card used everywhere else,
 * a family shot of all three flavours instead of a single rotating product
 * ad, sparkle/triangle/blob ornament around the heading to match the rest of
 * the site's big headings, and Flip reacting differently per flavour at the
 * seam between the copy and the pack fan. A one-time load-in beat plays once
 * on first paint only.
 */
export default function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const [showBurst, setShowBurst] = useState(true)
  const resumeRef = useRef(0)
  // Gates the drop-in entrance to the very first mount only -- the packs and
  // Flip stay mounted across slide changes now, so this just has to flip to
  // false once and stays that way.
  const firstLoad = useRef(true)
  // An auto-advancing carousel is the one piece of motion on this page a reader
  // cannot escape by not scrolling, so it holds still when the OS asks it to.
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const slide = heroSlides[index]
  const stage = stageBySlug[slide.product.slug]
  const palette = packPalettes[slide.product.slug]

  useEffect(() => {
    if (paused || reduceMotion) return
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % heroSlides.length),
      HERO_INTERVAL
    )
    return () => window.clearInterval(id)
  }, [paused, reduceMotion])

  useEffect(() => () => window.clearTimeout(resumeRef.current), [])

  useEffect(() => {
    if (reduceMotion) {
      setShowBurst(false)
      return
    }
    const t = window.setTimeout(() => setShowBurst(false), 1300)
    return () => window.clearTimeout(t)
  }, [reduceMotion])

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
      className="relative isolate mt-[var(--site-header-offset)] w-full overflow-hidden"
      style={{ backgroundColor: HERO_GROUND }}
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
      {/* One-time opening beat: doodles shake out on first paint only.
          Independent of everything below, so it never replays. */}
      {showBurst && !reduceMotion && (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-hidden="true">
          {HERO_BURST.map((b, i) => {
            const Shape = doodleComponents[b.shape]
            if (!Shape) return null
            const rad = (b.a * Math.PI) / 180
            const x = Math.cos(rad) * b.d
            const y = Math.sin(rad) * b.d
            return (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: '70%',
                  top: '34%',
                  width: b.size,
                  marginLeft: -b.size / 2,
                  marginTop: -b.size / 2,
                }}
                initial={{ opacity: 0, x: 0, y: 0, rotate: 0, scale: 0.3 }}
                animate={{ opacity: [0, 1, 1, 0], x: `${x}vw`, y: `${y}vw`, rotate: b.spin, scale: 1 }}
                transition={{
                  duration: 1.05,
                  delay: i * 0.02,
                  ease: [0.16, 0.8, 0.3, 1],
                  times: [0, 0.22, 0.7, 1],
                }}
              >
                <Shape palette={packPalettes[heroSlides[0].product.slug]} className="h-full w-full" />
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="relative isolate min-h-[560px] px-5 pb-24 pt-10 sm:px-8 sm:pb-28 sm:pt-14 md:min-h-[640px] md:px-[6vw] md:pb-24 md:pt-20">
        <DoodleField
          flavour={slide.product.slug}
          ground={HERO_GROUND}
          intensity="medium"
          count={20}
          seed={101}
        />

        {/* A bolder, second doodle layer confined to the pack side of the
            hero -- away from the body copy, so it can run louder than the
            base field without ever competing with anything readable. */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 isolate hidden w-[46%] md:block"
          aria-hidden="true"
        >
          <DoodleField
            flavour={slide.product.slug}
            ground={HERO_GROUND}
            intensity="bold"
            count={16}
            seed={202}
          />
        </div>

        {/* Copy is the only thing that still crossfades per slide -- the
            packs and Flip below stay mounted and just reshuffle. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.product.slug}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 mx-auto max-w-[30rem] text-center md:mx-0 md:max-w-[38rem] md:text-left"
          >
            <div className="relative inline-block">
              <motion.div
                aria-hidden="true"
                className="absolute -left-9 -top-3 hidden sm:block"
                animate={{ rotate: [-8, 8, -8], y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut' }}
              >
                <TriangleCluster />
              </motion.div>
              <motion.div
                aria-hidden="true"
                className="absolute -right-7 -top-6 hidden sm:block"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 7, ease: 'linear' }}
              >
                <Sparkle color={palette.line} className="h-7 w-7 sm:h-9 sm:w-9" />
              </motion.div>
              <motion.div
                aria-hidden="true"
                className="absolute -left-6 bottom-2 hidden sm:block"
                animate={{ scale: [1, 1.22, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 2.9, ease: 'easeInOut' }}
              >
                <Blob className="h-5 w-5 sm:h-6 sm:w-6" />
              </motion.div>

              <p
                className="mb-3 text-[11px] font-black uppercase tracking-[0.32em] sm:text-xs"
                style={{ color: palette.line }}
              >
                {slide.kicker} &middot; {stage.heat}
              </p>

              <BrandHeading
                as="h1"
                fill="#f3c63b"
                stroke={palette.line}
                className="text-[clamp(1.95rem,8.4vw,2.8rem)] leading-[0.9] sm:text-7xl md:max-w-[26rem] lg:max-w-none lg:text-[5.4rem]"
              >
                {slide.headline}
              </BrandHeading>
            </div>

            <p
              className="mx-auto mt-4 max-w-[28rem] text-[0.95rem] font-bold leading-6 sm:text-base sm:leading-7 md:mx-0"
              style={{ color: INK }}
            >
              {slide.product.subtitle}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start">
              <span className="relative inline-block">
                <ArrowDoodle className="pointer-events-none absolute -left-16 -top-14 hidden h-16 w-20 sm:-left-20 sm:-top-16 sm:block sm:h-20 sm:w-24" />
                <Link to={`/flavours/${slide.product.slug}`} className="jni-btn">
                  Shop {slide.product.shortName}
                </Link>
              </span>
              <p className="text-sm font-black" style={{ color: INK }}>
                &#8377;{slide.product.price}
                <span
                  className="ml-2 text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: palette.line }}
                >
                  {slide.product.weight}
                </span>
              </p>

              {/* The one piece of credibility that belongs only in a hero.
                  It rides in this same flex row rather than in a strip of
                  its own: the bottom band is spoken for by the heat rail,
                  and on mobile the pack sits in normal flow, so an extra
                  row would push both down. Swaps per slide like the rest
                  of the copy -- it is inside the crossfade block. */}
              <p className="flex items-center gap-2 text-sm font-black" style={{ color: INK }}>
                <Stars value={slide.product.rating.value} color={palette.line} size={13} />
                <span className="sr-only">
                  Rated {slide.product.rating.value} out of 5 from {slide.product.rating.count} reviews
                </span>
                <span aria-hidden="true">
                  {slide.product.rating.value}
                  <span
                    className="ml-1.5 text-[11px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: palette.line }}
                  >
                    ({slide.product.rating.count})
                  </span>
                </span>
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Family shot: all three flavours stay on screen, fanned out --
            desktop only. On mobile only the active pack shows, in flow,
            matching the space a single hero image already had. */}
        <div className="relative z-10 mx-auto mt-8 w-[62vw] max-w-[16rem] md:hidden">
          <Link to={`/flavours/${slide.product.slug}`} aria-label={`Shop ${slide.product.name}`} className="block">
            <BlobPack blobName={blobShape(index, 'card')} lineColor={palette.line}>
              <img
                src={stage.pack}
                alt={stage.packAlt}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchpriority={index === 0 ? 'high' : 'auto'}
                decoding="async"
                className="block aspect-square w-full object-cover"
              />
            </BlobPack>
          </Link>
        </div>

        <div className="relative z-10 hidden md:absolute md:right-[6vw] md:top-[4%] md:block md:h-[44vw] md:max-h-[32rem] md:w-[44vw] md:max-w-[32rem]">
          {heroSlides.map((s, i) => {
            const offset = (i - index + heroSlides.length) % heroSlides.length
            const slot = PACK_SLOTS[offset]
            const st = stageBySlug[s.product.slug]
            const pal = packPalettes[s.product.slug]
            const isFront = offset === 0
            const blobName = blobShape(i, 'card')
            const image = (
              <img
                src={st.pack}
                alt={st.packAlt}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchpriority={i === 0 ? 'high' : 'auto'}
                decoding="async"
                className="block aspect-square w-full object-cover"
              />
            )
            return (
              <motion.div
                key={s.product.slug}
                className="absolute"
                style={{
                  left: slot.left,
                  top: slot.top,
                  width: slot.width,
                  zIndex: slot.zIndex,
                  transition: 'left 0.55s ease, top 0.55s ease, width 0.55s ease',
                }}
                initial={firstLoad.current ? { opacity: 0, scale: 0.7, y: -40 } : false}
                animate={{ opacity: 1, scale: 1, rotate: slot.rotate, y: 0 }}
                transition={
                  firstLoad.current
                    ? { type: 'spring', stiffness: 220, damping: 18, delay: 0.35 + offset * 0.08 }
                    : { type: 'spring', stiffness: 170, damping: 20 }
                }
                onAnimationComplete={() => {
                  firstLoad.current = false
                }}
              >
                {isFront ? (
                  <Link to={`/flavours/${s.product.slug}`} aria-label={`Shop ${s.product.name}`} className="block">
                    <TiltCard>
                      <BlobPack blobName={blobName} lineColor={pal.line}>
                        {image}
                      </BlobPack>
                    </TiltCard>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Show ${s.kicker}`}
                    className="block transition hover:opacity-90"
                  >
                    <BlobPack blobName={blobName} lineColor={pal.line} fade={slot.fade}>
                      {image}
                    </BlobPack>
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Flip: stands at the seam between the copy and the pack fan,
            reacting to the active flavour. Stays mounted across slide
            changes -- only his tint/emote update -- so his own idle clock
            never restarts. Desktop only for now. */}
        {isDesktop && (
          <FlipSpot
            mode="hero"
            emote={HERO_EMOTES[slide.product.slug]}
            tint={slide.product.slug}
            width="clamp(140px, 16vw, 220px)"
            className="z-30"
            style={{ left: '52%', bottom: '9%' }}
          />
        )}
      </div>

      {/* Heat rail: the same jump-nav pattern as the scroll stage below, so the
          two sections read as one system instead of two different widgets. */}
      <nav
        aria-label="Jump to a flavour"
        className="absolute inset-x-0 bottom-4 z-30 flex justify-center sm:bottom-6"
      >
        <ol className="flex items-center gap-3 sm:gap-5">
          {heroSlides.map((s, i) => {
            const on = i === index
            const p = packPalettes[s.product.slug]
            return (
              <li key={s.product.slug}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show ${s.kicker}`}
                  aria-current={on ? 'true' : undefined}
                  className="flex items-center gap-2.5 rounded-pill py-1 pr-1 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ '--tw-ring-color': INK, '--tw-ring-offset-color': HERO_GROUND }}
                >
                  <span
                    className="block rounded-pill border-2 transition-all duration-300"
                    style={{
                      width: 18 + i * 11,
                      height: on ? 9 : 6,
                      borderColor: on ? p.line : 'transparent',
                      backgroundColor: on ? p.fill : INK,
                      opacity: on ? 1 : 0.4,
                    }}
                  />
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
    </section>
  )
}
