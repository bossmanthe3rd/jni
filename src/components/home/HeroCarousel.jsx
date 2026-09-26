import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import { HERO_INTERVAL, heroSlides, flavourStages } from '../../data/site'
import { packPalettes } from '../icons/PackDoodles'
import { BrandHeading, Stars, useMediaQuery } from '../ui/Primitives'
import DoodleField from '../ui/DoodleField'
import { DeskSurface, DeskLip, DESK_SLOTS, WallClock } from './HeroDesk'
import HeroDeskProps from './HeroDeskProps'
import HeroSpice from './HeroSpice'
import { DeskChip, LampBeam, LampPool, PendantShade, SHADE_RIM, deskLight, useDeskClock } from './HeroDeskLife'

const INK = '#0D2818'

// The wall. The site's cream, so the homepage opens on the same ground as
// every other page and runs straight on into the cream Why Flipo's below.
const HERO_GROUND = '#fbf6d0'

/** flavourStages carries the heat label built for the scroll stage below --
 * keyed by slug so the hero can borrow it. */
const stageBySlug = Object.fromEntries(flavourStages.map((s) => [s.slug, s]))

/*
 * The chips that come out when the front pack is picked up: where each lands,
 * in percentages of the pack cluster's box. All of them land in front of the
 * packs' foot line (negative bottom) and to either side of the front pack --
 * beside it, neatly, never scattered toward the keyboard. `spin` is how far
 * each turns in the air.
 */
const CHIP_FALL = [
  { left: 17, bottom: -7, width: 13, spin: 200 },
  { left: 30, bottom: -12, width: 11, spin: -170 },
  { left: 78, bottom: -9, width: 12, spin: 250 },
]

// How long the chips get before the page actually changes.
const GRAB_TO_NAV_MS = 950

/** Hand-drawn arrow aiming the eye at the hero CTA, the way the brand's own
 * banners annotate their button rather than leaving it to be found. */
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

/**
 * The homepage hero: the campaign banners' desk, seen from the chair.
 *
 * A cream wall with the headline on it; a yellow desktop across the full width
 * of the lower third; the three packs standing on it with the current flavour
 * forward; the banners' stationery on the same surface at the same scale; and
 * the desk's dark front edge closing the frame, which doubles as the seam into
 * the next section. HeroDesk explains the layering.
 *
 * Only the flavour moves. The copy crossfades, the packs change places on the
 * desk and the doodled wall re-tints; the desk, its props and the clock
 * stay put.
 *
 * Every vertical measurement hangs off two properties set on the section,
 * `--desk` (the whole desk, lip included) and `--lip`, and `--foot`, derived
 * from them, is where on the surface a pack's foot stands. On a phone the copy
 * and the packs stack in flow and the packs' bottom margin is `--foot`; from
 * md up the packs are laid over the desk at the same `--foot`, so they land on
 * the same line at every width.
 *
 * On top of that sits the desk's life (HeroDeskLife):
 *
 *   The front pack can be picked up. Hover lifts it off the desk and tilts it
 *   toward the pointer while its shadow shrinks; clicking it shakes a few chips
 *   out onto the desk and then goes to the flavour's page. A pack called
 *   forward from behind lands with a small squash.
 *
 *   The room keeps the reader's hours. The sun moves the packs' shadow across
 *   the day; after five the room dims and the lamp -- lit in the current
 *   flavour's colour -- becomes what the packs are lit by.
 *
 *   The scene has depth. With a mouse, the wall, lamp and packs shift by
 *   different amounts as the pointer moves, like leaning in the chair; the
 *   stationery on the desk holds still. On scroll the desk's back edge rises,
 *   as if standing up from it.
 *   None of this runs under reduced motion or on touch.
 */
