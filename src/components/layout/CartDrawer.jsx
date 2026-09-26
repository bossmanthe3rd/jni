import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useCart } from '../../store/cartStore'
import { SHIPPING_FLAT, toCartProduct } from '../../data/products'
import { BrandHeading } from '../ui/Primitives'
import { MarkerRing } from '../ui/ReceiptMarks'
import { Tick } from '../checkout/CheckoutReceipt'
import CrateLine from '../checkout/CrateLine'
import DeliveryNudge from '../checkout/DeliveryNudge'
import EmptySlot from '../checkout/EmptySlot'
import { cartTotals, itemCount } from '../checkout/cartTotals'
import '../../styles/checkout.css'

/**
 * The cart drawer, dressed as the checkout desk turned sideways: the heading
 * on a strip of wall, the crate lying on the desktop, and the torn-off end of
 * the bill along the bottom with the totals on it.
 *
 * The button quotes the delivered total, the same figure the checkout bill
 * and its Pay button show, so the price never changes between the two.
 */
export default function CartDrawer() {
  const { items, isOpen, closeCart, setQty, removeItem, addItem } = useCart()
  const { subtotal, shipping, total, packs } = cartTotals(items)

  // A drawer over a dimmed page is a modal, so it gets the two things a modal
  // owes the reader: Escape closes it, and the page behind it stops scrolling
  // instead of sliding around under the overlay.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeCart()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, closeCart])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
            role="dialog"
            aria-modal="true"
            aria-label="Your crate"
            className="ck-drawer fixed right-0 top-0 z-[61] flex h-full w-full max-w-md flex-col border-l-[3px] border-ink bg-cream"
          >
            {/* The wall strip. */}
            <div className="flex items-center justify-between gap-4 px-5 pb-5 pt-5">
              <div>
                <BrandHeading as="h2" className="text-4xl">
                  Your crate
                </BrandHeading>
                {items.length > 0 && (
                  <p className="mt-1.5 text-xs font-bold text-ink/60">{itemCount(packs)}</p>
                )}
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-cream text-ink transition hover:bg-ink hover:text-cream"
              >
                <X size={18} />
              </button>
            </div>

            {/* The desktop. */}
            <div className="ck-drawer-desk jni-grain relative flex min-h-0 flex-1 flex-col">
              <svg className="ck-drawer-edge" viewBox="0 0 440 22" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 12 C 80 6 160 15 240 10 C 320 5 380 14 440 9 L440 22 L0 22 Z" fill="#f3c63b" />
                <path
                  d="M0 12 C 80 6 160 15 240 10 C 320 5 380 14 440 9"
                  fill="none"
                  stroke="#0d2818"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {items.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-6">
                  <div className="jni-card flex w-full flex-col items-center gap-3 px-6 py-8 text-center shadow-doodle">
                    <EmptySlot small />
                    <p className="mt-3 font-brand text-2xl text-ink">Nothing in here yet.</p>
                    <p className="text-sm font-bold text-ink/70">
                      Pick a flavour, or grab the trio and settle the argument.
                    </p>
                    <Link to="/#products" onClick={closeCart} className="jni-btn mt-2">
                      Shop flavours
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-6">
                    <ul className="space-y-3">
                      <AnimatePresence initial={false}>
                        {items.map((item) => (
                          <CrateLine
                            key={item.id}
                            item={item}
                            compact
                            onQty={(q) => setQty(item.id, q)}
                            onRemove={() => removeItem(item.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </ul>
                    <div className="mt-4">
                      <DeliveryNudge
                        compact
                        items={items}
                        subtotal={subtotal}
                        onAdd={(p) => addItem(toCartProduct(p), 1)}
                      />
                    </div>
                  </div>

                  {/* The end of the till roll. */}
                  <div className="ck-stub-wrap">
                    <div className="ck-stub">
                      <div className="ck-row">
                        <span>Subtotal</span>
                        <Tick value={subtotal} />
                      </div>
                      <div className="ck-row">
                        <span>Delivery</span>
                        {shipping === 0 ? (
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
                      <Link to="/checkout" onClick={closeCart} className="jni-btn mt-4 w-full text-base">
                        Checkout · <Tick value={total} />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
