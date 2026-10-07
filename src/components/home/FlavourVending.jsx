import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useDragControls,
  useInView,
  useReducedMotion,
} from 'framer-motion'
import { ChevronUp, Minus, Plus } from 'lucide-react'
import { useScrollLock } from '../../lib/scrollLock'
import { trapTab } from '../../lib/focusTrap'
import {
  STAMP_INK as STAMP,
  STAMP_INK_BUNDLE as STAMP_BUNDLE,
  bundles,
  perPacketPrice,
  products,
  toCartProduct,
} from '../../data/products'
import { useCart } from '../../store/cartStore'
import { doodleComponents, packPalettes } from '../icons/PackDoodles'
import { Wordmark } from '../icons/Wordmark'
import { heatLevel } from '../product/HeatMeter'
import { useMediaQuery } from '../ui/Primitives'
import { Barcode, MarkerRing } from '../ui/ReceiptMarks'
import BreakRoom from './BreakRoom'
import '../../styles/flavour-vending.css'
import { responsiveImage } from '../../lib/responsiveImage'

/*
 * Our flavours, as the office vending machine.
 *
 * The section above already walks through every flavour one at a time, full
 * screen. So this one is the pick-and-buy moment, and the machine makes buying
 * the interaction rather than something next to it. Tap a slot, or punch its
 * code on the keypad; the coil turns, the pack drops into the tray, and the
 * printer bolted to the machine's side prints a receipt.
 *
 * The receipt is the product card: an itemised account of what you got --
 * the flavour, what it tastes like bite by bite, how hot it is, what it costs,
 * and the button to take it. For a combo it itemises the box and stamps the
 * saving. Its decoration is all things real receipts carry: the pack printed
 * in thermal dots, a rubber stamp, the total circled in marker, a barcode.
 *
 * On a laptop the machine and its receipt are one fixed-size artboard, scaled
 * down as a unit to fit the screen height, so the whole thing is always seen
 * at once. On a phone there is no room beside the machine, so the receipt is
 * a bottom sheet instead.
 *
 * Nobody has to play to shop: every shelf tag carries name, heat and price.
 * The machine waits for a tap or a code before it vends anything -- until then
 * the printer carries a plate saying how to work it, where the receipt will be.
 */

const ORDER = ['sweet-chilli-rush', 'jalapeno-kick', 'peri-peri-punch']
const singles = ORDER.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean)

// Slot codes are one letter each, A to E: the flavours, then the combos.
const LETTERS = 'ABCDE'
const SLOTS = [
  ...singles.map((product) => ({ kind: 'single', item: product })),
  ...bundles.map((bundle) => ({ kind: 'bundle', item: bundle })),
].map((slot, i) => ({ ...slot, code: LETTERS[i] }))
const BY_CODE = Object.fromEntries(SLOTS.map((s) => [s.code, s]))
const CLEAR = 'CLR'
const KEYS = [...SLOTS.map((s) => s.code), CLEAR]


// The laptop artboard: machine plus printer, at design size. `ROOM` is what
// the site header and the section's own padding take out of the screen height.
const ARTBOARD = { w: 1190, h: 720 }
const ROOM = 130
// How much wall the break room props need either side of the artboard.
const ROOM_WALL = 210

const SPIN_MS = 750
const FALL_MS = 520

// The receipt feeds the way a thermal printer advances paper: in short bursts
// with a beat between them, rather than one smooth slide.
const PRINT_FEED = {
  y: ['-100%', '-78%', '-78%', '-54%', '-54%', '-29%', '-29%', '0%'],
  transition: {
    duration: 2.2,
    times: [0, 0.2, 0.27, 0.47, 0.54, 0.75, 0.82, 1],
    ease: ['easeOut', 'linear', 'easeOut', 'linear', 'easeOut', 'linear', 'easeOut'],
  },
}

