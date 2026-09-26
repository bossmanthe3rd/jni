import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { FREE_SHIPPING_THRESHOLD, products } from '../../data/products'

/**
 * How far from free delivery, and the one pack that closes the gap.
 *
 * The suggestion is the cheapest flavour not already in the crate: a nudge
 * towards trying something new reads as a tip, where "add another of the
 * same" reads as a sales push.
 */
export default function DeliveryNudge({ items, subtotal, onAdd, compact = false }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))
  const suggestion =
    remaining > 0
      ? products
          .filter((p) => p.stockQuantity !== 0 && !items.some((i) => i.slug === p.slug))
          .sort((a, b) => a.price - b.price)[0]
      : null
  const clears = suggestion && suggestion.price >= remaining

  return (
    <div className={`jni-card shadow-doodle ${compact ? 'p-3.5' : 'p-4 sm:p-5'}`}>
      {remaining > 0 ? (
        <p className="text-sm font-bold text-ink/75">
          <span className="font-black text-ink">₹{remaining}</span> more and delivery is free
        </p>
      ) : (
        <p className="text-sm font-black uppercase tracking-wider text-[#1f7a33]">
          Free delivery unlocked
        </p>
      )}
      <div
        className="mt-2 h-3 w-full overflow-hidden rounded-pill border-[2px] border-ink bg-[#F7F1C8]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Progress toward free delivery"
      >
        <motion.div
          className="h-full rounded-pill"
          style={{ background: remaining > 0 ? 'var(--color-accent-yellow)' : '#77d21c' }}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 26 }}
        />
      </div>

      {suggestion && (
        <div className="mt-3.5 flex items-center gap-3 border-t-2 border-dashed border-ink/20 pt-3.5">
          <img
            src={suggestion.images?.thumb || suggestion.images?.plp}
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl border-[2px] border-ink object-cover"
          />
          <p className="min-w-0 flex-1 text-sm leading-snug text-ink">
            <span className="font-black">Add {suggestion.shortName}</span> · ₹{suggestion.price}
            <span className="block text-xs font-bold text-ink/55">
              {clears ? 'and delivery is free' : `₹${suggestion.price} closer to free delivery`}
            </span>
          </p>
          <button
            type="button"
            onClick={() => onAdd(suggestion)}
            className="inline-flex h-10 shrink-0 items-center gap-1 rounded-pill border-[2.5px] border-ink bg-sunshine px-4 text-sm font-black text-ink transition hover:bg-ink hover:text-cream"
          >
            <Plus size={15} /> Add
          </button>
        </div>
      )}
    </div>
  )
}
