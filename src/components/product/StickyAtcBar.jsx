import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * Mobile add-to-cart bar for the two detail pages.
 *
 * Both pages already reserved room for one -- `pb-20 md:pb-0` on the page body,
 * and a `data-pdp-atc-sentinel` marker on the price row -- but nothing was ever
 * rendered into it, so on a phone the buy button scrolled away behind the
 * accordion and the reserved strip was simply 5rem of empty cream at the foot
 * of the page.
 *
 * The bar takes over exactly when the real CTA leaves the viewport, so the two
 * are never on screen together asking for the same tap.
 */
/*
 * Pass `image` for the floating variant the product page uses: a dark pill
 * that sits above the page edge with the pouch in it, so the bar reads as the
 * same pack you were just looking at rather than a generic strip.
 */
export default function StickyAtcBar({
  name,
  price,
  originalPrice,
  onAdd,
  watchRef,
  image,
  ctaLabel = 'Nibble Now',
}) {
  const [visible, setVisible] = useState(false)
  const seen = useRef(false)

  useEffect(() => {
    const el = watchRef?.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        // Only after the reader has actually reached the CTA once -- otherwise
        // the bar is already up on first paint, before anyone has seen a price.
        if (entry.isIntersecting) seen.current = true
        setVisible(seen.current && !entry.isIntersecting)
      },
      { threshold: 0 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [watchRef])

  if (image) {
    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: '140%' }}
            animate={{ y: 0 }}
            exit={{ y: '140%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="jni-atc-float md:hidden"
          >
            <img src={image} alt="" />
            <p>
              <b>{name}</b>
              <span>
                1 pack · ₹{price}
                {originalPrice > price && <s>₹{originalPrice}</s>}
              </span>
            </p>
            <button type="button" onClick={onAdd} className="jni-btn">
              {ctaLabel}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-ink bg-cream px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-black uppercase tracking-wide text-ink/55">
                {name}
              </p>
              <p className="flex items-baseline gap-2">
                <span className="font-display text-2xl leading-none text-ink">₹{price}</span>
                {originalPrice > price && (
                  <span className="text-[11px] font-semibold text-ink/40 line-through">
                    ₹{originalPrice}
                  </span>
                )}
              </p>
            </div>
            <button type="button" onClick={onAdd} className="jni-btn h-11 min-h-0 shrink-0 px-7">
              {ctaLabel}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