// The keypad codes, as ranges per row, for the instruction plate.
const codeRange = (kind) => {
  const codes = SLOTS.filter((s) => s.kind === kind).map((s) => s.code)
  return codes.length > 1 ? `${codes[0]}–${codes[codes.length - 1]}` : codes[0]
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export default function FlavourVending() {
  const reduceMotion = useReducedMotion()
  const isDesk = useMediaQuery('(min-width: 1024px)')

  // idle -> vending -> ready. `typed` is what's on the keypad display.
  const [phase, setPhase] = useState('idle')
  const [selected, setSelected] = useState(null)
  const [preview, setPreview] = useState(null)
  const [typed, setTyped] = useState('')
  const [error, setError] = useState(null)
  const [spinning, setSpinning] = useState(null)
  const [empty, setEmpty] = useState(null)
  const [faller, setFaller] = useState(null)
  const [inTray, setInTray] = useState(null)
  // The receipt changes over only when the new pack lands, so the old one
  // stays up while the next is dropping and is torn off as the new one prints.
  const [receipt, setReceipt] = useState(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const rigRef = useRef(null)
  const zoom = useRef(1)
  const glassRef = useRef(null)
  const artRefs = useRef({})
  const busy = useRef(false)
  const alive = useRef(true)
  // Whether the section is still on screen when a pack lands (see land()).
  const sectionShown = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  // Fit the artboard to the screen: never wider than the viewport, never
  // taller than the space under the header.
  useLayoutEffect(() => {
    const rig = rigRef.current
    if (!rig) return undefined
    const fit = () => {
      if (window.innerWidth < 1024) {
        rig.style.zoom = ''
        zoom.current = 1
        return
      }
      const fitH = (window.innerHeight - ROOM) / ARTBOARD.h
      const fitW = (window.innerWidth - 40) / ARTBOARD.w
      // With the break room either side, if that still leaves the machine at
      // a comfortable size; otherwise the machine alone, as big as fits.
      const fitRoom = window.innerWidth / (ARTBOARD.w + 2 * ROOM_WALL)
      const withRoom = fitRoom >= 0.88
      const z = Math.max(0.62, Math.min(1.1, fitH, withRoom ? fitRoom : fitW))
      rig.style.zoom = String(z)
      zoom.current = z
      rig.dataset.room = withRoom ? 'on' : 'off'
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  const vend = useCallback(
    async (code, { byUser = false } = {}) => {
      if (busy.current || !BY_CODE[code]) return
      busy.current = true
      setSelected(code)
      setError(null)
      setInTray(null)

      const land = () => {
        setInTray(code)
        setReceipt(code)
        setPhase('ready')
        setTyped('')
        // Only if the reader is still here: scroll away mid-vend and the sheet
        // would otherwise pop open, and lock scrolling, when they come back.
        if (byUser && sectionShown.current) setSheetOpen(true)
        busy.current = false
      }

      if (reduceMotion) return land()

      setPhase('vending')
      setSpinning(code)
      await wait(SPIN_MS)
      if (!alive.current) return

      // Hand the pack from its slot to a copy that falls through the glass.
      // Screen measurements come back zoomed; the copy is placed in the
      // artboard's own units, hence the division.
      const glass = glassRef.current
      const art = artRefs.current[code]
      if (glass && art) {
        const z = zoom.current
        const g = glass.getBoundingClientRect()
        const a = art.getBoundingClientRect()
        setFaller({
          code,
          left: (a.left - g.left) / z - glass.clientLeft,
          top: (a.top - g.top) / z - glass.clientTop,
          width: a.width / z,
          height: a.height / z,
          drop: glass.clientHeight - (a.top - g.top) / z + 40,
        })
      }
      setSpinning(null)
      setEmpty(code)
      await wait(FALL_MS)
      if (!alive.current) return

      setFaller(null)
      land()

      // The machine restocks the slot from behind.
      await wait(420)
      if (alive.current) setEmpty(null)
    },
    [reduceMotion],
  )

  const sectionRef = useRef(null)
  const sectionInView = useInView(sectionRef, { amount: 0.12 })

  // The bulbs, the coil and the clock run on CSS loops; with the machine
  // wholly off screen they hold where they are rather than repaint unseen.
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined
    const io = new IntersectionObserver(([e]) => section.classList.toggle('vm-section--asleep', !e.isIntersecting))
    io.observe(section)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    sectionShown.current = sectionInView
    if (!sectionInView) setSheetOpen(false)
  }, [sectionInView])

  // Stable, because the sheet's focus effect runs again whenever onClose
  // changes -- a fresh arrow each render pulled focus back to the start.
  const closeSheet = useCallback(() => setSheetOpen(false), [])

  const pick = (code) => {
    vend(code, { byUser: true })
  }

  const press = (key) => {
    if (busy.current) return
    setError(null)
    if (key === CLEAR) return setTyped('')
    // One letter is a whole code, so a key press drops the pack straight away.
    setTyped(key)
    vend(key, { byUser: true })
  }

  return (
    <section id="products" ref={sectionRef} className="vm-section relative isolate overflow-x-clip">
      <RoughInk />
      <div className="vm-stage">
        <div className="vm-floor" aria-hidden="true" />

        <div ref={rigRef} className="vm-rig">
          {isDesk && <BreakRoom />}
          <div className="vm-machine">
            {/* The machine's lit sign is the section heading. */}
            <div className="vm-sign">
              <Bulbs />
              <h2 className="vm-sign-word font-brand">Our flavours</h2>
              <Bulbs from={4} />
            </div>

            <div className="vm-body">
              <div ref={glassRef} className="vm-glass">
                <div className="vm-lamp" aria-hidden="true" />
                {['single', 'bundle'].map((kind) => (
                  <div key={kind} className={`vm-row vm-row--${kind === 'single' ? 'a' : 'b'}`}>
                    {SLOTS.filter((s) => s.kind === kind).map((s) => (
                      <Slot
                        key={s.code}
                        slot={s}
                        artRef={(el) => (artRefs.current[s.code] = el)}
                        spinning={spinning === s.code}
                        empty={empty === s.code}
                        selected={selected === s.code}
                        onPick={pick}
                        onPreview={setPreview}
                      />
                    ))}
                  </div>
                ))}

                {faller && (
                  <motion.div
                    className="vm-faller"
                    style={{ left: faller.left, top: faller.top, width: faller.width, height: faller.height }}
                    initial={{ y: 0, rotate: 0 }}
                    animate={{ y: faller.drop, rotate: BY_CODE[faller.code].kind === 'single' ? 22 : 8 }}
                    transition={{ duration: FALL_MS / 1000, ease: [0.55, 0, 1, 0.45] }}
                    aria-hidden="true"
                  >
                    <SnackArt slot={BY_CODE[faller.code]} />
                  </motion.div>
                )}
                <div className="vm-sheen" aria-hidden="true" />
              </div>

              <div className="vm-tray">
                <div className="vm-tray-mouth">
                  <AnimatePresence>
                    {inTray && (
                      <motion.div
                        key={inTray}
                        className="vm-tray-item"
                        initial={reduceMotion ? { opacity: 0 } : { y: 40, rotate: -20, opacity: 0 }}
                        animate={{ y: 0, rotate: BY_CODE[inTray].kind === 'single' ? -78 : -6, opacity: 1 }}
                        exit={{ opacity: 0, y: 20, transition: { duration: 0.15 } }}
                        transition={{ type: 'spring', stiffness: 420, damping: 13 }}
                      >
                        <Link
                          to={pageFor(BY_CODE[inTray])}
                          aria-label={`Open the ${BY_CODE[inTray].item.shortName} page`}
                          className="block h-full"
                        >
                          <SnackArt slot={BY_CODE[inTray]} />
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className={`vm-flap ${inTray ? 'is-loaded' : ''}`} aria-hidden="true">
                    <span>Push</span>
                  </div>
                </div>
              </div>

              <div className="vm-panel">
                <Screen
                  phase={phase}
                  slot={selected ? BY_CODE[selected] : null}
                  preview={preview && phase !== 'vending' ? BY_CODE[preview] : null}
                  typed={typed}
                  error={error}
                  isDesk={isDesk}
                />
                <div className="vm-keypad" role="group" aria-label="Keypad">
                  {KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={`vm-key ${k === CLEAR ? 'vm-key--clear' : ''}`}
                      onClick={() => press(k)}
                      aria-label={k === CLEAR ? 'Clear code' : `Key ${k}: ${BY_CODE[k].item.shortName}`}
                    >
                      {k === CLEAR ? 'Clr' : k}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="vm-feet" aria-hidden="true">
              <span />
              <span />
            </div>
          </div>

          {/* The printer, bolted to the machine's side. Laptops only: on a
              phone the receipt is a bottom sheet. */}
          {isDesk && (
            <div className="vm-printer">
              <div className="vm-printer-box" aria-hidden="true">
                <i />
                <span>Receipts</span>
                <i />
                <b className="vm-printer-slot" />
              </div>
              <div className="vm-paper-well">
                <AnimatePresence mode="wait" initial={false}>
                  {receipt ? (
                    <motion.div
                      key={receipt}
                      className="vm-paper-feed"
                      initial={reduceMotion ? { opacity: 0 } : { y: '-100%' }}
                      animate={reduceMotion ? { opacity: 1 } : PRINT_FEED}
                      exit={
                        reduceMotion
                          ? { opacity: 0, transition: { duration: 0.1 } }
                          : { y: 90, rotate: 7, opacity: 0, transition: { duration: 0.32, ease: 'easeIn' } }
                      }
                    >
                      <Receipt slot={BY_CODE[receipt]} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="guide"
                      exit={
                        reduceMotion
                          ? { opacity: 0, transition: { duration: 0.1 } }
                          : { y: 40, opacity: 0, transition: { duration: 0.26, ease: 'easeIn' } }
                      }
                    >
                      <VendGuide />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isDesk && receipt && (
        <ReceiptSheet
          slot={BY_CODE[receipt]}
          open={sheetOpen}
          visible={sectionInView}
          onOpen={() => setSheetOpen(true)}
          onClose={closeSheet}
        />
      )}
    </section>
  )
}

function pageFor(slot) {
  return slot.kind === 'bundle' ? `/combos/${slot.item.slug}` : `/flavours/${slot.item.slug}`
}

/**
 * The instruction plate on the printer, shown until the first vend: the
 * enamel "how to use" plate real machines carry, in the order you do it.
 */
function VendGuide() {
  return (
    <div className="vm-guide">
      <span className="vm-guide-rivets" aria-hidden="true" />
      <p className="vm-guide-title">How it works</p>
      <ol className="vm-guide-steps">
        <li>
          <b>Pick a snack</b>
          <span>Tap any pack behind the glass.</span>
        </li>
        <li>
          <b>Or punch its code</b>
          <span>
            {codeRange('single')} for a flavour, {codeRange('bundle')} for a combo.
          </span>
        </li>
        <li>
          <b>Grab it</b>
          <span>It drops in the tray, and your receipt prints right here.</span>
        </li>
      </ol>
    </div>
  )
}

/** One slot behind the glass: the snack, its coil, and its shelf tag. */
function Slot({ slot, artRef, spinning, empty, selected, onPick, onPreview }) {
  const { item, code } = slot
  const name = item.shortName || item.name
  const heat = slot.kind === 'single' ? heatLevel(item) : 0
  const palette = packPalettes[item.slug]
  return (
    <button
      type="button"
      className={`vm-slot ${spinning ? 'is-spinning' : ''} ${selected ? 'is-selected' : ''}`}
      onClick={() => onPick(code)}
      onPointerEnter={(e) => e.pointerType === 'mouse' && onPreview(code)}
      onPointerLeave={() => onPreview(null)}
      aria-label={`${code}: ${name}, ₹${item.price}`}
    >
      <motion.div
        ref={artRef}
        className="vm-art"
        animate={empty ? { opacity: 0, scale: 0.8, y: -6 } : { opacity: 1, scale: spinning ? 1.07 : 1, y: 0 }}
        transition={
          empty
            ? { duration: 0 }
            : spinning
              ? { duration: SPIN_MS / 1000, ease: 'easeOut' }
              : { type: 'spring', stiffness: 260, damping: 18 }
        }
      >
        <SnackArt slot={slot} />
      </motion.div>
      <Coil />
      <span className="vm-tag" aria-hidden="true">
        <span className="vm-tag-top">
          <b>{code}</b>
          <span>₹{item.price}</span>
        </span>
        <span className="vm-tag-name">{name}</span>
        {heat > 0 && (
          <span className="vm-tag-heat">
            {[1, 2, 3].map((n) => (
              <i key={n} style={n <= heat ? { background: palette.fill } : undefined} />
            ))}
          </span>
        )}
        {slot.kind === 'bundle' && <span className="vm-tag-heat vm-tag-packs">{item.packetCount} packs</span>}
      </span>
    </button>
  )
}

// The packs behind the glass are never much over 100px wide.
const VM_PACK_SIZES = '120px'

/** The snack as drawn behind the glass. Combos are built from the pack cut-outs. */
function SnackArt({ slot, className = '' }) {
  if (slot.kind === 'single') {
    return (
      <img
        {...responsiveImage(`/assets/hero/pouch-${slot.item.slug}.webp`, VM_PACK_SIZES)}
        alt=""
        className={`vm-pack ${className}`}
        loading="lazy"
        decoding="async"
        draggable="false"
      />
    )
  }
  const six = slot.item.packetCount >= 6
  return (
    <div className={`vm-combo ${six ? 'vm-combo--six' : ''} ${className}`}>
      {six && (
        <div className="vm-combo-back">
          {ORDER.map((s) => (
            <img key={s} {...responsiveImage(`/assets/hero/pouch-${s}.webp`, VM_PACK_SIZES)} alt="" loading="lazy" draggable="false" />
          ))}
        </div>
      )}
      <div className="vm-combo-front">
        {ORDER.map((s) => (
          <img key={s} {...responsiveImage(`/assets/hero/pouch-${s}.webp`, VM_PACK_SIZES)} alt="" loading="lazy" draggable="false" />
        ))}
      </div>
    </div>
  )
}

/** A vending coil, seen side on. It turns while its slot is vending. */
function Coil() {
  const loops = Array.from({ length: 9 }, (_, i) => i)
  return (
    <svg className="vm-coil" viewBox="0 0 140 26" preserveAspectRatio="none" overflow="hidden" aria-hidden="true">
      <g className="vm-coil-turn">
        {loops.map((i) => (
          <ellipse key={`o${i}`} cx={i * 18 - 4} cy="13" rx="8" ry="10" fill="none" stroke="#0d2818" strokeWidth="5.5" />
        ))}
        {loops.map((i) => (
          <ellipse key={`i${i}`} cx={i * 18 - 4} cy="13" rx="8" ry="10" fill="none" stroke="#d6dcd4" strokeWidth="2.5" />
        ))}
      </g>
    </svg>
  )
}

// One loop of the chase, and the bulbs it runs across: four a side.
const CHASE_S = 1.6
const CHASE_BULBS = 8

/** Four bulbs; `from` is where they sit in the chase, 0 left, 4 right. */
function Bulbs({ from = 0 }) {
  return (
    <span className="vm-bulbs" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <i key={i} style={{ animationDelay: `${((from + i) / CHASE_BULBS - 1) * CHASE_S}s` }} />
      ))}
    </span>
  )
}

/**
 * The machine's screen. The receipt carries the product, so this only says
 * what the machine is doing -- and, on a mouse, previews the slot under it.
 */
function Screen({ phase, slot, preview, typed, error, isDesk }) {
  let body
  if (error) {
    body = <p className="vm-screen-big">{error}</p>
  } else if (preview) {
    body = (
      <>
        <p className="vm-screen-small">
          {preview.code} · ₹{preview.item.price}
        </p>
        <p className="vm-screen-name font-brand">{preview.item.shortName}</p>
        <p className="vm-screen-line">
          {preview.kind === 'single' ? preview.item.tagline : preview.item.subtitle}
        </p>
        <p className="vm-screen-small mt-2">Tap to drop it</p>
      </>
    )
  } else if (phase === 'vending' && slot) {
    body = (
      <>
        <p className="vm-screen-small">Code {slot.code}</p>
        <p className="vm-screen-big vm-blink">Dropping…</p>
      </>
    )
  } else if (typed) {
    body = (
      <>
        <p className="vm-screen-small">Code</p>
        <p className="vm-screen-big">
          {typed}
          <span className="vm-blink">_</span>
        </p>
      </>
    )
  } else if (phase === 'ready' && slot) {
    body = (
      <>
        <p className="vm-screen-small">{slot.code} · dropped</p>
        <p className="vm-screen-name font-brand">{slot.item.shortName}</p>
        <p className="vm-screen-small mt-2">{isDesk ? 'Receipt’s printing →' : 'Your receipt’s below ↓'}</p>
      </>
    )
  } else {
    body = (
      <>
        <p className="vm-screen-big">Pick a snack</p>
        <p className="vm-screen-small">Tap it, or punch its code</p>
      </>
    )
  }

  return (
    <div className="vm-screen" aria-live="polite">
      {body}
    </div>
  )
}

/** The receipt: the product card, itemised. */
function Receipt({ slot, torn = 'bottom' }) {
  const { addItem, openCart } = useCart()
  const [qty, setQty] = useState(1)
  const { item, code } = slot
  const single = slot.kind === 'single'
  const price = Number(item.price)
  const original = Number(item.originalPrice || price)
  const soldOut = item.stockQuantity === 0
  const ink = single ? STAMP[item.slug] : STAMP_BUNDLE

  const handleAdd = () => {
    if (soldOut) return
    const payload = single ? toCartProduct(item) : { ...item, selectedWeight: item.includes.join(', ') }
    addItem(payload, qty)
    openCart()
  }

  // What each bite tastes like, in order -- the first, the middle, the last.
  const bites =
    single && item.heatBites?.length >= 3
      ? [
          ['First', item.heatBites[0]],
          ['Then', item.heatBites[Math.floor(item.heatBites.length / 2)]],
          ['After', item.heatBites[item.heatBites.length - 1]],
        ]
      : []

  return (
    <article
      className={`vm-receipt vm-receipt--torn-${torn}`}
      style={{ '--vm-stamp': ink }}
      aria-label={`Receipt: ${item.shortName}`}
    >
      <header className="vm-rc-head">
        <Wordmark fill="#0d2818" className="vm-rc-logo" aria-hidden="true" />
        <p className="vm-rc-meta">
          Slot {code} · {item.weight}
        </p>
      </header>

      <div className="vm-rc-hero">
        <div className="vm-rc-print" aria-hidden="true">
          <SnackArt slot={slot} />
        </div>
        <div className="min-w-0">
          <h3 className="vm-rc-name font-brand">{item.shortName}</h3>
          {item.flavourHeading && <p className="vm-rc-heading">{item.flavourHeading}</p>}
        </div>
        <span className="vm-stamp" aria-hidden="true">
          {single ? item.flavor : `Save ₹${original - price}`}
        </span>
      </div>

      <p className="vm-rc-desc">{item.flavourDescription || item.description}</p>

      <hr className="vm-rc-rule" />
      {single ? (
        <>
          <ul className="vm-rc-lines">
            {bites.map(([when, text]) => (
              <li key={when}>
                <span>{when}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <hr className="vm-rc-rule" />
          <div className="vm-rc-row">
            <span className="vm-rc-label">Heat</span>
            <BigHeat product={item} />
          </div>
        </>
      ) : (
        <>
          <ul className="vm-rc-lines vm-rc-lines--box">
            {item.lineItems.map((li) => {
              const p = products.find((x) => x.slug === li.productSlug)
              return (
                <li key={li.productSlug}>
                  <span>{li.quantity} ×</span>
                  <span>
                    <i style={{ background: packPalettes[li.productSlug]?.fill }} />
                    {p?.shortName}
                  </span>
                </li>
              )
            })}
          </ul>
          <hr className="vm-rc-rule" />
          <div className="vm-rc-row">
            <span className="vm-rc-label">Per pack</span>
            <span className="vm-rc-small">₹{perPacketPrice(item)}</span>
          </div>
        </>
      )}

      <div className="vm-rc-total">
        <div className="vm-qty">
          <button type="button" aria-label="Fewer" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            <Minus size={14} />
          </button>
          <span aria-live="polite">{qty}</span>
          <button type="button" aria-label="More" onClick={() => setQty((q) => q + 1)}>
            <Plus size={14} />
          </button>
        </div>
        <div className="vm-rc-sum">
          {original > price && <s>₹{original * qty}</s>}
          <span className="vm-rc-price">
            ₹{price * qty}
            <MarkerRing />
          </span>
        </div>
      </div>

      <div className="vm-sticker">
        <button type="button" className="jni-btn vm-cta" disabled={soldOut} onClick={handleAdd}>
          {soldOut ? 'Sold out' : 'Nibble Now'}
        </button>
      </div>

      <footer className="vm-rc-foot">
        <Barcode code={code} />
        <Link to={pageFor(slot)} className="vm-rc-link">
          {single ? 'Full story' : 'See the combo'} →
        </Link>
      </footer>
    </article>
  )
}

/** Heat as printed chillies: the pack's own chilli doodle, lit up to the level. */
function BigHeat({ product }) {
  const level = heatLevel(product)
  const Chilli = doodleComponents['chilli-whole']
  const lit = packPalettes[product.slug]
  const unlit = { fill: '#0d28181a', stem: '#0d281814', line: '#0d281840', seed: '#0d281814' }
  return (
    <span className="vm-rc-heat" role="img" aria-label={`Heat level ${level} of 3: ${product.flavor}`}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ transform: `translateY(${(2 - i) * 2}px)` }}>
          <Chilli palette={i < level ? lit : unlit} />
        </span>
      ))}
      <b>{product.flavor}</b>
    </span>
  )
}

/** The receipt on a phone: a tab along the bottom that opens into a sheet. */
function ReceiptSheet({ slot, open, visible, onOpen, onClose }) {
  const drag = useDragControls()
  const sheetRef = useRef(null)
  const showing = visible && open

  // Held still underneath, like the cart: scrolling the page behind the sheet
  // used to carry the machine out of view, which closed the sheet on its own.
  useScrollLock(showing)

  useEffect(() => {
    if (!showing) return undefined
    const opener = document.activeElement
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') trapTab(e, sheetRef.current)
    }
    sheetRef.current?.focus({ preventScroll: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener?.focus?.({ preventScroll: true })
    }
  }, [showing, onClose])

  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {visible && !open && (
        <motion.button
          key="tab"
          type="button"
          className="vm-sheet-tab"
          onClick={onOpen}
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          aria-label={`Open your receipt: ${slot.item.shortName}, ₹${slot.item.price}`}
        >
          <span className="vm-sheet-tab-label">Your receipt</span>
          <span className="vm-sheet-tab-name">{slot.item.shortName}</span>
          <span className="vm-sheet-tab-price">₹{slot.item.price}</span>
          <ChevronUp size={18} aria-hidden="true" />
        </motion.button>
      )}
      {visible && open && (
        <motion.div key="sheet" className="vm-sheet-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" className="vm-sheet-scrim" aria-label="Close receipt" onClick={onClose} />
          <motion.div
            ref={sheetRef}
            tabIndex={-1}
            className="vm-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`Receipt: ${slot.item.shortName}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            drag="y"
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) onClose()
            }}
          >
            <div className="vm-sheet-handle" onPointerDown={(e) => drag.start(e)}>
              <span />
              <button type="button" onClick={onClose}>
                Back to the machine
              </button>
            </div>
            <div className="vm-sheet-scroll">
              <Receipt key={slot.code} slot={slot} torn="top" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** The filters that rough up the stamp: speckled ink, a slightly wobbled edge. */
function RoughInk() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <filter id="vm-rough" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="noise" />
        <feColorMatrix
          in="noise"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.4 0 0 0 1.75"
          result="holes"
        />
        <feComposite in="SourceGraphic" in2="holes" operator="in" result="speckled" />
        <feDisplacementMap in="speckled" in2="noise" scale="2.2" />
      </filter>
    </svg>
  )
}
