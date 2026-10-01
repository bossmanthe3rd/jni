import { useEffect, useId, useMemo, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ASPECT, doodleComponents, packPalettes } from '../icons/PackDoodles'
import { rideAt } from './jaggedEdge'

/*
 * A panel's edge, drawn as a procession of doodles rather than a rule.
 *
 * The packs never outline anything with a plain stroke -- an edge on a FLIPO's
 * pouch is where the ingredient field runs out. So instead of a keyline, this
 * sends chillies around the panel's whole perimeter, in all three flavours'
 * colours, cycling so the range is always on show.
 *
 * The travel is CSS motion path, not JavaScript: every doodle shares one
 * `offset-path` and one keyframed ride round it, each started at a negative
 * delay of its own share of the duration. That spaces them round the loop for
 * free and loops without a seam -- the doodle leaving the end IS the doodle
 * arriving at the start. Nothing recalculates per frame.
 *
 * An `offset-distance` animation restyles on the main thread every frame, and
 * each doodle's turn holds a compositor layer, so the procession leaves the
 * page while the panel is off screen (see below) rather than running unseen.
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
 * Chillies only: the whole pod, the halved pod and the jalapeño, in all three
 * flavours' colours. The slices, pepper sections and the confetti stars and
 * triangles are out -- the round shapes read as blobs at this size, and a
 * procession of pods says "chilli snack" at a glance.
 */
const POOL = ['chilli-whole', 'chilli-half', 'jalapeno']

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
  spacing = 220,
  duration = 26,
  seed = 7,
  className = '',
}) {
  const reduce = useReducedMotion()
  /*
   * One keyframes name per geometry, not per component. The panel's size can
   * change after first paint -- fonts arriving and reflowing the cards, a
   * resize -- and each change rebuilds the path. Rewriting the keyframes in
   * place under the same name left the doodles already riding on their old
   * timeline while any new ones started fresh, so the procession fell out of
   * step and bunched into part of the loop, leaving the rest of the edge bare.
   * A new name, with the procession remounted under a matching key, restarts
   * every doodle together at its own even share of the loop.
   */
  const geoKey = geometry ? `${geometry.w}x${geometry.h}` : ''
  const name = `jni-ride-${useId().replace(/[^a-zA-Z0-9]/g, '')}-${geoKey}`

  // How many doodles is a question about the perimeter, not about the panel.
  // A fixed count strung round a phone-width box is a necklace; round a
  // desktop one it is a dotted line. Spacing them at a set distance and
  // letting the count follow keeps one density at every width.
  const count = geometry
    ? Math.max(8, Math.min(24, Math.round((2 * geometry.w + 2 * geometry.h) / spacing)))
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
      out.push({
        name,
        flavour: FLAVOURS[i % FLAVOURS.length],
        size: 27 + rnd() * 14,
        // Barely off the edge's own line, so the procession reads as placed by
        // hand rather than stamped along a rail.
        rotate: -4 + rnd() * 8,
      })
    }
    return out
  }, [count, seed])

  // Off screen the procession is taken out of rendering altogether -- a paused
  // animation still keeps its compositor layer, and every doodle's costs each
  // frame everywhere else on the page. It comes back a little before
  // the panel does; the loop has no start to see, so it restarts unnoticed.
  // The panel is watched rather than this box, which vanishes with it.
  const rootRef = useRef(null)
  useEffect(() => {
    const root = rootRef.current
    const panel = root?.parentElement
    if (!panel || reduce) return undefined
    const io = new IntersectionObserver(
      ([e]) => {
        root.style.display = e.isIntersecting ? '' : 'none'
      },
      { rootMargin: '240px 0px' }
    )
    io.observe(panel)
    return () => io.disconnect()
  }, [reduce, geometry])

  if (!geometry) return null
  const path = `path("${geometry.d}")`

  return (
    <div key={geoKey} ref={rootRef} aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      {!reduce && <style>{rideKeyframes(name, geometry)}</style>}
      {items.map((it, i) => {
        const Art = doodleComponents[it.name]
        if (!Art) return null
        const aspect = ASPECT[it.name] || 1
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
