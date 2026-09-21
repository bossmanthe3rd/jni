import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ASPECT, doodleComponents, packPalettes } from '../icons/PackDoodles'

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
 * `offset-path` and animates `offset-distance` from 0 to 100%, each started at
 * a negative delay of its own share of the duration. That spaces them evenly
 * around the path for free and loops without a seam -- the doodle leaving the
 * end IS the doodle arriving at the start. Nothing recalculates per frame, and
 * there is no queue of transforms to keep in step.
 *
 * The path is closed and traces the real edge, the wavy bottom lip included:
 * pass the lip's own curve as `wave` and it is reversed and scaled into the
 * loop, so the doodles ride the wave rather than cutting flat beneath it.
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

/**
 * The lip's curve, reversed and scaled into panel coordinates.
 *
 * The loop runs clockwise and reaches the bottom on the right, but the lip is
 * drawn left to right -- so its points are walked backwards, which for cubics
 * means swapping each segment's two control points as well as reversing the
 * order of the segments.
 */
function waveCommands(wave, w, h) {
  const sx = w / wave.vw
  const sy = wave.height / wave.vh
  const top = h - wave.height
  const X = (x) => (x * sx).toFixed(1)
  const Y = (y) => (top + y * sy).toFixed(1)

  const out = []
  for (let i = wave.cubics.length - 1; i >= 0; i -= 1) {
    const [c1x, c1y, c2x, c2y] = wave.cubics[i]
    const prev = i === 0 ? wave.start : wave.cubics[i - 1].slice(4)
    out.push(`C ${X(c2x)} ${Y(c2y)}, ${X(c1x)} ${Y(c1y)}, ${X(prev[0])} ${Y(prev[1])}`)
  }
  return out
}

/** A closed loop: rounded across the top, along the lip at the bottom. */
function edgePath(w, h, r, wave) {
  const radius = Math.min(r, w / 2, h / 2)
  const endY = (y) => h - wave.height + (y * wave.height) / wave.vh
  const rightEnd = wave ? endY(wave.cubics[wave.cubics.length - 1][5]) : h
  const leftEnd = wave ? endY(wave.start[1]) : h

  const d = [
    `M ${radius} 0`,
    `L ${w - radius} 0`,
    `A ${radius} ${radius} 0 0 1 ${w} ${radius}`,
    `L ${w} ${rightEnd.toFixed(1)}`,
  ]
  if (wave) d.push(...waveCommands(wave, w, h))
  else d.push(`L 0 ${h}`)
  d.push(`L 0 ${radius}`)
  d.push(`A ${radius} ${radius} 0 0 1 ${radius} 0`)
  d.push('Z')
  return d.join(' ')
}

export default function DoodleBorder({
  radius = 48,
  spacing = 120,
  duration = 26,
  seed = 7,
  wave = null,
  className = '',
}) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const [box, setBox] = useState(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      // Whole pixels: a path rebuilt on every sub-pixel reflow would restart
      // every animation mid-travel.
      setBox({ w: Math.round(width), h: Math.round(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // How many doodles is a question about the perimeter, not about the panel.
  // A fixed count strung round a phone-width box is a necklace; round a
  // desktop one it is a dotted line. Spacing them at a set distance and
  // letting the count follow keeps one density at every width.
  const count = box
    ? Math.max(12, Math.min(44, Math.round((2 * box.w + 2 * box.h) / spacing)))
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
        // Barely off true. The pods are drawn standing up and should read that
        // way -- at thirty degrees they looked spilled rather than placed.
        rotate: -7 + rnd() * 14,
      })
    }
    return out
  }, [count, seed])

  const path = box ? `path("${edgePath(box.w, box.h, radius, wave)}")` : null

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
    >
      {path &&
        items.map((it, i) => {
          const Art = doodleComponents[it.name] || EXTRA_COMPONENTS[it.name]
          if (!Art) return null
          const aspect = ASPECT[it.name] || CONFETTI_ASPECT[it.name] || 1
          const share = i / items.length
          return (
            <div
              key={i}
              className="absolute left-0 top-0"
              style={{
                width: `${it.size}px`,
                height: `${it.size / aspect}px`,
                offsetPath: path,
                offsetRotate: '0deg',
                offsetDistance: `${share * 100}%`,
                willChange: 'offset-distance',
                ...(reduce
                  ? null
                  : {
                      animation: `jni-border-drift ${duration}s linear infinite`,
                      animationDelay: `${-share * duration}s`,
                    }),
              }}
            >
              <div style={{ transform: `rotate(${it.rotate}deg)` }}>
                <Art palette={packPalettes[it.flavour]} className="jni-doodle-art" />
              </div>
            </div>
          )
        })}
    </div>
  )
}
