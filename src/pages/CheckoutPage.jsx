import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useCart } from '../store/cartStore'
import { BrandHeading } from '../components/ui/Primitives'
import CheckoutReceipt, { Tick } from '../components/checkout/CheckoutReceipt'
import CrateLine from '../components/checkout/CrateLine'
import DeliveryNudge from '../components/checkout/DeliveryNudge'
import ShelfRail from '../components/checkout/ShelfRail'
import EmptySlot from '../components/checkout/EmptySlot'
import { DeskTop, DeskWall } from '../components/checkout/DeskScene'
import { cartTotals, itemCount } from '../components/checkout/cartTotals'
import '../styles/checkout.css'

/**
 * Checkout: the last look before paying.
 *
 * The live site hands off from the Pay button to the Shiprocket / GoKwik
 * "fastrr" widget, which takes the address, and Razorpay, which takes the
 * money. Neither can run without the real merchant account, so this page is
 * everything up to that hand-off: the crate, editable, and the bill it adds up
 * to. See reference/CLONE-NOTES.md.
 *
 * The Pay button quotes the same delivered total as the product page's Buy
 * now, so the price never grows at the last step.
 */
export default function CheckoutPage() {
  const { items, setQty, removeItem } = useCart()
  const payRef = useRef(null)
  const [handoff, setHandoff] = useState(false)
  const { subtotal, savings, shipping, total, packs } = cartTotals(items)

  useEffect(() => {
    document.title = 'Checkout | Just Nibble It'
  }, [])

  if (items.length === 0) return <EmptyCrate />

  const pay = () => setHandoff(true)
  const flavour = items.find((i) => i.slug && !i.includes)?.slug

  return (
    <div className="ck-page min-w-0 flex-grow">
      <DeskWall flavour={flavour}>
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-[calc(var(--site-header-offset)+1.25rem)] sm:px-8 sm:pb-12 lg:px-0">
          <Link
            to="/#products"
            className="-ml-1 inline-flex min-h-[44px] items-center gap-1.5 px-1 text-sm font-bold text-ink/70 underline-offset-4 hover:text-ink hover:underline"
          >
            <ArrowLeft size={16} /> Keep shopping
          </Link>
          <BrandHeading as="h1" className="mt-3 text-5xl md:text-6xl">
            Your crate
          </BrandHeading>
          <p className="mt-3 text-sm font-bold text-ink/65">
            {itemCount(packs)} · check it over, then pay
          </p>
        </div>
      </DeskWall>

      <DeskTop>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-14 lg:px-0 lg:pt-12">
          {/* The crate: what's going in the box, still editable. */}
          <section aria-label="Items in your crate" className="min-w-0">
            <ul className="space-y-4">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <CrateLine
                    key={item.id}
                    item={item}
                    onQty={(q) => setQty(item.id, q)}
                    onRemove={() => removeItem(item.id)}
                  />
                ))}
              </AnimatePresence>
            </ul>
            <div className="mt-8">
              <ShelfRail size="full" />
            </div>
            <div className="mt-8">
              <DeliveryNudge subtotal={subtotal} />
            </div>
          </section>

          {/* The bill, and the one button that leaves the page. The till sits
              on the desk's back edge, so the bill feeds down onto the desk. */}
          <aside
            aria-label="Order summary"
            className="lg:sticky lg:top-[calc(var(--site-header-offset)+1rem)] lg:-mt-6 lg:self-start"
          >
            <CheckoutReceipt
              items={items}
              subtotal={subtotal}
              savings={savings}
              shipping={shipping}
              total={total}
            >
              <div ref={payRef}>
                <button type="button" onClick={pay} className="jni-btn w-full text-lg">
                  Pay <Tick value={total} />
                </button>
              </div>
              <p className="ck-label mt-3 text-center">UPI · Cards · COD · Dispatched in 24h</p>
              <HandoffNote show={handoff} />
            </CheckoutReceipt>
          </aside>
        </div>
      </DeskTop>

      <PayBar watchRef={payRef} packs={packs} total={total} onPay={pay} />
    </div>
  )
}

/** Where GoKwik opens on the live site. The clone says so, plainly. */
function HandoffNote({ show }) {
  return (
    <p role="status" className="mt-2 text-center text-xs font-bold leading-5 text-ink/75 empty:hidden">
      {show &&
        'Secure checkout opens here on the live site: GoKwik takes your address, Razorpay takes payment. Neither is connected in this preview.'}
    </p>
  )
}

/**
 * Phone pay bar: takes over while the real Pay button is off screen, so the
 * two never ask for the same tap at once.
 */
function PayBar({ watchRef, packs, total, onPay }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = watchRef.current
    if (!el) return undefined
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      threshold: 0,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [watchRef])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: '140%' }}
          animate={{ y: 0 }}
          exit={{ y: '140%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="ck-paybar lg:hidden"
        >
          <p className="shrink-0 text-xs font-black uppercase leading-tight tracking-wider opacity-75">
            {itemCount(packs)}
            <span className="block">incl. delivery</span>
          </p>
          <button type="button" onClick={onPay} className="jni-btn">
            Pay <Tick value={total} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Nothing in the crate: the machine's slot, the coil turning on nothing. */
function EmptyCrate() {
  return (
    <div className="ck-page min-w-0 flex-grow">
      <DeskWall quiet="center">
        <div className="relative mx-auto max-w-2xl px-4 pb-14 pt-[calc(var(--site-header-offset)+2rem)] text-center">
          <EmptySlot />
          <BrandHeading as="h1" className="mt-8 text-5xl md:text-6xl">
            Your crate is empty
          </BrandHeading>
          <p className="mx-auto mt-4 max-w-sm text-sm font-bold leading-6 text-ink/70 [text-wrap:balance]">
            The machine’s fully stocked. Pick a flavour and it’ll print you a bill.
          </p>
          <Link to="/#products" className="jni-btn mt-6">
            Nibble now
          </Link>
        </div>
      </DeskWall>
      <DeskTop />
    </div>
  )
}
