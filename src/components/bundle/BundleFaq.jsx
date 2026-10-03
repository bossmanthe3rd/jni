import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { deliveredTotal } from '../../data/products'
import { useCart } from '../../store/cartStore'
import { useCrateSubtotal } from '../checkout/cartTotals'
import { DeliveryAnswer, FaqChat } from '../product/PdpFaq'
import { boxFlavours, pouchCutout, toCartBundle } from './boxContents'
import { responsiveImage } from '../../lib/responsiveImage'

/**
 * "Asked a lot" for a box: the flavour pages' chat, with the three things
 * people ask about a combo. Each answer is written by a different pouch --
 * the replier's face is each flavour's chilli in turn -- since a box is the
 * three of them talking.
 */

const ONCE = { once: true, amount: 0.6 }
const rupee = (n) => `₹${Number(n).toLocaleString('en-IN')}`

/* The mix, stood up in a row: the answer to "can I swap" is what is in it. */
function MixAnswer({ product: bundle }) {
  const reduce = useReducedMotion()
  return (
    <div className="jni-chat-card jni-chat-mix">
      {boxFlavours(bundle).map(({ product, quantity }, i) => (
        <motion.span
          key={product.slug}
          initial={reduce ? false : { y: 24, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1, rotate: [-6, 2, 7][i % 3] }}
          viewport={ONCE}
          transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.15 + i * 0.12 }}
        >
          <img {...responsiveImage(pouchCutout(product.slug), '96px')} alt="" />
          {quantity > 1 && <b>×{quantity}</b>}
        </motion.span>
      ))}
    </div>
  )
}

/* Singles against the box, as two bars. Both numbers come from the
   catalogue, so this redraws itself whenever a price changes. */
function PriceAnswer({ product: bundle }) {
  const reduce = useReducedMotion()
  const singles = boxFlavours(bundle).reduce(
    (sum, { product, quantity }) => sum + Number(product.price) * quantity,
    0
  )
  const box = Number(bundle.price)
  const most = Math.max(singles, box) || 1
  const rows = [
    { label: `${bundle.packetCount} singles`, value: singles },
    { label: 'This box', value: box, on: true },
  ]
  return (
    <div className="jni-chat-card jni-chat-bars">
      {rows.map((r, i) => (
        <div key={r.label} className="jni-chat-bar" data-on={r.on ? '' : undefined}>
          <span>{r.label}</span>
          <div>
            <motion.i
              initial={reduce ? false : { width: 0 }}
              whileInView={{ width: `${(r.value / most) * 100}%` }}
              viewport={ONCE}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.25, ease: [0.2, 0.8, 0.3, 1] }}
            />
          </div>
          <b>{rupee(r.value)}</b>
        </div>
      ))}
    </div>
  )
}

function faqsFor(bundle) {
  const flavours = boxFlavours(bundle)
  const chilli = (i) => {
    const p = flavours[i % flavours.length]?.product
    return p ? `/assets/doodles/pack/${p.slug}-chilli-whole.svg` : undefined
  }
  const singles = flavours.reduce((s, { product, quantity }) => s + Number(product.price) * quantity, 0)
  const cheaper = singles > Number(bundle.price)
  return [
    {
      id: 'swap',
      q: 'Can I swap the flavours in this box?',
      a: 'Not yet, the mix is fixed for launch. You can add single packs to the same order if you want more of one.',
      Extra: MixAnswer,
      extraFirst: true,
      avatar: chilli(0),
    },
    {
      id: 'price',
      q: 'Is it cheaper than buying singles?',
      a: cheaper
        ? `Yes. The same pouches bought one at a time come to ${rupee(singles)}.`
        : 'It works out about the same as singles, in one box.',
      Extra: PriceAnswer,
      avatar: chilli(1),
    },
    {
      id: 'delivery',
      q: 'How long does delivery take?',
      a: '2-4 days across most metro and regional zones.',
      Extra: DeliveryAnswer,
      avatar: chilli(2),
    },
  ]
}

export default function BundleFaq({ bundle }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const crateSubtotal = useCrateSubtotal()
  const faqs = faqsFor(bundle)
  return (
    <FaqChat
      subject={bundle}
      faqs={faqs}
      // Teal, not the box's yellow: the buy sticker is painted in this, and
      // the site's CTA is yellow, so a yellow sticker would swallow its button.
      accent="#4db8ae"
      avatar={faqs[0].avatar}
      buyName={`One ${bundle.name}${crateSubtotal ? ' with your crate' : ''}`}
      payable={deliveredTotal(crateSubtotal + Number(bundle.price))}
      onBuy={() => {
        addItem(toCartBundle(bundle), 1)
        navigate('/checkout')
      }}
    />
  )
}
