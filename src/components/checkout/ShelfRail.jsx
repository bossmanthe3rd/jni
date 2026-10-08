import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import {
  FREE_SHIPPING_THRESHOLD,
  bundles,
  perPacketPrice,
  products,
  toCartProduct,
} from '../../data/products'
import { useCart } from '../../store/cartStore'
import HeatMeter from '../product/HeatMeter'
import { pouchCutout } from '../product/PouchStage'
import { toCartBundle } from '../bundle/boxContents'
import { responsiveImage } from '../../lib/responsiveImage'
import '../../styles/delivery.css'

/**
 * "Add to your crate": a strip of the vending machine's shelf under the crate.
 *
 * Everything in stock that is not in the crate yet, standing on the machine's
 * yellow shelf behind its glass, each with the machine's shelf tag and one of
 * its keypad keys to add it. Adding takes the pack off the shelf and it turns
 * up in the crate above -- the shelf only ever offers what you have not got.
 *
 * Order: whatever closes the gap to free delivery first (it wears the one
 * sticker), then the other flavours, then the boxes. Hidden when there is
 * nothing left to offer.
 *
 *   size   'compact' (drawer) or 'full' (checkout)
 */

function shelfFor(items, subtotal) {
  const inCrate = (slug) => items.some((i) => i.slug === slug)
  const stock = [
    ...products.map((item) => ({ kind: 'single', item })),
    ...bundles.map((item) => ({ kind: 'bundle', item })),
  ].filter(({ item }) => item.stockQuantity !== 0 && !inCrate(item.slug))

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  // The cheapest thing that unlocks free delivery on its own.
  const closer =
    remaining > 0
      ? stock.filter(({ item }) => Number(item.price) >= remaining).sort((a, b) => a.item.price - b.item.price)[0]
      : null

  const rank = (s) => (s === closer ? 0 : s.kind === 'single' ? 1 : 2)
  return {
    closer,
    shelf: stock.sort((a, b) => rank(a) - rank(b) || a.item.price - b.item.price),
  }
}

export default function ShelfRail({ size = 'compact' }) {
  const reduce = useReducedMotion()
  const items = useCart((s) => s.items)
  const addItem = useCart((s) => s.addItem)
  const subtotal = items.reduce((n, i) => n + Number(i.price) * i.qty, 0)
  const { closer, shelf } = shelfFor(items, subtotal)

  const trackRef = useRef(null)
  const [ends, setEnds] = useState({ start: true, end: false, scrolls: false })
  const measure = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const scrolls = el.scrollWidth > el.clientWidth + 2
    const start = el.scrollLeft <= 2
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
    // Only when something actually changes: this runs on scroll.
    setEnds((e) =>
      e.start === start && e.end === end && e.scrolls === scrolls ? e : { start, end, scrolls }
    )
  }, [])
  useEffect(() => {
    measure()
    const el = trackRef.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, shelf.length])

  const nudge = (dir) => {
    const el = trackRef.current
    const slot = el?.firstElementChild
    if (!el || !slot) return
    el.scrollBy({ left: dir * slot.getBoundingClientRect().width, behavior: reduce ? 'auto' : 'smooth' })
  }

  if (shelf.length === 0) return null

  const add = ({ kind, item }) =>
    addItem(kind === 'bundle' ? toCartBundle(item) : toCartProduct(item), 1)

  return (
    <section className={`shelf shelf--${size}`} aria-labelledby={`shelf-${size}`}>
      <div className="shelf-head">
        <h3 id={`shelf-${size}`}>Add to your crate</h3>
        <div className="shelf-arrows" hidden={!ends.scrolls}>
          <button type="button" onClick={() => nudge(-1)} disabled={ends.start} aria-label="Scroll the shelf back">
            <ChevronLeft size={16} strokeWidth={3} />
          </button>
          <button type="button" onClick={() => nudge(1)} disabled={ends.end} aria-label="Scroll the shelf on">
            <ChevronRight size={16} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="shelf-glass">
        <ul ref={trackRef} className="shelf-track" onScroll={measure}>
          <AnimatePresence initial={false}>
            {shelf.map((slot) => {
              const { kind, item } = slot
              const name = item.shortName || item.name
              return (
                <motion.li
                  key={item.slug}
                  layout={!reduce}
                  className="shelf-slot"
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: -24, transition: { duration: 0.25 } }}
                >
                  <div className="shelf-pack" aria-hidden="true">
                    {kind === 'single' ? (
                      <img {...responsiveImage(pouchCutout(item.slug), '90px')} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <span className="shelf-box">
                        {['jalapeno-kick', 'peri-peri-punch', 'sweet-chilli-rush'].map((s) => (
                          <img key={s} {...responsiveImage(pouchCutout(s), '60px')} alt="" loading="lazy" decoding="async" />
                        ))}
                      </span>
                    )}
                  </div>
                  {slot === closer && <span className="shelf-sticker">Free delivery with this</span>}
                  <div className="shelf-ledge">
                    <div className="shelf-tag">
                      <span className="shelf-tag-top">
                        <b>{name}</b>
                        <span>₹{item.price}</span>
                      </span>
                      {kind === 'single' ? (
                        <HeatMeter
                          product={item}
                          flavour={item.slug}
                          onLight
                          className="shelf-heat"
                          labelClassName="text-ink/60"
                        />
                      ) : (
                        <span className="shelf-meta">
                          {item.packetCount} packs · ₹{perPacketPrice(item)} a pack
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="shelf-key"
                      onClick={() => add(slot)}
                      aria-label={`Add ${name}, ₹${item.price}`}
                    >
                      <Plus size={16} strokeWidth={3} aria-hidden="true" /> Add
                    </button>
                  </div>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  )
}
