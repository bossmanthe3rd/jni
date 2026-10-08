import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Instagram, Mail, Phone } from 'lucide-react'
import { deliveredTotal, panelAccent, toCartProduct } from '../../data/products'
import { legalBusinessDetails, socialLinks } from '../../data/site'
import { packPalettes } from '../icons/PackDoodles'
import { heatLevel } from './HeatMeter'
import { useCart } from '../../store/cartStore'
import { useCrateSubtotal } from '../checkout/cartTotals'
import PincodeCheck from '../checkout/PincodeCheck'
import { usePincode } from '../../lib/pincode'

/**
 * "Asked a lot", as a chat.
 *
 * The three questions people actually ask are customer messages; the brand
 * answers each one in the flavour's colour, after a beat of "typing". The
 * first is already answered when the section arrives, so the thread is never
 * empty, and the rest wait as quick replies underneath -- the way a WhatsApp
 * support chat reads, which is most of this audience's idea of asking a shop
 * a question.
 *
 * Each answer carries a small moment of its own, built from things the page
 * already has: the heat meter filling to this flavour's level, crumbs popping
 * off "Fried", a pouch travelling from order to door.
 *
 * The section is the end of the page, so it closes on something to do: buy,
 * or ask a real person.
 */

const TYPING_MS = 750
const rupee = (n) => `₹${Number(n).toLocaleString('en-IN')}`

/* ---- the answers' little moments --------------------------------------- */

function HeatAnswer({ product }) {
  const reduce = useReducedMotion()
  const level = heatLevel(product) || 1
  const chilli = `/assets/doodles/pack/${product.slug}-chilli-whole.svg`
  return (
    <div className="jni-chat-card jni-chat-heat" role="img" aria-label={`Heat level ${level} of 3`}>
      {[0, 1, 2].map((i) => (
        <motion.img
          key={i}
          src={chilli}
          alt=""
          data-off={i < level ? undefined : ''}
          initial={reduce ? false : { scale: 0, rotate: -30, opacity: 0 }}
          whileInView={{ scale: 1, rotate: [-14, 10, -8][i], opacity: 1 }}
          viewport={ONCE}
          transition={{ type: 'spring', stiffness: 480, damping: 14, delay: 0.15 + i * 0.16 }}
        />
      ))}
      <b>{product.flavor}</b>
    </div>
  )
}

/* Crumb shards, the same shapes the heat climb's crisp sprays. */
const SHARDS = ['M-5 -3 L4 -5 L6 2 L-2 5 Z', 'M-4 -4 L5 -2 L3 5 L-5 3 Z', 'M-3 -5 L5 -1 L0 5 L-5 0 Z']
const CRACKLE = [
  [-62, -26], [-30, -40], [4, -44], [40, -36], [66, -18], [-50, 22], [58, 24],
]

function FriedAnswer() {
  const reduce = useReducedMotion()
  return (
    <div className="jni-chat-card jni-chat-fried">
      <b>Fried.</b>
      {!reduce && (
        <svg viewBox="-80 -50 160 100" aria-hidden="true">
          {CRACKLE.map(([dx, dy], i) => (
            <motion.path
              key={i}
              d={SHARDS[i % SHARDS.length]}
              fill={i % 2 ? '#e8b34a' : '#c88a26'}
              stroke="#0d2818"
              strokeWidth="1.4"
              strokeLinejoin="round"
              initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
              whileInView={{ x: dx, y: [0, dy, dy + 26], scale: 1, opacity: [0, 1, 0], rotate: dx * 4 }}
              viewport={ONCE}
              transition={{ duration: 1.1, delay: 0.2 + (i % 3) * 0.06, ease: [0.2, 0.7, 0.4, 1] }}
            />
          ))}
        </svg>
      )}
    </div>
  )
}

/* The last stop follows the reader's PIN: next day after dispatch on the
   India Post next-day list, 2-4 days everywhere else. Until a PIN is checked
   the route shows the promise that holds for every PIN. */
const stopsFor = (pin) => [
  'Ordered',
  'Dispatched in 24h',
  pin?.status === 'next-day' ? 'Next day after dispatch' : 'At your door in 2-4 days',
]

