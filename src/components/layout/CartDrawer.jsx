import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Trash2, X } from 'lucide-react'
import { useCart } from '../../store/cartStore'
import { FREE_SHIPPING_THRESHOLD } from '../../data/products'
import { QtyStepper } from '../ui/Primitives'

export default function CartDrawer() {
  const { items, isOpen, closeCart, setQty, removeItem } = useCart()
  const total = items.reduce((n, i) => n + Number(i.price) * i.qty, 0)
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total)

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
            aria-label="Your cart"
            className="fixed right-0 top-0 z-[61] flex h-full w-full max-w-md flex-col border-l-[3px] border-ink bg-cream"
          >
            <div className="flex items-center justify-between border-b-[3px] border-ink px-5 py-4">
              <h2 className="font-brand text-2xl text-ink">Your cart</h2>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="grid h-9 w-9 place-items-center rounded-full border-[2px] border-ink text-ink transition hover:bg-ink hover:text-cream"
              >
                <X size={18} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <p className="font-brand text-xl text-ink">Nothing in here yet.</p>
                <p className="text-sm text-ink/70">
                  Pick a flavour, or grab the trio and settle the argument.
                </p>
                <Link to="/#products" onClick={closeCart} className="jni-btn">
                  Shop flavours
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="flex gap-3 rounded-2xl border-[3px] border-ink bg-[#F7F1C8] p-3"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream">
                        <img
                          src={item.imageUrl || item.images?.plp}
                          alt={item.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-black text-ink">
                          {item.shortName || item.name}
                        </h3>
                        <p className="text-[11px] text-ink/60">{item.selectedWeight || item.weight}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <QtyStepper
                            size="sm"
                            qty={item.qty}
                            onChange={(next) => setQty(item.id, next)}
                          />
                          <span className="font-brand text-lg text-ink">
                            ₹{Number(item.price) * item.qty}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item.id)}
                        className="self-start text-ink/40 transition hover:text-[#ef3f23]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  ))}
                </div>

                <div className="border-t-[3px] border-ink px-5 py-4">
                  {remaining > 0 ? (
                    <p className="mb-3 text-center text-[11px] font-bold text-ink/70">
                      Add ₹{remaining} more for free delivery
                    </p>
                  ) : (
                    <p className="mb-3 text-center text-[11px] font-black uppercase tracking-wider text-[#0f6b3a]">
                      Free delivery unlocked
                    </p>
                  )}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-ink/60">
                      Subtotal
                    </span>
                    <span className="font-brand text-2xl text-ink">₹{total}</span>
                  </div>
                  <Link to="/checkout" onClick={closeCart} className="jni-btn w-full">
                    Checkout
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