export default function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const resumeRef = useRef(0)
  // Gates the drop-onto-the-desk entrance to the very first mount only -- the
  // packs stay mounted across flavour changes and just change places.
  const firstLoad = useRef(true)
  // An auto-advancing hero is the one piece of motion on this page a reader
  // cannot escape by not scrolling, so it holds still when the OS asks it to.
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const depthOn = finePointer && !reduceMotion
  const navigate = useNavigate()
  const sectionRef = useRef(null)

  const now = useDeskClock()
  const light = deskLight(now)

  // Picking up the front pack.
  const [lifted, setLifted] = useState(false)
  const [spill, setSpill] = useState(null)
  const grabbing = useRef(false)
  const grabTimer = useRef(0)
  const shake = useAnimationControls()
  const tiltRawX = useMotionValue(0)
  const tiltRawY = useMotionValue(0)
  const tiltX = useSpring(tiltRawX, { stiffness: 220, damping: 20 })
  const tiltY = useSpring(tiltRawY, { stiffness: 220, damping: 20 })

  // Leaning in the chair: pointer position across the hero, -1..1 each way,
  // eased so the scene drifts rather than tracks.
  const leanRawX = useMotionValue(0)
  const leanRawY = useMotionValue(0)
  const leanX = useSpring(leanRawX, { stiffness: 50, damping: 16 })
  const leanY = useSpring(leanRawY, { stiffness: 50, damping: 16 })
  // Standing up from the desk as the hero scrolls away.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  // Far things move least; nearer layers move more, against the pointer.
  const wallX = useTransform(leanX, (v) => v * -4)
  const wallY = useTransform([leanY, scrollYProgress], ([v, p]) => v * -3 - p * 60)
  const packX = useTransform(leanX, (v) => v * -10)
  const packY = useTransform(leanY, (v) => v * -4)
  const deskRise = useTransform(scrollYProgress, [0, 1], [1, 1.22])

  // The pendant's swing, in degrees: a slow pendulum, a little wider on a
  // phone where its cord is short. The lamp, its beam and its pool all rotate
  // by this about the same point on the ceiling; the packs' shadow slides the
  // other way under it.
  const wideScreen = useMediaQuery('(min-width: 768px)')
  const swing = useMotionValue(0)
  useAnimationFrame((t) => {
    if (reduceMotion) return
    swing.set((wideScreen ? 2.2 : 4.5) * Math.sin((t / 6500) * Math.PI * 2))
  })
  const shadowSwing = useTransform(swing, (v) => v * (wideScreen ? 7 : 3))
  // By day the sun competes and the beam is soft; after dark it is the
  // brightest thing in the room.
  const beamStrength = 0.45 + 0.55 * light.lamp

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

  useEffect(
    () => () => {
      window.clearTimeout(resumeRef.current)
      window.clearTimeout(grabTimer.current)
    },
    []
  )

  const onLean = (e) => {
    if (!depthOn || !sectionRef.current) return
    const r = sectionRef.current.getBoundingClientRect()
    leanRawX.set(((e.clientX - r.left) / r.width) * 2 - 1)
    leanRawY.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }

  const onTilt = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    tiltRawY.set(((e.clientX - r.left) / r.width - 0.5) * 16)
    tiltRawX.set(((e.clientY - r.top) / r.height - 0.5) * -10)
  }

  const putDown = () => {
    setLifted(false)
    tiltRawX.set(0)
    tiltRawY.set(0)
  }

  // Clicking the front pack: a shake, the chips fall out beside it, then the
  // flavour page. Anything that is not a plain click -- a new tab, a new
  // window -- is left to the browser, and reduced motion goes straight to the
  // page.
  const grab = (e, slug) => {
    if (reduceMotion || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    if (grabbing.current) return
    grabbing.current = true
    setPaused(true)
    setSpill({ slug, key: Date.now() })
    shake.start({
      rotate: [0, -7, 6, -4, 2, 0],
      y: [0, -10, 0, -4, 0],
      transition: { duration: 0.5, ease: 'easeInOut' },
    })
    grabTimer.current = window.setTimeout(() => navigate(`/flavours/${slug}`), GRAB_TO_NAV_MS)
  }

  // Choosing a flavour pauses the rotation so the chosen one is actually
  // readable. Touch has no mouseleave to un-pause it, so it resumes once the
  // reader has had the flavour to themselves for a full interval.
  const goTo = (next) => {
    setPaused(true)
    setIndex((next + heroSlides.length) % heroSlides.length)
    window.clearTimeout(resumeRef.current)
    resumeRef.current = window.setTimeout(() => setPaused(false), HERO_INTERVAL)
  }

  const renderPack = (s, i, offset) => {
    const slot = DESK_SLOTS[offset]
    const isFront = offset === 0
    const img = (
      <img
        src={`/assets/hero/pouch-${s.product.slug}.webp`}
        alt={`${s.product.name} pack`}
        loading={i === 0 ? 'eager' : 'lazy'}
        fetchpriority={i === 0 ? 'high' : 'auto'}
        decoding="async"
        className="block h-auto w-full"
      />
    )
    return (
      <motion.div
        key={s.product.slug}
        className="pointer-events-auto absolute origin-bottom"
        style={{ zIndex: slot.z }}
        initial={firstLoad.current ? { opacity: 0, y: -60, x: '-50%' } : false}
        animate={{
          opacity: 1,
          x: '-50%',
          y: 0,
          left: `${slot.cx}%`,
          bottom: `${slot.bottom}%`,
          width: `${slot.width}%`,
          rotate: slot.rotate,
          filter: slot.dim ? 'brightness(0.93) saturate(0.9)' : 'brightness(1) saturate(1)',
        }}
        transition={
          firstLoad.current
            ? reduceMotion
              ? { duration: 0.2 }
              : { type: 'spring', stiffness: 220, damping: 18, delay: 0.3 + offset * 0.09 }
            : reduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 140, damping: 20 }
        }
        onAnimationComplete={() => {
          firstLoad.current = false
        }}
      >
        {/* Landing squash: a pack called forward lands on the desk rather
            than simply arriving. */}
        <motion.div
          style={{ originY: 1 }}
          animate={
            isFront && !reduceMotion
              ? { scaleY: [1, 0.93, 1.03, 1], scaleX: [1, 1.05, 0.985, 1] }
              : { scaleY: 1, scaleX: 1 }
          }
          transition={{ duration: 0.42, times: [0, 0.4, 0.75, 1], delay: firstLoad.current ? 0.62 : 0.3 }}
        >
          {isFront ? (
            <motion.div animate={shake} style={{ originY: 1 }}>
              <motion.div
                style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 800 }}
                animate={{ y: lifted ? -18 : 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <Link
                  to={`/flavours/${s.product.slug}`}
                  aria-label={`Shop ${s.product.name}`}
                  className="block"
                  onPointerEnter={(e) => e.pointerType === 'mouse' && !reduceMotion && setLifted(true)}
                  onPointerMove={(e) => e.pointerType === 'mouse' && !reduceMotion && onTilt(e)}
                  onPointerLeave={putDown}
                  onFocus={() => !reduceMotion && setLifted(true)}
                  onBlur={putDown}
                  onClick={(e) => grab(e, s.product.slug)}
                >
                  {img}
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <button
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show ${s.kicker}`}
              className="block transition-transform duration-200 hover:-translate-y-1.5"
            >
              {img}
            </button>
          )}
        </motion.div>
      </motion.div>
    )
  }

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex w-full flex-col overflow-hidden pt-[var(--site-header-offset)] [--desk:176px] [--lip:44px] md:min-h-[max(640px,min(100svh,900px))] md:[--desk:clamp(220px,31vh,300px)] md:[--lip:clamp(52px,7vh,70px)]"
      style={{
        backgroundColor: HERO_GROUND,
        '--foot': 'calc(var(--lip) + (var(--desk) - var(--lip)) * 0.4)',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false)
        leanRawX.set(0)
        leanRawY.set(0)
      }}
      onPointerMove={onLean}
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
      {/* THE WALL -------------------------------------------------------- */}

      {/* Everything on the wall moves together, and least: it is furthest
          away. */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={depthOn ? { x: wallX, y: wallY } : undefined}
      >

      {/* The wall is papered in the current flavour: the old hero's doodle
          field, across the whole wall and re-tinting with every flavour change,
          so the room itself changes colour with the pack in front. It starts
          below the ticker (the one solid part of the header, which would slice
          any doodle reaching under it) and stops at the desk's back edge -- the
          desk is furniture, not wallpaper. */}
      <div
        className="pointer-events-none absolute inset-x-0"
        style={{ top: 'var(--site-ticker-height, 0px)', bottom: 'var(--desk)' }}
      >
        <DoodleField
          flavour={slide.product.slug}
          ground={HERO_GROUND}
          intensity="medium"
          count={23}
          seed={101}
          fadeEdges={{ top: 6, bottom: 10 }}
        />
      </div>

      {/* And the old hero's second, bolder layer on the pack side of the wall,
          at nearly the pack's own strength. It ramps up from its inner edge so
          nothing is sliced at the seam, and is loudest round the lamp and the
          packs, gone by the copy. */}
      <div
        className="pointer-events-none absolute right-0 isolate hidden w-[46%] md:block [mask-image:linear-gradient(to_right,transparent_0,#000_26%)]"
        style={{ top: 'var(--site-ticker-height, 0px)', bottom: 'var(--desk)' }}
      >
        <DoodleField
          flavour={slide.product.slug}
          ground={HERO_GROUND}
          intensity="bold"
          count={18}
          seed={202}
          fadeEdges={{ top: 6, bottom: 10 }}
        />
      </div>

      {/* The banners' confetti. Its chillies are off: the two fields above
          already carry the flavour's characters on this side of the wall. */}
      <div
        className="pointer-events-none absolute inset-x-0 z-[2] hidden md:block"
        style={{ top: 'var(--site-ticker-height, 0px)', bottom: 'var(--desk)' }}
      >
        <HeroSpice slug={slide.product.slug} chillies={false} />
      </div>

      <WallClock
        now={now}
        className="absolute left-[89vw] top-[calc(var(--site-header-offset)+7rem)] z-[2] hidden w-[clamp(52px,5vw,78px)] -rotate-3 md:block"
      />
      </motion.div>

      {/* THE DESK -------------------------------------------------------- */}

      {/* The surface grows from its front edge on scroll, so its back edge
          climbs the wall: the view from standing rather than sitting. */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[var(--desk)]"
        style={depthOn ? { scaleY: deskRise, originY: 1 } : undefined}
      >
        <DeskSurface className="block h-full w-full" />
      </motion.div>

      {/* THE LAMP ------------------------------------------------------- */}

      {/* From md up the lamp hangs from the ceiling -- just under the ticker,
          so it is always wholly on screen -- over the front pack. It is three
          layers, all rotated by the same swing about the same point on the
          ceiling: the pool on the desk (under the packs' shadow), then the
          cord, shade and beam (over the wall and desk, under the packs). The
          packs sit above all of it, so the room takes the flavour's colour
          and the packaging keeps its own. Positions live in index.css. */}
      <motion.div className="hero-lamp-rig hidden md:block z-[4]" style={{ rotate: swing }} aria-hidden="true">
        <LampPool tint={palette.fill} strength={beamStrength} className="hero-lamp-pool block" />
      </motion.div>

      {/* Cast shadow under the packs: the banners' flat olive ellipse. It
          follows the light -- the sun by day, the lamp after dark -- and pulls
          in when the front pack is lifted off the desk. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 z-[4] h-[calc((var(--desk)-var(--lip))*0.3)] w-[70vw] -translate-x-1/2 md:left-auto md:right-[calc(10vw+clamp(320px,min(40vw,62vh),620px)*0.025)] md:w-[calc(clamp(320px,min(40vw,62vh),620px)*0.95)] md:translate-x-0"
        style={{
          bottom: 'calc(var(--foot) - (var(--desk) - var(--lip)) * 0.12)',
          ...(depthOn ? { x: packX } : {}),
        }}
      >
        <motion.div className="h-full w-full" style={{ x: shadowSwing }}>
        <motion.div
          className="h-full w-full rounded-[50%] bg-[rgb(13,40,24)] blur-[2px]"
          initial={false}
          animate={{
            x: `${light.shadowX * 12}%`,
            scaleX: light.stretch * (lifted ? 0.86 : 1),
            scaleY: lifted ? 0.8 : 1,
            opacity: light.shadowOpacity * (lifted ? 0.7 : 1),
          }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        />
        </motion.div>
      </motion.div>

      {/* The stationery stays put under the pointer: sliding against the
          cursor it read as the desk coming loose rather than as depth. */}
      <div className="pointer-events-none absolute inset-0 z-[5]">
        <HeroDeskProps />
      </div>

      {/* The light in the room. By day, a cool or warm wash on the wall --
          the wall only, so it never bleaches the props. After five, the room
          dims everywhere but a pool around the packs, which the lamp keeps
          lit. Neither covers the packs themselves or the copy. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-[6] bottom-[var(--desk)]"
        style={{ backgroundImage: light.wash }}
      />
      {light.dim > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[6] [--pool-x:50%] [--pool-y:74%] md:[--pool-x:70%] md:[--pool-y:66%]"
          style={{
            backgroundImage: `radial-gradient(ellipse 34% 46% at var(--pool-x) var(--pool-y), rgba(16,30,48,0) 0%, rgba(16,30,48,${light.dim * 0.35}) 55%, rgba(16,30,48,${light.dim}) 100%)`,
          }}
        />
      )}

      <motion.div className="hero-lamp-rig hidden md:block z-[7]" style={{ rotate: swing }} aria-hidden="true">
        <span className="hero-lamp-cord" />
        <LampBeam
          tint={palette.fill}
          strength={beamStrength}
          topHalf={SHADE_RIM.half * (100 / 2.4)}
          className="hero-lamp-beam block"
        />
        <PendantShade tint={palette.fill} glow={light.lamp} className="hero-lamp-shade block" />
      </motion.div>

      <DeskLip className="pointer-events-none absolute inset-x-0 bottom-0 z-[7] h-[var(--lip)] w-full" />

      {/* CONTENT --------------------------------------------------------- */}

      <div className="relative z-[8] flex flex-1 flex-col px-5 pt-8 sm:px-8 sm:pt-12 md:justify-center md:px-[6vw] md:pb-[calc(var(--desk)+2rem)] md:pt-6">
        {/* Only the copy crossfades per flavour -- the packs below stay mounted
            and change places on the desk. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.product.slug}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-[30rem] text-center md:mx-0 md:max-w-[min(42vw,40rem)] md:text-left"
          >
            <p
              className="mb-3 text-[11px] font-black uppercase tracking-[0.32em] sm:text-xs"
              style={{ color: palette.line }}
            >
              {slide.kicker} &middot; {stage.heat}
            </p>

            <BrandHeading
              as="h1"
              className="text-[clamp(2.1rem,9vw,3rem)] leading-[0.92] sm:text-6xl md:text-[clamp(3rem,5.4vw,5.1rem)]"
            >
              {slide.headline}
            </BrandHeading>

            <p
              className="mx-auto mt-4 max-w-[28rem] text-[0.95rem] font-bold leading-6 sm:text-base sm:leading-7 md:mx-0"
              style={{ color: INK }}
            >
              {slide.product.subtitle}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start">
              <span className="relative inline-block">
                <ArrowDoodle className="pointer-events-none absolute -left-20 -top-16 hidden h-20 w-24 lg:block" />
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

        {/* The packs, standing on the desk. In flow on a phone -- under the
            copy, bottom margin at the foot line -- and laid over the desk's
            right-hand side from md up. The box is square-ish; DESK_SLOTS
            places the three packs inside it. */}
        <motion.div
          className="pointer-events-none relative z-[6] mx-auto mb-[var(--foot)] mt-[128px] aspect-[1/0.86] w-[min(84vw,24rem)] md:absolute md:bottom-[var(--foot)] md:right-[10vw] md:mb-0 md:mt-0 md:w-[clamp(320px,min(40vw,62vh),620px)]"
          style={depthOn ? { x: packX, y: packY } : undefined}
        >
          {/* Phones: the lamp on a short cord just above the packs, its light
              behind them in this box. From md up the lamp hangs from the
              ceiling instead -- see THE LAMP above. */}
          <motion.div className="hero-pendant-light absolute inset-0 z-[1] md:hidden" style={{ rotate: swing }}>
            <LampBeam
              tint={palette.fill}
              strength={beamStrength}
              topHalf={24}
              className="absolute inset-x-0 top-[-4%] block h-[100%] w-full"
            />
            <LampPool tint={palette.fill} strength={beamStrength} className="absolute -bottom-[6%] left-[-6%] block h-[16%] w-[112%]" />
          </motion.div>
          <motion.div className="hero-pendant absolute z-[2] md:hidden" style={{ rotate: swing }}>
            <span className="hero-lamp-cord" />
            <PendantShade tint={palette.fill} glow={light.lamp} className="hero-pendant-shade block" />
          </motion.div>

          {heroSlides.map((s, i) =>
            renderPack(s, i, (i - index + heroSlides.length) % heroSlides.length)
          )}

          {/* The chips out of the picked-up pack: up out of the top, over,
              and down flat onto the desk beside it. */}
          {spill &&
            CHIP_FALL.map((c, k) => (
              <motion.div
                key={`${spill.key}-${k}`}
                className="absolute z-30"
                style={{ width: `${c.width}%`, x: '-50%' }}
                initial={{ left: '50%', bottom: '80%', rotate: 0, scaleY: 1, opacity: 0 }}
                animate={{
                  left: ['50%', `${(50 + c.left) / 2}%`, `${c.left}%`],
                  bottom: ['80%', '104%', `${c.bottom}%`],
                  rotate: [0, c.spin * 0.6, c.spin],
                  scaleY: [1, 1, 0.42],
                  opacity: [0, 1, 1],
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.12 + k * 0.06,
                  times: [0, 0.34, 1],
                  ease: ['easeOut', 'easeIn'],
                }}
              >
                <DeskChip
                  flavour={spill.slug}
                  className="block h-auto w-full drop-shadow-[0_3px_0_rgba(13,40,24,0.25)]"
                />
              </motion.div>
            ))}
        </motion.div>
      </div>

      {/* The flavour switcher, written on the desk's front edge. Labelled,
          because three bare pips of different lengths never said what they
          switched between. */}
      <nav
        aria-label="Choose a flavour"
        className="absolute inset-x-0 bottom-0 z-[9] flex h-[calc(var(--lip)*0.72)] items-center justify-center"
      >
        <ol className="flex items-center gap-1 sm:gap-3">
          {heroSlides.map((s, i) => {
            const on = i === index
            const p = packPalettes[s.product.slug]
            return (
              <li key={s.product.slug}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={on ? 'true' : undefined}
                  className="flex items-center gap-2 rounded-pill px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#fbf6d0] sm:text-xs"
                  style={{ color: on ? '#fbf6d0' : 'rgba(251,246,208,0.55)' }}
                >
                  <span
                    aria-hidden="true"
                    className="block h-2 w-2 rounded-full transition-transform duration-300"
                    style={{
                      backgroundColor: on ? p.fill : 'rgba(251,246,208,0.35)',
                      transform: on ? 'scale(1.35)' : 'none',
                    }}
                  />
                  {s.kicker}
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
    </section>
  )
}
