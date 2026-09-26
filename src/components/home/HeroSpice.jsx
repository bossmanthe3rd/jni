import { AnimatePresence, motion } from 'framer-motion'
import { doodleComponents, packPalettes } from '../icons/PackDoodles'
import { useMediaQuery } from '../ui/Primitives'

/*
 * The loud half of the hero's doodles.
 *
 * DoodleField already lays the quiet ground behind everything -- the same art,
 * mixed most of the way toward the cream so body copy stays readable. This is
 * the other register the old banners had and the site lost: a handful of the
 * flavour's own chillies at full pack strength, ringing the desk, plus the
 * confetti every banner carries.
 *
 * Two families, two behaviours:
 *
 *   The confetti (speed lines, gold marks, ringed dots) is lifted straight off
 *   the banners and is IDENTICAL on all three of them -- only one small
 *   triangle is flavour-coloured. So it stays put and simply drifts, exactly as
 *   it does in the artwork. Swapping it per flavour would be inventing a
 *   difference the brand never drew.
 *
 *   The chillies ARE the flavour. They leave in the direction they drifted in
 *   from and the next flavour's spring on behind them, staggered. Nothing here
 *   crossfades: a doodle that dissolves reads as a slideshow, and the whole
 *   point of the pack rotating is that it should feel hand-made.
 */

/**
 * The banners' confetti, in percentages of this layer's box -- the wall, from
 * the ticker down to the back edge of the desk.
 *
 * Three marks, all on the pack's side of the wall -- the far right is the
 * lamp's. The banners put their speed
 * lines beside the pack, not across the headline, and every mark over the copy
 * was one more thing the headline had to read through.
 */
const CONFETTI = [
  { src: 'gold-a', left: '63%', top: '5%', width: '2.8vw', rotate: 24, dur: 7.1, delay: 1.7 },
  { src: 'line-d', left: '52.5%', top: '30%', width: '4.2vw', rotate: 160, dur: 6.1, delay: 0.7 },
  { src: 'line-c', left: '84%', top: '27%', width: '5vw', rotate: 12, dur: 6.7, delay: 1.3 },
]

/**
 * The flavour's own characters. `dx`/`dy` are the vector each one leaves and
 * arrives along, in px -- small enough to read as a throw rather than a flight.
 *
 * Two, not seven. On a desk scene the props are the dressing; the chillies
 * only have to say which flavour is on the desk, and they say it from the wall
 * above the packs, never behind the headline.
 */
const CHARS = [
  { name: 'chilli-whole', left: '57%', top: '10%', width: '4.4vw', rotate: -16, dx: 74, dy: -58 },
  { name: 'chilli-slice', left: '90.5%', top: '12%', width: '3.4vw', rotate: 22, dx: 92, dy: 20 },
]

/** Mix `hex` toward `toward` by t -- the same easing DoodleField uses. */
function mix(hex, toward, t) {
  const rgb = (h) => {
    const n = parseInt(h.replace('#', ''), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const a = rgb(hex)
  const b = rgb(toward)
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('')}`
}

// How far the chillies are pulled toward the cream. They were drawn at full
// pack strength, which put a 250px saturated chilli next to a 230px pack --
// decoration outweighing the product, which is exactly backwards for a hero.
// Pulled a little under halfway they still read as the flavour's own art and
// still outrank the DoodleField ground, without competing with the pack.
const RECEDE = 0.42
const GROUND = '#fbf6d0'

export default function HeroSpice({ slug, chillies = true, className = '' }) {
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)')
  const base = packPalettes[slug] || packPalettes['jalapeno-kick']
  const palette = {
    fill: mix(base.fill, GROUND, RECEDE),
    stem: mix(base.stem, GROUND, RECEDE),
    line: mix(base.line, GROUND, RECEDE),
    seed: mix(base.seed, GROUND, RECEDE),
  }

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      {CONFETTI.map((c, i) => (
        <motion.img
          key={`${c.src}-${i}`}
          src={`/assets/hero/confetti/${c.src}.webp`}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute h-auto"
          style={{ left: c.left, top: c.top, width: c.width, rotate: `${c.rotate}deg` }}
          animate={reduce ? undefined : { y: [0, -7, 0] }}
          transition={{ repeat: Infinity, duration: c.dur, delay: c.delay, ease: 'easeInOut' }}
        />
      ))}

      {chillies && (
      <AnimatePresence mode="wait">
        <motion.div key={slug} className="absolute inset-0">
          {CHARS.map((c, i) => {
            const Art = doodleComponents[c.name]
            if (!Art) return null
            const away = {
              opacity: 0,
              scale: 0.12,
              rotate: c.rotate - 52,
              x: c.dx,
              y: c.dy,
            }
            return (
              <motion.div
                key={`${c.name}-${i}`}
                className="absolute"
                style={{ left: c.left, top: c.top, width: c.width }}
                initial={reduce ? { opacity: 0 } : away}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: c.rotate,
                  x: 0,
                  y: 0,
                  transition: reduce
                    ? { duration: 0.2 }
                    : { type: 'spring', stiffness: 200, damping: 17, delay: i * 0.052 },
                }}
                exit={{
                  ...(reduce ? { opacity: 0 } : away),
                  transition: { duration: reduce ? 0.15 : 0.24, delay: reduce ? 0 : i * 0.016 },
                }}
              >
                <Art palette={palette} className="h-auto w-full" />
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>
      )}
    </div>
  )
}
