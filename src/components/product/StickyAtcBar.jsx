import { useEffect, useState } from 'react'
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
 * The bar is up whenever the real CTA is not, so the two are never on screen
 * together asking for the same tap. It is hidden from lg up, where the dossier
 * goes two-column and the buy block stays in view beside the pouch.
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
  unit = '1 pack',
}) {
  const [visible, setVisible] = useState(false)

  /*
   * Three signals decide the bar:
   *
   *   - the real CTA is on screen: hide, so two buttons never ask for one tap;
   *   - the footer is on screen: hide, or the bar sits over its last links;
   *   - the reader has either reached the CTA once, or scrolled most of a
   *     screen. On a phone the CTA is ~1000px down, under the gallery, title,
   *     switcher and price, so waiting to "see" it left the first screen with
   *     no way to buy at all.
   */
  useEffect(() => {
    const el = watchRef?.current
    if (!el) return
    const state = { cta: false, footer: false, seen: false, scrolled: false }
    const sync = () =>
      setVisible(!state.cta && !state.footer && (state.seen || state.scrolled))

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === el) {
            state.cta = entry.isIntersecting
            if (entry.isIntersecting) state.seen = true
          } else {
            state.footer = entry.isIntersecting
          }
        }
        sync()
      },
      { threshold: 0 }
    )
    io.observe(el)
    const footer = document.querySelector('footer')
    if (footer) io.observe(footer)

    const onScroll = () => {
      const scrolled = window.scrollY > window.innerHeight * 0.6
      if (scrolled === state.scrolled) return
      state.scrolled = scrolled
      sync()
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
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
            className="jni-atc-float lg:hidden"
          >
            <img src={image} alt="" />
            <p>
              <b>{name}</b>
              <span>
                {unit} · ₹{price}
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
          className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-ink bg-cream px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden"
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black uppercase tracking-wide text-ink/55">
                {name}
              </p>
              <p className="flex items-baseline gap-2">
                <span className="font-display text-2xl leading-none text-ink">₹{price}</span>
                {originalPrice > price && (
                  <span className="text-xs font-semibold text-ink/40 line-through">
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
