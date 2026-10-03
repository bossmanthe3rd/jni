import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * The product and bundle image gallery: a thumbnail rail and the shot itself.
 *
 * It advances on its own. The owner's PDP layout carries the note "pictures
 * will auto swipe" against the gallery, and it is the only instruction written
 * onto that artboard -- so it is the one piece of behaviour the design asks for
 * by name rather than by drawing.
 *
 * Auto-advance stops for good the moment someone picks a thumbnail. A carousel
 * that keeps moving after you have chosen a frame is fighting you, and this one
 * has no other way of knowing you are reading it. It also holds while the
 * pointer is over the image, and never starts at all under reduced motion.
 *
 * Both pages used to own a copy of this markup, and only one of them had a
 * gallery at all -- the bundles showed a single still while every flavour had
 * four.
 */

const INTERVAL = 4200

export default function ProductGallery({ images, badge, alt }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const chosen = useRef(false)
  const reduce = useReducedMotion()

  const count = images.length
  useEffect(() => {
    if (reduce || paused || chosen.current || count < 2) return
    const id = window.setInterval(() => setActive((i) => (i + 1) % count), INTERVAL)
    return () => window.clearInterval(id)
  }, [reduce, paused, count])

  const pick = (i) => {
    chosen.current = true
    setActive(i)
  }

  const current = images[active] || images[0]

  return (
    <div className="flex flex-row gap-2.5 sm:gap-4">
      <div className="flex w-16 flex-none flex-col gap-2 sm:w-20 sm:gap-3">
        {images.map((img, i) => (
          <button
            key={img.thumb}
            type="button"
            aria-label={`View image ${i + 1} of ${count}`}
            aria-current={i === active}
            onClick={() => pick(i)}
            className={`aspect-square w-full shrink-0 overflow-hidden rounded-xl border-[3px] bg-[#F7F1C8] transition sm:rounded-2xl ${
              i === active ? 'border-ink shadow-doodle' : 'border-ink/15 hover:border-ink/40'
            }`}
          >
            <img
              src={img.thumb}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      <div
        className="jni-card relative aspect-[4/5] max-h-[560px] min-w-0 flex-1 overflow-hidden bg-[#F7F1C8]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <motion.img
          key={current.src}
          src={current.src}
          alt={current.alt || alt}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {badge && (
          <span className="absolute left-3 top-3 z-[1] rounded-pill border-thick border-outline bg-sunshine px-3 py-1.5 text-xs font-black uppercase text-ink">
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}
