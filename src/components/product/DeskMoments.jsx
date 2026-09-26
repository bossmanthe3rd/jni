import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * The flavour's lifestyle shots as a strip of prints.
 *
 * Every flavour already had three or four desk photographs, but the page only
 * ever showed them as 58px thumbnails under the pack. Here they get a caption
 * and room to be looked at. The strip scrolls natively (swipe, trackpad,
 * shift-wheel); the arrows are a convenience on top of that.
 *
 * The prints are taped up, drift sideways a little as the section scrolls
 * past, and straighten when you point at one.
 */
export default function DeskMoments({ product }) {
  const railRef = useRef(null)
  const sectionRef = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const drift = useTransform(scrollYProgress, [0, 1], [40, -40])
  const shots = (product.gallery || []).slice(1)
  if (!shots.length) return null

  const step = (dir) => {
    const rail = railRef.current
    if (!rail) return
    const card = rail.querySelector('figure')
    const by = card ? card.offsetWidth + 34 : rail.clientWidth * 0.8
    rail.scrollBy({ left: dir * by, behavior: 'smooth' })
  }

  return (
    <section ref={sectionRef} className="jni-desks jni-grain" aria-labelledby="jni-desks-title">
      <img
        src={`/assets/doodles/pack/${product.slug}-chilli-whole.svg`}
        alt=""
        aria-hidden="true"
        className="jni-desks-doodle"
      />
      <div className="jni-desks-head">
        <div>
          <p className="jni-desks-k">Designed for your desk</p>
          <h2 id="jni-desks-title">Between meetings. During the 4 PM slump.</h2>
        </div>
        <div className="jni-desks-nav">
          <button type="button" aria-label="Previous photo" onClick={() => step(-1)}>
            <ChevronLeft size={22} strokeWidth={3} />
          </button>
          <button type="button" aria-label="Next photo" onClick={() => step(1)}>
            <ChevronRight size={22} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="jni-desks-rail" ref={railRef}>
        <motion.div className="jni-desks-row" style={{ x: reduce ? 0 : drift }}>
          {shots.map((s, i) => (
            <figure
              key={s.src}
              style={{
                '--turn': `${[-2, 1.5, -1, 2][i % 4]}deg`,
                '--drop': i % 2 ? '18px' : '0px',
                '--tape': `${[-5, 4, -2, 6][i % 4]}deg`,
              }}
            >
              <img src={s.src} alt={s.alt} loading="lazy" decoding="async" />
              {s.caption && <figcaption>{s.caption}</figcaption>}
            </figure>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
