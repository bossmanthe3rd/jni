import { memo, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useMotionValue,
  useInView,
  useMotionValueEvent,
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
import { MAX_FIT, Monitor } from './WhyFlipos'
import { HeroZoomContext } from './heroZoomContext'
import { aspectOf, responsiveImage } from '../../lib/responsiveImage'
import { setBadgeFlavour } from '../../lib/badgeFlavour'

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

/*
 * The packs' slots as transforms. Each pack is laid out in the front slot's
 * box and moved from there, so the numbers below are that box's own: x as a
 * share of its width, y of its height (the pouch's own, from its aspect), and
 * the scale that makes it the slot's width. About its foot, so the foot lands
 * where the slot puts it. The cluster box is 1 : 0.86 (its aspect class).
 */
const FRONT = DESK_SLOTS[0]
const CLUSTER_ASPECT = 0.86
function slotTransform(slot, aspect) {
  return {
    x: `${((slot.cx - FRONT.cx) / FRONT.width) * 100}%`,
    y: `${(-(slot.bottom - FRONT.bottom) * CLUSTER_ASPECT * 100) / (FRONT.width * aspect)}%`,
    scale: slot.width / FRONT.width,
    rotate: slot.rotate,
  }
}

// How wide a pack is drawn: the front slot's share of the cluster, whose
// width is set on the cluster box below (a phone's min(84vw, 24rem), from md
// clamp(320px, min(40vw, 62vh), 620px) -- capped here at its widest).
const PACK_SIZES = '(min-width: 768px) 290px, 39vw'

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
 *
 * On laptops the copy is on a monitor standing on the left of the desk, the
 * packs beside it under the lamp -- the banner's own arrangement -- and the
 * price and rating are a sticky note on its bezel. Scrolling walks the camera
 * up to that monitor until it becomes Why Flipo's (HeroWhyZoom): the packs,
 * lamp and note fade out of the camera's way, the copy clears off the screen
 * and the screensaver takes over, and the flavours stop turning. Below
 * laptop width the copy stands on the wall above the packs, as before.
 */
// Memoised: it takes no props, and the camera move's flags (HeroWhyZoom)
// used to re-render the whole hero each time one flipped mid-scroll.
export default memo(HeroCarousel)

function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  // A ref, not state: every touch on the hero used to re-render it twice.
  const touchStart = useRef(null)
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

  // The camera move into Why Flipo's, when there is one.
  const zoom = useContext(HeroZoomContext)
  const still = useMotionValue(1)
  const fore = zoom.fore ?? still
  const [zoomHold, setZoomHold] = useState(false)
  useMotionValueEvent(fore, 'change', (v) => setZoomHold(v < 1))
  const foreStyle = zoom.staged ? { opacity: fore } : undefined

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

  // The pendant's swing is a CSS animation (.hero-swing in index.css): the
  // lamp, its beam and its pool all rotate about the same point on the
  // ceiling, and the packs' shadow slides the other way under them
  // (.hero-shadow-swing). Run from a per-frame callback it cost a style
  // recalc and a layer update on the main thread every frame the hero was on
  // screen; as CSS it runs on the compositor.
  const wideScreen = useMediaQuery('(min-width: 768px)')
  const laptop = useMediaQuery('(min-width: 1024px)')
  // Everything that runs on its own clock -- the swing, the flavour rotation --
  // stops once the hero is off screen.
  const heroInView = useInView(sectionRef)
  // By day the sun competes and the beam is soft; after dark it is the
  // brightest thing in the room.
  const beamStrength = 0.45 + 0.55 * light.lamp

  const slide = heroSlides[index]
  const stage = stageBySlug[slide.product.slug]
  const palette = packPalettes[slide.product.slug]

  // The header badge wears the flavour on screen.
  useEffect(() => setBadgeFlavour(slide.product.slug), [slide.product.slug])

  // A backgrounded tab keeps no rotation going: browsers only throttle the
  // interval there, so the hero would still re-render on its own, unseen.
  const [tabShown, setTabShown] = useState(() => document.visibilityState !== 'hidden')
  useEffect(() => {
    const sync = () => setTabShown(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  // A flavour change re-tints the whole wall: ~50-80ms of render and paint on
  // a mid-range phone. Landing mid-scroll, that read as a stutter, so a tick
  // that falls inside a scroll waits for it to settle and turns then instead.
  const lastScroll = useRef(0)
  useEffect(() => {
    const mark = () => {
      lastScroll.current = performance.now()
    }
    window.addEventListener('scroll', mark, { passive: true })
    return () => window.removeEventListener('scroll', mark)
  }, [])

  useEffect(() => {
    if (paused || lifted || reduceMotion || zoomHold || !heroInView || !tabShown) return
    const SETTLE = 250
    let retry = 0
    const advance = () => {
      const quietFor = performance.now() - lastScroll.current
      if (quietFor < SETTLE) {
        window.clearTimeout(retry)
        retry = window.setTimeout(advance, SETTLE - quietFor)
        return
      }
      setIndex((i) => (i + 1) % heroSlides.length)
    }
    const id = window.setInterval(advance, HERO_INTERVAL)
    return () => {
      window.clearInterval(id)
      window.clearTimeout(retry)
    }
  }, [paused, lifted, reduceMotion, zoomHold, heroInView, tabShown])

  useEffect(
    () => () => {
      window.clearTimeout(resumeRef.current)
      window.clearTimeout(grabTimer.current)
    },
    []
  )

  // The hero's box, read once and kept until a scroll or resize moves it: a
  // read on every pointer move forced a layout on every pointer move.
  const leanBox = useRef(null)
  useEffect(() => {
    const drop = () => {
      leanBox.current = null
    }
    window.addEventListener('scroll', drop, { passive: true })
    window.addEventListener('resize', drop)
    return () => {
      window.removeEventListener('scroll', drop)
      window.removeEventListener('resize', drop)
    }
  }, [])

  const onLean = (e) => {
    if (!depthOn || !sectionRef.current) return
    const r = leanBox.current || (leanBox.current = sectionRef.current.getBoundingClientRect())
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
    const src = `/assets/hero/pouch-${s.product.slug}.webp`
    const img = (
      <img
        {...responsiveImage(src, PACK_SIZES)}
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
        className="pointer-events-auto absolute"
        style={{ zIndex: slot.z, left: `${FRONT.cx}%`, bottom: `${FRONT.bottom}%`, width: `${FRONT.width}%` }}
        initial={firstLoad.current ? { opacity: 0, y: -60, x: '-50%' } : false}
        animate={{ opacity: 1, x: '-50%', y: 0 }}
        transition={
          firstLoad.current
            ? reduceMotion
              ? { duration: 0.2 }
              : { type: 'spring', stiffness: 220, damping: 18, delay: 0.3 + offset * 0.09 }
            : { duration: 0 }
        }
        onAnimationComplete={() => {
          firstLoad.current = false
        }}
      >
        {/* Every pack is laid out in the front slot's box and carried to its
            own slot by transform alone. Moving left, bottom and width moved
            the layout under the reader on every flavour change -- layout
            work each frame of the spring, and a layout shift each time. */}
        <motion.div
          style={{ originX: 0.5, originY: 1 }}
          initial={false}
          animate={{
            ...slotTransform(slot, aspectOf(src) ?? 1.6),
            filter: slot.dim ? 'brightness(0.93) saturate(0.9)' : 'brightness(1) saturate(1)',
          }}
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 140, damping: 20 }}
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
      </motion.div>
    )
  }

  return (
    <section
      ref={sectionRef}
      data-asleep={heroInView ? undefined : ''}
      className="relative isolate flex w-full flex-col overflow-hidden pt-[var(--site-header-offset)] [--desk:176px] [--lip:44px] md:min-h-[max(640px,min(100svh,900px))] md:[--desk:clamp(220px,31vh,300px)] md:[--lip:clamp(52px,7vh,70px)]"
      style={{
        backgroundColor: HERO_GROUND,
        '--foot': 'calc(var(--lip) + (var(--desk) - var(--lip)) * 0.4)',
        '--hero-h': zoom.staged ? '100vh' : 'max(640px, min(100svh, 900px))',
        ...(zoom.staged ? { height: '100vh', minHeight: 0 } : {}),
      }}
      // No hover pause on the section itself: staged, it is the whole screen,
      // so a resting mouse anywhere held the first flavour forever. The
      // rotation holds while a pack is in hand (`lifted`) instead.
      onMouseLeave={() => {
        leanRawX.set(0)
        leanRawY.set(0)
      }}
      onPointerMove={onLean}
      onTouchStart={(e) => {
        const t = e.changedTouches[0]
        touchStart.current = t ? { x: t.clientX, y: t.clientY } : null
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current
        const t = e.changedTouches[0]
        touchStart.current = null
        if (!start || !t) return
        const dx = t.clientX - start.x
        const dy = t.clientY - start.y
        // Mostly sideways only: a diagonal flick is someone scrolling past the
        // hero, and it used to change the flavour under their thumb.
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return
        goTo(index + (dx < 0 ? 1 : -1))
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
      {/* Mounted only where it shows. `hidden md:block` alone kept this and
          the other tablet/laptop-only pieces below alive on phones, animating
          and repainting behind display: none. */}
      {wideScreen && (
        <div
          className="pointer-events-none absolute right-0 isolate w-[46%] [mask-image:linear-gradient(to_right,transparent_0,#000_26%)]"
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
      )}

      {/* The banners' confetti. Its chillies are off: the two fields above
          already carry the flavour's characters on this side of the wall. */}
      {wideScreen && (
        <div
          className="pointer-events-none absolute inset-x-0 z-[2]"
          style={{ top: 'var(--site-ticker-height, 0px)', bottom: 'var(--desk)' }}
        >
          <HeroSpice slug={slide.product.slug} chillies={false} />
        </div>
      )}

      {wideScreen && (
        <WallClock
          now={now}
          className="absolute left-[89vw] top-[calc(var(--site-header-offset)+7rem)] z-[2] w-[clamp(52px,5vw,78px)] -rotate-3"
        />
      )}
      </motion.div>

      {/* THE DESK -------------------------------------------------------- */}

      {/* The surface grows from its front edge on scroll, so its back edge
          climbs the wall: the view from standing rather than sitting. */}
      <motion.div
        data-hero-desk
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
      <motion.div className="hero-lamp-rig hero-swing hidden md:block z-[4]" style={foreStyle} aria-hidden="true">
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
          ...foreStyle,
        }}
      >
        <div className="hero-shadow-swing h-full w-full">
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
        </div>
      </motion.div>

      {/* The stationery stays put under the pointer: sliding against the
          cursor it read as the desk coming loose rather than as depth. */}

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

      {/* The monitor, with the copy on its screen (laptops). Above the room's
          light, since a lit screen is not dimmed by the evening. */}
      {laptop && (
        <div className="pointer-events-none absolute inset-0 z-[7]">
          <HeroMonitor
            screen={<HeroCopy slide={slide} stage={stage} palette={palette} reduceMotion={reduceMotion} onScreen />}
            note={<PriceNote product={slide.product} />}
            fore={fore}
            staged={zoom.staged}
          />
        </div>
      )}

      {/* The stationery, in front of the monitor -- it is nearer the chair.
          Above the room's light with it, so it takes the evening's dimming
          here instead. */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-[7]"
        style={{ ...foreStyle, filter: light.dim > 0 ? `brightness(${1 - light.dim})` : undefined }}
      >
        <HeroDeskProps />
      </motion.div>

      <motion.div className="hero-lamp-rig hero-swing hidden md:block z-[7]" style={foreStyle} aria-hidden="true">
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

      <motion.div style={foreStyle} className="relative z-[8] flex flex-1 flex-col lg:pointer-events-none px-5 pt-8 sm:px-8 sm:pt-12 md:justify-center md:px-[6vw] md:pb-[calc(var(--desk)+2rem)] md:pt-6">
        {/* Only the copy crossfades per flavour -- the packs below stay mounted
            and change places on the desk. On laptops it is on the monitor. */}
        <div className="lg:hidden">
          <HeroCopy slide={slide} stage={stage} palette={palette} reduceMotion={reduceMotion} />
        </div>

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
          <div className="hero-pendant-light hero-swing absolute inset-0 z-[1] md:hidden">
            <LampBeam
              tint={palette.fill}
              strength={beamStrength}
              topHalf={24}
              className="absolute inset-x-0 top-[-4%] block h-[100%] w-full"
            />
            <LampPool tint={palette.fill} strength={beamStrength} className="absolute -bottom-[6%] left-[-6%] block h-[16%] w-[112%]" />
          </div>
          <div className="hero-pendant hero-swing absolute z-[2] md:hidden">
            <span className="hero-lamp-cord" />
            <PendantShade tint={palette.fill} glow={light.lamp} className="hero-pendant-shade block" />
          </div>

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
      </motion.div>

      {/* The flavour switcher, written on the desk's front edge. Labelled,
          because three bare pips of different lengths never said what they
          switched between. */}
      <motion.nav
        style={foreStyle}
        aria-label="Choose a flavour"
        className="absolute inset-x-0 bottom-0 z-[9] flex h-[calc(var(--lip)*0.72)] items-center justify-center"
      >
        <ol className="flex items-center gap-0 xs:gap-1 sm:gap-3">
          {heroSlides.map((s, i) => {
            const on = i === index
            const p = packPalettes[s.product.slug]
            return (
              <li key={s.product.slug}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={on ? 'true' : undefined}
                  className="flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-pill px-2 text-xs font-black uppercase tracking-[0.1em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#fbf6d0] xs:gap-2 xs:px-3 xs:tracking-[0.18em] sm:text-xs"
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
      </motion.nav>
    </section>
  )
}

// The monitor's own layout size (WhyFlipos, laptops): 680 wide, frame 432 +
// stand. The hero lays it out at that size and shrinks it to fit.
const MONITOR_W = 680
const MONITOR_H = 528
// Where the monitor's foot stands, up from the section's bottom: 62% of the
// way back across the desktop, a little behind the packs' own foot line (40%).
const MONITOR_FOOT = 'calc(var(--lip) + (var(--desk) - var(--lip)) * 0.62)'
// How wide it stands: most of the left half, or as tall as the room under the
// header allows -- and never more than 88% of Why Flipo's own monitor (680 x
// that section's artboard fit, from WhyFlipos), so the camera always has
// somewhere to close in to rather than backing away.
const MONITOR_WIDTH = `min(46vw, calc((var(--hero-h) - ${MONITOR_FOOT} - var(--site-header-offset) - 44px) * ${MONITOR_W / MONITOR_H}), ${
  0.88 * 680 * MAX_FIT
}px, calc((100vw - 40px) * ${(0.88 * 680) / 1180}), calc((100vh - 150px) * ${(0.88 * 680) / 600}))`
const SCREEN_INK = '#071a16'
const SUNSHINE = '#f3c63b'

/**
 * The flavour's copy: kicker, headline, line, button -- and, off the screen,
 * price and rating. `onScreen` sets it for the monitor's dark screen, in the
 * screensaver's own type, with price and rating moved out onto the note.
 * Crossfades per flavour either way.
 */
function HeroCopy({ slide, stage, palette, reduceMotion, onScreen = false }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={slide.product.slug}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
        transition={{ duration: reduceMotion ? 0.15 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={
          onScreen
            ? 'hero-screen-copy'
            : 'mx-auto max-w-[30rem] text-center md:mx-0 md:max-w-[min(42vw,40rem)] md:text-left'
        }
      >
        <p
          className={onScreen ? 'hero-screen-kicker' : 'mb-3 text-xs font-black uppercase tracking-[0.32em] sm:text-xs'}
          style={onScreen ? undefined : { color: palette.line }}
        >
          {slide.kicker} &middot; {stage.heat}
        </p>

        <BrandHeading
          as="h1"
          fill={onScreen ? SUNSHINE : undefined}
          stroke={onScreen ? SCREEN_INK : undefined}
          className={
            onScreen
              ? 'hero-screen-title'
              : 'text-[clamp(2.1rem,9vw,3rem)] leading-[0.92] sm:text-6xl md:text-[clamp(3rem,5.4vw,5.1rem)]'
          }
        >
          {slide.headline}
        </BrandHeading>

        <p
          className={
            onScreen
              ? 'hero-screen-line'
              : 'mx-auto mt-4 max-w-[28rem] text-[0.95rem] font-bold leading-6 sm:text-base sm:leading-7 md:mx-0'
          }
          style={onScreen ? undefined : { color: INK }}
        >
          {slide.product.subtitle}
        </p>

        {onScreen ? (
          <Link to={`/flavours/${slide.product.slug}`} className="jni-btn hero-screen-cta">
            Shop {slide.product.shortName}
          </Link>
        ) : (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start">
            <span className="relative inline-block">
              <ArrowDoodle className="pointer-events-none absolute -left-20 -top-16 hidden h-20 w-24 lg:block" />
              <Link to={`/flavours/${slide.product.slug}`} className="jni-btn">
                Shop {slide.product.shortName}
              </Link>
            </span>
            <p className="text-sm font-black" style={{ color: INK }}>
              &#8377;{slide.product.price}
              <span className="ml-2 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: palette.line }}>
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
                <span className="ml-1.5 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: palette.line }}>
                  ({slide.product.rating.count})
                </span>
              </span>
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/** Price and rating on a sticky note, stuck to the monitor's bezel. */
function PriceNote({ product }) {
  return (
    <div className="hero-price-note">
      <p className="hero-price-note-price font-brand">
        &#8377;{product.price}
        <span>{product.weight}</span>
      </p>
      <p className="hero-price-note-rating">
        <Stars value={product.rating.value} color={INK} size={15} />
        <span className="sr-only">
          Rated {product.rating.value} out of 5 from {product.rating.count} reviews
        </span>
        <span aria-hidden="true">
          {product.rating.value} <span>({product.rating.count})</span>
        </span>
      </p>
    </div>
  )
}

/**
 * The monitor on the left of the desk, carrying the copy. It stands on the
 * desktop a little behind the packs -- not on the back edge, where it looked
 * about to fall off -- and is as big as the wall above allows. It is Why Flipo's
 * own monitor, laid out at that section's size and shrunk to fit the wall
 * here, so the camera move can hand one to the other and both screens show
 * the same bouncing pack.
 *
 * At rest the screen shows the copy and the screensaver is off. As the move
 * starts (`fore` falling) the copy and the price note fade and the
 * screensaver comes up, so by the time the camera arrives the screen is
 * already Why Flipo's. Where it is shrunk a long way -- short laptop
 * screens -- its outlines are thickened to the hero's ink weight, easing back
 * as the camera closes in.
 */
function HeroMonitor({ screen, note, fore, staged }) {
  const zoom = useContext(HeroZoomContext)
  const flat = useMotionValue(1)
  const camera = zoom.camera ?? flat
  const boxRef = useRef(null)
  const monitorRef = useRef(null)
  const scale = useRef(1)
  // One after the other, never both: the copy clears in the first half of
  // the fade, the screensaver comes up in the second.
  const copyOpacity = useTransform(fore, (v) => Math.min(1, Math.max(0, (v - 0.5) * 2)))
  const saverOpacity = useTransform(fore, (v) => (staged ? Math.min(1, Math.max(0, (0.5 - v) * 2)) : 0))

  const thicken = () => {
    const el = monitorRef.current
    if (!el) return
    const net = scale.current * camera.get()
    el.style.setProperty('--wf-stroke', String(Math.max(1, 4.2 / (6 * net))))
  }

  useLayoutEffect(() => {
    const box = boxRef.current
    const el = monitorRef.current
    if (!box || !el) return undefined
    const fit = () => {
      if (!box.clientWidth) return
      scale.current = box.clientWidth / MONITOR_W
      el.style.transform = `scale(${scale.current})`
      box.style.height = `${el.offsetHeight * scale.current}px`
      thicken()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useMotionValueEvent(camera, 'change', thicken)

  const setRef = (el) => {
    monitorRef.current = el
    if (zoom.monitorRef) zoom.monitorRef.current = el
  }

  return (
    <div
      ref={boxRef}
      className="hero-monitor"
      style={{
        left: '6vw',
        bottom: MONITOR_FOOT,
        width: MONITOR_WIDTH,
      }}
    >
      <Monitor
        ref={setRef}
        decorative
        saverOpacity={saverOpacity}
        screen={
          <motion.div className="hero-screen" style={{ opacity: copyOpacity }}>
            {screen}
          </motion.div>
        }
      >
        <motion.div style={{ opacity: fore }}>{note}</motion.div>
      </Monitor>
    </div>
  )
}
