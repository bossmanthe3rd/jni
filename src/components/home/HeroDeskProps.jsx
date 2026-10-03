import { motion } from 'framer-motion'
import { useMediaQuery } from '../ui/Primitives'
import { DESK_PROPS } from './HeroDesk'
import { responsiveImage } from '../../lib/responsiveImage'

/*
 * The desk's stationery, standing on the surface the host draws.
 *
 * Mounted once and never re-keyed: the flavour rotation moves the packs, not
 * the desk. The set arrives the way a desk fills up -- the edge pieces slide in
 * from their own side, the loose ones drop onto the surface -- and then stays.
 *
 * Positioned against the hero section. Each prop's foot sits on the lip line
 * (`--lip`, set by the host) and `translate` drops it by `sink` of its own
 * height, so the lip paints over the bottom of it exactly as the banners crop
 * their props. `translate` is used rather than `transform` because Framer owns
 * the latter.
 */
export default function HeroDeskProps({ className = '' }) {
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)')

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      {DESK_PROPS.map((p, i) => (
        <motion.img
          key={p.src}
          {...responsiveImage(
            `/assets/hero/desk/${p.src}.webp`,
            `(min-width: 768px) ${p.width}vw, ${(p.mobile || p).width}vw`
          )}
          alt=""
          // Laptop-only props are display:none on a phone; lazy, a phone never
          // fetches them (eager images download even when hidden).
          loading={p.mobile ? 'eager' : 'lazy'}
          decoding="async"
          className={`absolute h-auto left-[var(--pl-m)] w-[var(--pw-m)] md:left-[var(--pl)] md:w-[var(--pw)] ${
            p.mobile ? '' : 'hidden md:block'
          }`}
          style={{
            '--pl': `${p.left}vw`,
            '--pw': `${p.width}vw`,
            '--pl-m': `${(p.mobile || p).left}vw`,
            '--pw-m': `${(p.mobile || p).width}vw`,
            bottom: 'calc(var(--lip) * 0.7)',
            translate: `0 ${p.sink}%`,
          }}
          initial={
            reduce
              ? { opacity: 0 }
              : { opacity: 0, x: p.edge === 'l' ? -46 : p.edge === 'r' ? 46 : 0, y: p.edge ? 0 : -28 }
          }
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={
            reduce
              ? { duration: 0.2 }
              : { type: 'spring', stiffness: 200, damping: 20, delay: 0.15 + i * 0.07 }
          }
        />
      ))}
    </div>
  )
}
