import { useId, useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ASPECT, doodleComponents, packPalettes } from '../icons/PackDoodles'
import { rideAt } from './jaggedEdge'

/*
 * A panel's edge, drawn as a procession of doodles rather than a rule.
 *
 * The packs never outline anything with a plain stroke -- an edge on a FLIPO's
 * pouch is where the ingredient field runs out. So instead of a keyline, this
 * sends chillies, pods, sections, stars and triangles around the panel's whole
 * perimeter, in all three flavours' colours, cycling so the range is always on
 * show.
 *
 * The travel is CSS motion path, not JavaScript: every doodle shares one
 * `offset-path` and one keyframed ride round it, each started at a negative
 * delay of its own share of the duration. That spaces them round the loop for
 * free and loops without a seam -- the doodle leaving the end IS the doodle
 * arriving at the start. Nothing recalculates per frame.
 *
 * The shape is not this component's to decide. The caller passes the
 * `geometry` from jaggedEdge() -- the same one its panel is clipped to -- so
 * the doodles ride the real crimp and tear. It also times the ride: the
 * doodles slow climbing a tooth and quicken coming down it, and lie along the
 * edge the whole way round, swinging over each peak rather than snapping.
 *
 * Nothing is masked. An earlier cut faded the doodles out around the mascot so
 * none would cross his face, and faded both ends into the lip -- but a border
 * with gaps in it is not a border, and he is worth a doodle passing in front
 * of him.
 */

const FLAVOURS = ['peri-peri-punch', 'jalapeno-kick', 'sweet-chilli-rush']

/*
 * Deliberately not the whole pack set. `seed` is a single chilli seed, which at
 * this size is a pale oval with a dark rim and reads as nothing at all -- it is
 * the shape nobody could name. Stars and triangles come from the section's own
 * confetti, the same marks that already frame the Testimonials heading, so the
 * edge is built from two vocabularies the page is already using rather than
 * five variations on one.
 */
const PACK_SHAPES = ['chilli-whole', 'chilli-half', 'chilli-slice', 'jalapeno', 'pepper-section']
const CONFETTI_SHAPES = ['star', 'triangle']
const POOL = [...PACK_SHAPES, ...CONFETTI_SHAPES]

const CONFETTI_ASPECT = { star: 1, triangle: 1.14 }

function Star({ palette, className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M24 2 28.8 16.4 44 18.2 32.4 28 35.2 44 24 36.2 12.8 44 15.6 28 4 18.2 19.2 16.4Z"
        fill={palette.fill}
        stroke={palette.line}
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Triangle({ palette, className }) {
  return (
    <svg className={className} viewBox="0 0 20 18" aria-hidden="true">
      <path
        d="M10 1.6 18.4 16.4H1.6Z"
        fill={palette.fill}
        stroke={palette.line}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const EXTRA_COMPONENTS = { star: Star, triangle: Triangle }

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/*
 * The pods are drawn standing up, stem at the top. Turned a quarter back from
 * the heading, each one lies along the edge tip-first, the way it's travelling.
 */
const ALONG = -90

/** The ride as two keyframe sets: along the path, and the heading that goes with it. */
function rideKeyframes(name, geometry) {
  const at = (t) => `${(t * 100).toFixed(3)}%`
  const ride = geometry.ride.map((s) => `${at(s.t)}{offset-distance:${(s.p * 100).toFixed(3)}%}`)
  const turn = geometry.turn.map((s) => `${at(s.t)}{rotate:${(s.angle + ALONG).toFixed(2)}deg}`)
  return `@keyframes ${name}-ride{${ride.join('')}}@keyframes ${name}-turn{${turn.join('')}}`
}

export default function DoodleBorder({
  geometry,
  spacing = 120,
  duration = 26,
  seed = 7,
  className = '',
}) {
  const reduce = useReducedMotion()
  const name = `jni-ride-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  // How many doodles is a question about the perimeter, not about the panel.
  // A fixed count strung round a phone-width box is a necklace; round a
  // desktop one it is a dotted line. Spacing them at a set distance and
  // letting the count follow keeps one density at every width.
  const count = geometry
    ? Math.max(12, Math.min(44, Math.round((2 * geometry.w + 2 * geometry.h) / spacing)))
    : 0

  const items = useMemo(() => {
    const rnd = mulberry32(seed * 2654435761)
    const out = []
    for (let i = 0; i < count; i += 1) {
      // Colour cycles in threes so all three flavours are always in view and
      // the rhythm reads as deliberate; the shapes vary underneath it so the
      // repeat never becomes a pattern you can count.
      let name = POOL[Math.floor(rnd() * POOL.length)]
      if (i > 0 && name === out[i - 1].name) {
        name = POOL[(POOL.indexOf(name) + 1) % POOL.length]
      }
      const confetti = CONFETTI_SHAPES.includes(name)
      out.push({
        name,
        flavour: FLAVOURS[i % FLAVOURS.length],
        // Confetti is punctuation between the pack shapes, so it runs smaller.
        size: confetti ? 16 + rnd() * 7 : 27 + rnd() * 14,
        // Barely off the edge's own line, so the procession reads as placed by
        // hand rather than stamped along a rail.
        rotate: -4 + rnd() * 8,
      })
    }
    return out
  }, [count, seed])

  if (!geometry) return null
  const path = `path("${geometry.d}")`

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      {!reduce && <style>{rideKeyframes(name, geometry)}</style>}
      {items.map((it, i) => {
        const Art = doodleComponents[it.name] || EXTRA_COMPONENTS[it.name]
        if (!Art) return null
        const aspect = ASPECT[it.name] || CONFETTI_ASPECT[it.name] || 1
        const share = i / items.length
        // Held still, each doodle is placed where the ride would have it at its
        // own share of the loop, lying along the edge there.
        const still = reduce ? rideAt(geometry, share) : null
        const timing = { animationDuration: `${duration}s`, animationDelay: `${-share * duration}s` }
        return (
          <div
            key={i}
            className="absolute left-0 top-0"
            style={{
              width: `${it.size}px`,
              height: `${it.size / aspect}px`,
              offsetPath: path,
              offsetRotate: '0deg',
              ...(still
                ? { offsetDistance: `${still.p * 100}%` }
                : {
                    willChange: 'offset-distance',
                    animationName: `${name}-ride`,
                    animationTimingFunction: 'linear',
                    animationIterationCount: 'infinite',
                    ...timing,
                  }),
            }}
          >
            <div
              style={{
                transform: `rotate(${it.rotate}deg)`,
                ...(still
                  ? { rotate: `${still.angle + ALONG}deg` }
                  : {
                      animationName: `${name}-turn`,
                      animationTimingFunction: 'linear',
                      animationIterationCount: 'infinite',
                      ...timing,
                    }),
              }}
            >
              <Art palette={packPalettes[it.flavour]} className="jni-doodle-art" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
