import { motion, useReducedMotion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { QtyStepper } from '../ui/Primitives'
import { Tick, lineInk } from './CheckoutReceipt'

/**
 * One line of the crate: the pack, how many, what it costs. Shared by the
 * cart drawer (`compact`) and the checkout page, so an item looks the same in
 * both and editing it works the same way.
 */
export default function CrateLine({ item, onQty, onRemove, compact = false }) {
  const reduce = useReducedMotion()
  const name = item.shortName || item.name
  return (
    <motion.li
      layout={!reduce}
      initial={false}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: -24, transition: { duration: 0.2 } }}
      className={`jni-card flex items-center shadow-doodle ${
        compact ? 'gap-3 p-2.5 pr-3' : 'gap-4 p-3 pr-4 sm:p-4 sm:pr-5'
      }`}
    >
      <div
        className={`grid shrink-0 place-items-center overflow-hidden rounded-2xl border-[2px] border-ink ${
          compact ? 'h-16 w-16' : 'h-20 w-20 sm:h-24 sm:w-24'
        }`}
        style={{ background: item.theme?.soft || '#F7F1C8' }}
      >
        <img src={item.imageUrl || item.images?.plp} alt="" className="h-full w-full object-contain" />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`flex items-center gap-2 font-black leading-tight text-ink ${
            compact ? 'text-sm' : 'text-base sm:text-lg'
          }`}
        >
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full border-[2px] border-ink"
            style={{ background: lineInk(item) }}
          />
          <span className="truncate">{name}</span>
        </p>
        <p className={`mt-0.5 truncate font-bold text-ink/55 ${compact ? 'text-[11px]' : 'text-xs'}`}>
          {item.selectedWeight || item.weight}
          {item.flavor ? ` · ${item.flavor}` : ''}
        </p>
        <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${compact ? 'mt-2' : 'mt-3'}`}>
          <QtyStepper qty={item.qty} onChange={onQty} size={compact ? 'sm' : 'md'} />
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 text-xs font-bold text-ink/55 transition hover:text-[#d4361c]"
          >
            <Trash2 size={14} /> Remove
            <span className="sr-only"> {name}</span>
          </button>
        </div>
      </div>

      <span className={`self-start font-display text-ink ${compact ? 'text-lg' : 'text-xl sm:text-2xl'}`}>
        <Tick value={Number(item.price) * item.qty} />
      </span>
    </motion.li>
  )
}
