import { motion } from 'framer-motion'
import { FREE_SHIPPING_THRESHOLD } from '../../data/products'
import PincodeCheck from './PincodeCheck'

/**
 * The crate's delivery card: how far from free delivery, and where it is
 * going.
 *
 * It used to suggest one pack to close the gap. The shelf above it
 * (ShelfRail) now offers everything not in the crate and puts whatever closes
 * the gap first, with a sticker saying so -- two places suggesting the same
 * pack read as a sales push. Both halves of this card are about delivery, so
 * the PIN check lives here rather than in a box of its own.
 */
export default function DeliveryNudge({ subtotal, compact = false }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))

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

      <div className={`border-t-2 border-dashed border-ink/20 ${compact ? 'mt-3.5 pt-3.5' : 'mt-4 pt-4'}`}>
        <PincodeCheck size={compact ? 'compact' : 'full'} />
      </div>
    </div>
  )
}