export function DeliveryAnswer({ product }) {
  const reduce = useReducedMotion()
  const pin = usePincode((s) => s.result)
  const thumb = product.gallery?.[0]?.thumb || product.images?.thumb
  const fast = pin?.status === 'next-day'
  return (
    <div className="jni-chat-card jni-chat-route">
      <div className="jni-chat-route-line">
        {/* Keyed on the answer, so checking a PIN sends the pouch again --
            quicker on a next-day route. */}
        <motion.img
          key={pin ? `${pin.pin}-${pin.status}` : 'route'}
          src={thumb}
          alt=""
          aria-hidden="true"
          initial={reduce ? false : { left: '0%' }}
          whileInView={{ left: '100%' }}
          viewport={ONCE}
          transition={{ duration: fast ? 0.9 : 1.6, delay: 0.25, ease: [0.45, 0, 0.3, 1] }}
        />
      </div>
      <ol>
        {stopsFor(pin).map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <div className="jni-chat-route-pin">
        <PincodeCheck size="compact" />
      </div>
    </div>
  )
}

/* ---- the thread --------------------------------------------------------- */

function faqsFor(product) {
  return [
    {
      id: 'heat',
      q: 'How spicy is it really?',
      a: `${product.flavor}. Flavour comes first, and the heat builds after a few bites.`,
      Extra: HeatAnswer,
    },
    {
      id: 'fried',
      q: 'Is it baked or fried?',
      a: 'That is where the crunch comes from.',
      Extra: FriedAnswer,
      extraFirst: true,
    },
    {
      id: 'delivery',
      q: 'How long does delivery take?',
      a: 'Next day in six metros, 2-4 days everywhere else. Pop your PIN in to see yours.',
      Extra: DeliveryAnswer,
    },
  ]
}

/* Bubbles, and the moments inside them, play when they are on screen --
   the first answer is in the DOM from page load, far below the fold. */
const ONCE = { once: true, amount: 0.6 }
const bubbleIn = {
  initial: { opacity: 0, y: 14, scale: 0.94 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: ONCE,
  transition: { type: 'spring', stiffness: 420, damping: 26 },
}

export default function PdpFaq({ product }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const crateSubtotal = useCrateSubtotal()
  const ground = packPalettes[product.slug]?.ground || product.theme?.ink
  return (
    <FaqChat
      subject={product}
      faqs={faqsFor(product)}
      accent={panelAccent({ ...product.theme, ink: ground })}
      avatar={`/assets/doodles/pack/${product.slug}-chilli-whole.svg`}
      buyName={`One pack of ${product.shortName || product.name}${crateSubtotal ? ' with your crate' : ''}`}
      payable={deliveredTotal(crateSubtotal + Number(product.price))}
      onBuy={() => {
        addItem(toCartProduct(product), 1)
        navigate('/checkout')
      }}
    />
  )
}

/**
 * The chat itself, for any product page: the flavour pages pass their three
 * questions, the combo pages theirs. Each faq is { id, q, a, Extra,
 * extraFirst, avatar? }; the first one is answered on arrival.
 */
export function FaqChat({ subject, faqs, accent, avatar, buyName, payable, onBuy }) {
  const reduce = useReducedMotion()

  // Asked questions in order; the first is answered before anyone asks.
  const [asked, setAsked] = useState([faqs[0]?.id])
  const [typing, setTyping] = useState(null)
  const timer = useRef(0)

  useEffect(() => {
    setAsked([faqs[0]?.id])
    setTyping(null)
    // Start the thread again when the page changes to another product.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject.slug])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const ask = (id) => {
    if (asked.includes(id) || typing) return
    setAsked((a) => [...a, id])
    if (reduce) return
    setTyping(id)
    timer.current = window.setTimeout(() => setTyping(null), TYPING_MS)
  }

  const waiting = faqs.filter((f) => !asked.includes(f.id))

  const instagram = socialLinks.find((s) => s.label === 'Instagram')
  const email = legalBusinessDetails.email
  const phone = legalBusinessDetails.phone

  return (
    <section className="jni-faq" aria-labelledby="jni-faq-title" style={{ '--chat-accent': accent }}>
      <div className="jni-chat-head">
        <h2 id="jni-faq-title">Asked a lot</h2>
        <p>Tap a question to ask it.</p>
      </div>

      <div className="jni-chat" aria-live="polite">
        {asked.map((id) => {
          const f = faqs.find((x) => x.id === id)
          const pending = typing === id
          const Extra = f.Extra
          return (
            <div key={id} className="jni-chat-pair">
              <motion.p className="jni-chat-q" {...(reduce ? {} : bubbleIn)}>
                {f.q}
              </motion.p>

              <div className="jni-chat-reply">
                {/* The flavour's own chilli as the replier's face: the logo's
                    lettering is unreadable at avatar size. */}
                <span className="jni-chat-avatar" aria-hidden="true">
                  <img src={f.avatar || avatar} alt="" />
                </span>
                <AnimatePresence mode="wait" initial={false}>
                  {pending ? (
                    <motion.span
                      key="typing"
                      className="jni-chat-a jni-chat-typing"
                      aria-label="Typing"
                      {...bubbleIn}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <i />
                      <i />
                      <i />
                    </motion.span>
                  ) : (
                    <motion.div key="answer" className="jni-chat-a" {...(reduce ? {} : bubbleIn)}>
                      {f.extraFirst && <Extra product={subject} />}
                      <p>{f.a}</p>
                      {!f.extraFirst && <Extra product={subject} />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )
        })}

        {waiting.length > 0 && (
          <div className="jni-chat-quick" role="group" aria-label="Ask a question">
            {waiting.map((f) => (
              <button key={f.id} type="button" onClick={() => ask(f.id)} disabled={Boolean(typing)}>
                {f.q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* The last section on the page, so it ends on something to do. */}
      <div className="jni-chat-end">
        <div className="jni-sticker jni-chat-buy" style={{ '--turn': '-1deg' }}>
          <b>Still hungry?</b>
          <p>
            {buyName}, delivered for {rupee(payable)}.
          </p>
          <button type="button" className="jni-btn jni-chat-buy-btn" onClick={onBuy}>
            Buy now · {rupee(payable)}
          </button>
        </div>

        <div className="jni-sticker jni-chat-ask" style={{ '--turn': '1.2deg' }}>
          <b>Ask us anything</b>
          <p>Something we did not cover? Write to us or give us a call.</p>
          <ul>
            <li>
              <a href={`mailto:${email}`}>
                <Mail size={18} strokeWidth={2.4} aria-hidden="true" />
                {email}
              </a>
            </li>
            <li>
              <a href={`tel:${phone.replace(/\s+/g, '')}`}>
                <Phone size={18} strokeWidth={2.4} aria-hidden="true" />
                {phone}
              </a>
            </li>
            {instagram && (
              <li>
                <a href={instagram.href} target="_blank" rel="noreferrer">
                  <Instagram size={18} strokeWidth={2.4} aria-hidden="true" />
                  @justnibbleit
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  )
}
