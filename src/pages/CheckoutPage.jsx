import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../store/cartStore'
import { FREE_SHIPPING_THRESHOLD } from '../data/products'

/**
 * Checkout.
 *
 * The live site hands off to the Shiprocket / GoKwik "fastrr" checkout widget
 * and Razorpay for payment. Neither is reproducible locally, so the clone shows
 * an order summary and stops at the payment hand-off. The empty state below is
 * a faithful copy of the live one.
 */
export default function CheckoutPage() {
  const { items } = useCart()
  const total = items.reduce((n, i) => n + Number(i.price) * i.qty, 0)
  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : 49

  useEffect(() => {
    document.title = 'Checkout | Just Nibble It'
  }, [])

  if (items.length === 0) {
    return (
      <div className="min-w-0 flex-grow">
        <div className="box-border grid min-h-[100dvh] w-full place-items-center bg-cream px-4 pb-10 pt-[calc(var(--site-header-offset)+1rem)]">
          <div className="w-full max-w-md text-center">
            <h1 className="font-display text-3xl text-ink md:text-4xl">Your crate is empty.</h1>
            <p className="mt-3 text-sm leading-6 text-ink/50">
              Add a few loud packs before heading into checkout.
            </p>
            <Link to="/flavours" className="jni-btn mt-5">
              <ShoppingBag size={16} /> Shop flavours
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0 flex-grow">
      <div className="bg-cream px-5 pb-16 pt-[calc(var(--site-header-offset)+1.5rem)] sm:px-8 lg:px-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-3xl text-ink md:text-4xl">Checkout</h1>

          <div className="jni-card mt-6 divide-y divide-ink/10 p-5 shadow-doodle sm:p-6">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F7F1C8]">
                  <img
                    src={item.imageUrl || item.images?.plp}
                    alt={item.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-ink">
                    {item.shortName || item.name}
                  </p>
                  <p className="text-[11px] text-ink/55">
                    {item.selectedWeight || item.weight} · Qty {item.qty}
                  </p>
                </div>
                <span className="font-display text-lg text-ink">
                  ₹{Number(item.price) * item.qty}
                </span>
              </div>
            ))}
          </div>

          <div className="jni-card mt-4 space-y-2 p-5 text-sm font-bold shadow-doodle sm:p-6">
            <div className="flex justify-between">
              <span className="text-ink/60">Subtotal</span>
              <span>₹{total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Shipping</span>
              <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
            </div>
            <div className="flex justify-between border-t-2 border-ink/10 pt-2">
              <span className="font-black uppercase tracking-wide">Total</span>
              <span className="font-display text-2xl">₹{total + shipping}</span>
            </div>
          </div>

          <p className="mt-6 rounded-2xl border-[3px] border-ink/15 bg-ink/5 p-4 text-xs font-bold leading-6 text-ink/70">
            The live site hands off from here to the Shiprocket / GoKwik checkout widget and
            Razorpay. Those are third-party integrations tied to the real merchant account, so this
            clone stops at the summary. See <code>reference/CLONE-NOTES.md</code>.
          </p>
        </div>
      </div>
    </div>
  )
}
