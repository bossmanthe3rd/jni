import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { recentPurchases } from '../../data/site'

const SHOW_AFTER = 4000
const VISIBLE_FOR = 6500
const GAP = 9000

const DETAIL_PAGE = /^\/(flavours|snacks|combos)\/[^/]+/

/*
 * True while the homepage's opening screen or the vending machine is in view,
 * on phones only. Those are the two places the toast would sit on something
 * the reader is about to tap: the hero's packs and CTA, and the machine's
 * keypad and receipt.
 *
 * Also true for the whole of a flavour or box page on phones: the buy bar owns
 * the bottom of the screen there, and the toast stacked on top of it took a
 * quarter of a 740px screen.
 */
function useQuietZone(pathname) {
  const [quiet, setQuiet] = useState(false)

  useEffect(() => {
    setQuiet(false)
    const phone = window.matchMedia('(max-width: 1023px)')
    if (DETAIL_PAGE.test(pathname)) {
      const syncDetail = () => setQuiet(phone.matches)
      syncDetail()
      phone.addEventListener('change', syncDetail)
      return () => phone.removeEventListener('change', syncDetail)
    }
    if (pathname !== '/') return
    const state = { top: true, machine: false }
    const sync = () => setQuiet(phone.matches && (state.top || state.machine))

    // Cached and refreshed on resize: read on every scroll event, the
    // viewport height could force a layout each time.
    let vh = window.innerHeight
    const onResize = () => {
      vh = window.innerHeight
      onScroll()
    }
    const onScroll = () => {
      const top = window.scrollY < vh * 0.8
      if (top === state.top) return
      state.top = top
      sync()
    }
    // The machine renders with the page, but look it up after paint in case
    // the route chunk is still settling.
    let io
    const raf = window.requestAnimationFrame(() => {
      const machine = document.getElementById('products')
      if (!machine) return
      io = new IntersectionObserver(([entry]) => {
        state.machine = entry.isIntersecting
        sync()
      })
      io.observe(machine)
    })
    onScroll()
    sync()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    phone.addEventListener('change', sync)
    return () => {
      window.cancelAnimationFrame(raf)
      io?.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      phone.removeEventListener('change', sync)
    }
  }, [pathname])

  return quiet
}

/** Bottom-left social-proof toast that cycles through recent "orders". */
export default function RecentPurchaseToast() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (dismissed) return
    let hideTimer
    const show = () => {
      setVisible(true)
      hideTimer = window.setTimeout(() => {
        setVisible(false)
        setIndex((i) => (i + 1) % recentPurchases.length)
      }, VISIBLE_FOR)
    }
    const first = window.setTimeout(show, SHOW_AFTER)
    const loop = window.setInterval(show, GAP + VISIBLE_FOR)
    return () => {
      window.clearTimeout(first)
      window.clearTimeout(hideTimer)
      window.clearInterval(loop)
    }
  }, [dismissed])

  // Not at checkout: someone deciding whether to pay needs the bill, not a
  // popup over it -- on a phone it landed right on the delivery nudge.
  const { pathname } = useLocation()
  const atCheckout = pathname.startsWith('/checkout')
  const quiet = useQuietZone(pathname)

  const purchase = recentPurchases[index]
  const minutesAgo = 3 + (index % 5)

  return (
    <AnimatePresence>
      {visible && !dismissed && !atCheckout && !quiet && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-[calc(0.75rem+env(safe-area-inset-left))] z-40 flex max-w-[16rem] items-start gap-2 rounded-2xl border-[2px] border-teal bg-cream py-2.5 pl-3 pr-1 shadow-lg md:left-4 lg:bottom-4"
          role="status"
        >
          <ShoppingBag size={14} className="mt-0.5 shrink-0 text-teal" />
          <div className="min-w-0">
            <p className="text-xs font-bold leading-snug text-ink">
              {purchase.name} from {purchase.city} just bought {purchase.product}
            </p>
            <p className="mt-1 text-xs text-ink/60">{minutesAgo} mins ago</p>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setDismissed(true)}
            // The glyph stays small; the button around it is a full 44px target.
            className="-my-2 grid h-11 w-11 shrink-0 place-items-center text-ink/50 transition hover:text-ink"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
