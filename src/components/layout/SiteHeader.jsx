import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingCart, User, X } from 'lucide-react'
import { useCart } from '../../store/cartStore'
import { HERO_INTERVAL, ticker, navLinks } from '../../data/site'
import { BADGE_FILLS, getBadgeFlavour, setBadgeFlavour, useBadgeFlavour } from '../../lib/badgeFlavour'
import { StarDoodle } from '../icons/WhyIcons'
import { useScrollLock } from '../../lib/scrollLock'
import { BadgeFace } from './BadgeFace'
import { NibbleBlob } from '../ui/NibbleBlob'
import { BLOB_PATHS } from '../ui/BlobShapes'

/*
 * How many times the message is repeated inside one run of the ticker.
 *
 * The track has to be at least a screen wide or the tail of the loop shows
 * bare bar behind it. Six copies clears any desktop width; on a phone it is
 * more than needed and costs nothing but a few spans.
 */
const TICKER_RUN = 6

/** The wavy three-line hamburger mark. */
function WavyMenuIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 32 24" fill="none" aria-hidden="true">
      {[5, 12, 19].map((y) => (
        <path
          key={y}
          d={`M2 ${y}c6-4 10 4 16 0s8 4 12 0`}
          stroke="#4DB8AE"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

/**
 * Cream, so it is invisible on the cream the site mostly runs on and only
 * shows up where it has work to do -- /combos and the other dark heroes, whose
 * background is near enough the plates' own to swallow them whole.
 */
const PLATE_KEYLINE = 'var(--color-bg-cream, #fbf6d0)'

/**
 * A pack puddle used as a plate behind a cluster of controls.
 *
 * Drawn rather than clipped: clip-path cannot carry the keyline, and without
 * one the plates vanish into the pages whose hero is as dark as they are.
 * BLOB_PATHS are already in 0..1 units, so a 0 0 1 1 viewBox stretches one to
 * whatever the controls inside end up measuring.
 *
 * `className` has to position it -- the plate is absolute against this span,
 * so it needs to be the containing block. It deliberately does NOT set
 * `relative` itself: Tailwind emits `relative` after `absolute`, so doing that
 * silently beat every caller's `absolute` and dropped both clusters into flow.
 */
function Pebble({ shape, className = '', style, children }) {
  return (
    <span className={`inline-flex items-center ${className}`} style={style}>
      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{ overflow: 'visible' }}
        aria-hidden="true"
      >
        <path
          d={BLOB_PATHS[shape]}
          fill="var(--color-bg-dark, #071a16)"
          stroke={PLATE_KEYLINE}
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="relative flex items-center">{children}</span>
    </span>
  )
}

/**
 * Pages the badge never hangs over. Each is a form or a transaction, and the
 * page's job is the one thing in the middle of the screen.
 */
const BADGE_NEVER = ['/checkout', '/auth', '/account', '/my-crates']

/**
 * Product and combo pages. The badge does not hang on these at all: the hero
 * there is a spread that has to fit one screen -- pouch, flavour switcher and
 * buy block -- and the badge sat in the middle of it taking the top 150px.
 * With it gone the pages lift their content up into the header band.
 */
const PRODUCT_PAGE = /^\/(flavours|snacks|combos)\/[^/]+\/?$/

/** Whether the badge is left off this page entirely. */
const badgeless = (pathname) => BADGE_NEVER.includes(pathname) || PRODUCT_PAGE.test(pathname)

// Scroll distances under this are jitter -- a trackpad settling, a momentum
// tail -- not the reader changing direction.
const SCROLL_SLOP = 4

/**
 * Whether the badge should be down.
 *
 * It opens every page, which is where it does its job. Once the page's first
 * section has scrolled out from under the header the badge only ever covers
 * content, so it retracts; any scroll back up brings it out again, as does
 * returning to the top. The two side clusters are not part of this -- they
 * stay put everywhere.
 */
function useBadgeDown(pathname) {
  const never = badgeless(pathname)
  const [down, setDown] = useState(true)

  useEffect(() => {
    setDown(true)
    if (never) return undefined

    let lastY = window.scrollY
    let lastDy = 0
    let frame = 0
    // The viewport height, for pages with no first section; kept current on
    // resize rather than read on every scroll.
    let vh = window.innerHeight

    // Whether the page's opening has scrolled out from under the header,
    // kept by an IntersectionObserver whose top edge is the header's bottom.
    // It used to be two getBoundingClientRect() reads on every scroll frame,
    // each forcing a layout straight after the frame's own style writes. The
    // observer still follows the section as it grows with its images.
    let past = null
    let io = null
    let watched = null
    const watch = () => {
      // A page can say where its opening ends when that is not simply its
      // first section -- the homepage's hero is pinned while the camera
      // walks into Why Flipo's, so it never scrolls out from under anything.
      const first = document.querySelector('[data-intro-end]') ?? document.querySelector('main section')
      if (first === watched && io) return
      io?.disconnect()
      io = null
      watched = first
      past = null
      if (!first) return
      const header = document.querySelector('[data-intro-bar]')?.getBoundingClientRect().bottom ?? 0
      io = new IntersectionObserver(
        ([e]) => {
          past = e.boundingClientRect.bottom <= e.rootBounds.top
          if (!past) setDown(true)
          else if (window.scrollY > 0) setDown(lastDy < 0)
        },
        { rootMargin: `${-Math.round(header)}px 0px 0px 0px` }
      )
      io.observe(first)
    }
    watch()

    const update = () => {
      frame = 0
      // The opening may arrive after this effect, with its route's chunk, or
      // be swapped out for another.
      if (!watched || !watched.isConnected) watch()
      const y = window.scrollY
      const dy = y - lastY
      if (Math.abs(dy) < SCROLL_SLOP && y > 0) return
      lastY = y
      lastDy = dy

      if (y <= 0) return setDown(true)

      const isPast = past ?? (watched ? false : y > vh * 0.8)
      if (!isPast) setDown(true)
      else setDown(dy < 0)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    // The header's height moves with the breakpoints, and the observer's edge
    // with it.
    const onResize = () => {
      vh = window.innerHeight
      watched = null
      watch()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      io?.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [pathname, never])

  return !never && down
}

const BADGE_ORDER = Object.keys(BADGE_FILLS)

/**
 * The badge, in the flavour of the moment.
 *
 * On the homepage the hero sets the flavour; elsewhere this turns it on the
 * hero's clock -- held in a backgrounded tab and under reduced motion, like
 * every other loop on the site. It subscribes on its own, so a colour change
 * re-renders this and not the whole header; `children` arrive already built,
 * so the face inside is not re-rendered either.
 *
 * One blob per colour, stacked, cross-faded by opacity: that runs on the
 * compositor, where easing the SVG's fill would repaint it for the length of
 * the fade. The top blob is unfilled and carries the keyline and the face.
 */
function BadgeBlob({ follow, className, style, children }) {
  const flavour = useBadgeFlavour()

  useEffect(() => {
    if (!follow) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    let id = 0
    const sync = () => {
      window.clearInterval(id)
      if (document.visibilityState !== 'visible') return
      id = window.setInterval(() => {
        const at = BADGE_ORDER.indexOf(getBadgeFlavour())
        setBadgeFlavour(BADGE_ORDER[(at + 1) % BADGE_ORDER.length])
      }, HERO_INTERVAL)
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [follow])

  return (
    <span className={`relative block ${className}`} style={style}>
      {BADGE_ORDER.map((slug) => (
        <span
          key={slug}
          aria-hidden="true"
          className="absolute inset-0 transition-opacity duration-[600ms] motion-reduce:transition-none"
          // Layers up front: promoted only for the fade, each was re-rastered
          // as it started -- a paint per frame of it, measured.
          style={{ opacity: slug === flavour ? 1 : 0, willChange: 'opacity' }}
        >
          <NibbleBlob fill={BADGE_FILLS[slug]} />
        </span>
      ))}
      <NibbleBlob fill="none" stroke={PLATE_KEYLINE}>
        {children}
      </NibbleBlob>
    </span>
  )
}

export default function SiteHeader() {
  const [navOpen, setNavOpen] = useState(false)
  const [badgeFocused, setBadgeFocused] = useState(false)
  const navigate = useNavigate()
  const { pathname, hash } = useLocation()
  const { toggleCart, getTotalQty } = useCart()
  const qty = getTotalQty()
  const badgeDown = useBadgeDown(pathname)
  // A keyboard reader tabbing onto the home link gets it back on screen, so
  // focus never lands on something hidden behind the ticker.
  const badgeShown = badgeDown || (badgeFocused && !badgeless(pathname))

  // The live site measures the header and publishes its height as
  // --site-header-offset, which every page uses for its top padding.
  //
  // The badge hangs past that height on purpose and is positioned absolutely,
  // so it contributes nothing here -- the offset stays the height of the row
  // the controls sit in, and the lobes overlap the page's first section the
  // way a sticker would.
  useEffect(() => {
    const el = document.querySelector('[data-site-header]')
    if (!el) return
    const sync = () => {
      const h = Math.ceil(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--site-header-offset', `${h}px`)
      // The ticker is the one part of the header that paints solid, so it is
      // the one part that can slice a doodle in half. Sections that run their
      // artwork up behind the header need its height to know where to stop.
      const bar = el.querySelector('[data-site-ticker]')
      const t = bar ? Math.ceil(bar.getBoundingClientRect().height) : 0
      document.documentElement.style.setProperty('--site-ticker-height', `${t}px`)
    }
    sync()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null
    ro?.observe(el)
    window.addEventListener('resize', sync)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', sync)
    }
  }, [navOpen])

  // Escape closes the drawer. Without it the only way out was the same button
  // that opened it, which a keyboard reader has to tab all the way back to.
  useEffect(() => {
    if (!navOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  // Navigating within the drawer already closes it, but a browser Back or a
  // link elsewhere on the page left it hanging open over the new route.
  useEffect(() => setNavOpen(false), [pathname, hash])

  // The page holds still under the open menu, the same as under the cart.
  useScrollLock(navOpen)

  /* A link to where the reader already is changes nothing in the URL, so the
     route's scroll handling never runs and the tap did nothing -- "Shop
     flavours" from halfway down the homepage left you there. Do the scroll
     here instead, once the menu has closed and released the page. */
  const followNavLink = (link) => {
    setNavOpen(false)
    const here = pathname === link.to && (link.hash ? hash === `#${link.hash}` : !hash)
    if (!here) return
    window.requestAnimationFrame(() => {
      const target = link.hash && document.getElementById(link.hash)
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  return (
    // The header no longer paints a strip, so most of this band is now just
    // page showing through. pointer-events-none hands those gaps back to the
    // content underneath; every actual control opts back in.
    <header data-site-header="true" className="on-dark pointer-events-none fixed inset-x-0 top-0 z-50">
      {ticker.active !== false && (
        <Link
          data-site-ticker=""
          to={ticker.link || '/combos'}
          aria-label={ticker.text}
          // Above the row, so the badge retracts up behind it -- into the seal,
          // the way it drops out of one on the pack.
          className="pointer-events-auto relative z-10 block h-7 overflow-hidden text-xs font-black uppercase sm:text-xs"
          style={{ backgroundColor: ticker.backgroundColor, color: ticker.textColor }}
        >
          {/* Two identical runs, translated by exactly half the track. At -50%
              the second run is sitting where the first began, so the loop
              restarts on a frame identical to the one it left and there is no
              seam to see. One run alone would have to jump back. */}
          <div className="jni-ticker flex h-full w-max items-center">
            {[0, 1].map((run) => (
              <div key={run} className="flex h-full shrink-0 items-center" aria-hidden={run === 1}>
                {Array.from({ length: TICKER_RUN }, (_, i) => (
                  <span key={i} className="flex items-center gap-3 whitespace-nowrap px-3">
                    {ticker.text}
                    <StarDoodle className="h-2.5 w-2.5 shrink-0" fill={ticker.textColor} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </Link>
      )}

      {/* Three islands, not a bar. The row only sets the height the controls
          centre on and the line the badge hangs from; it paints nothing. */}
      {/* Inset from the notch in landscape: the controls are positioned against
          this row, so narrowing it keeps them clear of the cut-out. */}
      <div
        data-intro-bar=""
        className="relative h-[4.5rem] [margin-inline:env(safe-area-inset-left)_env(safe-area-inset-right)] sm:h-[5rem] lg:h-[5.5rem]"
      >
        <Pebble
          shape="stamp1"
          className="pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2 sm:left-6 lg:left-10"
        >
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center sm:h-12 sm:w-12"
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
            aria-controls="site-nav-drawer"
          >
            {navOpen ? <X size={22} className="text-teal" /> : <WavyMenuIcon className="h-6 w-8" />}
          </button>
        </Pebble>

        {/* The pack's badge, hung off the top edge exactly as the pouch hangs
            it off its seal -- flat where the seal cuts it, lobes swinging below
            the row. This is the piece that breaks the old strip. */}
        {!badgeless(pathname) && (
          <Link
            aria-label="Just Nibble It home"
            to="/"
            onFocus={() => setBadgeFocused(true)}
            onBlur={() => setBadgeFocused(false)}
            className={`absolute left-1/2 top-0 -translate-x-1/2 ${badgeShown ? 'pointer-events-auto' : ''}`}
          >
            {/* Fluid rather than stepped: the badge and the two clusters share
                one line, and a stepped width collides with the cart on the
                phones that sit just under a breakpoint. The ceiling keeps the
                lobes clear of the page titles that sit under the header.

                The slide is on this inner box, not the link, because the link
                already spends its transform on centring. */}
            <BadgeBlob
              follow={pathname !== '/'}
              className="jni-header-badge transition-transform duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{
                transform: badgeShown ? 'none' : 'translateY(calc(-100% - 4px))',
              }}
            >
              <BadgeFace fill="var(--color-text-light, #fbf6d0)" />
            </BadgeBlob>
          </Link>
        )}

        <Pebble
          shape="wide1"
          className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 gap-0.5 px-2 py-1 sm:right-6 sm:px-2.5 lg:right-10"
        >
          <button
            type="button"
            aria-label="Log in"
            title="Log in / Sign up"
            onClick={() => navigate('/account')}
            className="relative grid h-11 w-11 place-items-center text-teal transition hover:text-sunshine"
          >
            <User size={22} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="Open cart"
            title="Your cart"
            data-cart-icon="true"
            onClick={toggleCart}
            className="relative grid h-11 w-11 place-items-center text-teal transition hover:text-sunshine"
          >
            <ShoppingCart size={22} strokeWidth={1.8} />
            {qty > 0 && (
              <span className="absolute right-0.5 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-sunshine px-1 text-[11px] leading-none font-black text-ink">
                {qty}
              </span>
            )}
          </button>
        </Pebble>
      </div>

      <AnimatePresence>
        {navOpen && (
          /* Dims the page and closes the menu on a tap outside it. Behind the
             header's own controls (the header is its own stacking context),
             so the menu button still reads as the way to close it. */
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setNavOpen(false)}
            className="pointer-events-auto fixed inset-0 -z-10 bg-ink/50"
            aria-hidden="true"
          />
        )}
        {navOpen && (
          <motion.nav
            key="nav"
            id="site-nav-drawer"
            aria-label="Main"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            // A drawer spanning the full width would put the strip straight
            // back. It hangs off the menu button instead, as its own island.
            className="pointer-events-auto absolute left-2 top-full w-[min(20rem,calc(100vw-1rem))] bg-[#071A16] px-6 py-4 sm:left-6 lg:left-10"
            style={{ borderRadius: 'var(--radius-organic)' }}
          >
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.hash ? `${link.to}#${link.hash}` : link.to}
                    onClick={() => followNavLink(link)}
                    className="block py-2 font-brand text-2xl text-cream transition hover:text-sunshine"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
