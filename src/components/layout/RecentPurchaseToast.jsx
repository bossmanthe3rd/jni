import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { recentPurchases } from '../../data/site'

const SHOW_AFTER = 4000
const VISIBLE_FOR = 6500
const GAP = 9000

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
  const atCheckout = useLocation().pathname.startsWith('/checkout')

  const purchase = recentPurchases[index]
  const minutesAgo = 3 + (index % 5)

  return (
    <AnimatePresence>
      {visible && !dismissed && !atCheckout && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          /* Lifted clear of the mobile add-to-cart bar, which is fixed to the
              same corner of the same viewport on the two detail pages. Below md
              the toast sits above it; from md up the bar is hidden and the toast
              returns to the corner. */
          className="fixed bottom-[6.75rem] left-3 z-40 flex max-w-[15rem] items-start gap-2 rounded-2xl border-[2px] border-teal bg-cream px-3 py-2.5 shadow-lg md:bottom-4 md:left-4"
          role="status"
        >
          <ShoppingBag size={14} className="mt-0.5 shrink-0 text-teal" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold leading-snug text-ink">
              {purchase.name} from {purchase.city} just bought {purchase.product}
            </p>
            <p className="mt-1 text-[10px] text-ink/50">{minutesAgo} mins ago</p>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setDismissed(true)}
            className="shrink-0 text-ink/40 transition hover:text-ink"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
