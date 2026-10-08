import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { STAMP_INK, STAMP_INK_BUNDLE, SHIPPING_FLAT } from '../../data/products'
import { Wordmark } from '../icons/Wordmark'
import { Barcode, MarkerRing } from '../ui/ReceiptMarks'
import { usePincode } from '../../lib/pincode'

const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/** A cart line's ink: its flavour's stamp colour, or the combos' teal. */
export const lineInk = (item) => STAMP_INK[item.slug] || STAMP_INK_BUNDLE

/**
 * The bill, fed out of the till once when the page opens.
 *
 * `children` is printed on the paper under the total -- the Pay button lives
 * there, on the bill it pays, the way the vending receipt carries its own
 * button. On the yellow desk a yellow button had nothing to stand out from.
 *
 * Only the figures that change -- a line's price, the totals -- tick over when
 * the crate is edited; the paper itself never reprints, or every tap on a
 * stepper would replay the whole feed.
 */
export default function CheckoutReceipt({ items, subtotal, savings, shipping, total, children }) {
  const reduce = useReducedMotion()
  const packs = items.reduce((n, i) => n + i.qty, 0)
  const free = shipping === 0
  const pin = usePincode((s) => s.result)

  return (
    <div>
      <div className="ck-till" aria-hidden="true" />
      <div className="ck-paper-well">
        <motion.div
          className="ck-paper-feed"
          initial={reduce ? false : { y: '-100%' }}
          animate={{ y: 0 }}
          transition={{ duration: 1, ease: [0.3, 0, 0.2, 1] }}
        >
          <article className="ck-bill" aria-label="Order summary">
            <header className="ck-bill-head">
              <Wordmark fill="#0d2818" className="ck-bill-logo" aria-hidden="true" />
              <p className="ck-label">
                {DATE.format(new Date())} · {packs} {packs === 1 ? 'item' : 'items'}
              </p>
            </header>

            <ul className="ck-lines">
              {items.map((item) => (
                <li key={item.id}>
                  <span>{item.qty} ×</span>
                  <span className="min-w-0">
                    <i style={{ background: lineInk(item) }} />
                    {item.shortName || item.name}
                    <small>{item.selectedWeight || item.weight}</small>
                  </span>
                  <Tick value={Number(item.price) * item.qty} />
                </li>
              ))}
            </ul>

            <hr className="ck-rule" />

            <div className="ck-row">
              <span>Subtotal</span>
              <Tick value={subtotal} />
            </div>
            {savings > 0 && (
              <div className="ck-row ck-row--save">
                <span>You save on MRP</span>
                <Tick value={savings} prefix="−₹" />
              </div>
            )}
            <div className="ck-row">
              <span>
                Delivery
                {pin && (
                  <small className="ck-row-note">
                    {pin.status === 'next-day' ? 'Next day' : '2–4 days'} to {pin.pin}
                  </small>
                )}
              </span>
              {free ? (
                <span>
                  <s>₹{SHIPPING_FLAT}</s>Free
                </span>
              ) : (
                <span>₹{shipping}</span>
              )}
            </div>

            <div className="ck-total">
              <span className="ck-label">Total</span>
              <span className="ck-total-price">
                <Tick value={total} />
                <MarkerRing className="ck-ring" />
              </span>
            </div>

            {children && <div className="mt-5">{children}</div>}

            <footer className="ck-bill-foot">
              <Barcode code={`${packs}${total}`} className="ck-barcode" />
              <span className="ck-label text-right">Incl. all taxes</span>
            </footer>

            <AnimatePresence>
              {free && (
                <motion.span
                  className="ck-stamp"
                  aria-hidden="true"
                  initial={reduce ? false : { scale: 1.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.85 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                >
                  Free delivery
                </motion.span>
              )}
            </AnimatePresence>
          </article>
        </motion.div>
      </div>
    </div>
  )
}

/** A figure that rolls over when it changes, the way a till's display does. */
export function Tick({ value, prefix = '₹' }) {
  const reduce = useReducedMotion()
  return (
    <span className="relative inline-block overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className="inline-block"
          initial={reduce ? false : { y: '-90%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: '90%', opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {prefix}
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
