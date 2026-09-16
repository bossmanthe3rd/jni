import { useMemo, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { doodleComponents, packPalettes } from '../icons/PackDoodles'

/*
 * The pack's doodle ground, for the web.
 *
 * No ground on a FLIPO's pouch is ever a flat fill -- it is always a field of
 * chilli doodles, bleeding off every edge. The site's sections are flat colour
 * blocks, which is the main reason they read as generic. This fills them.
 *
 * The one real judgement here is contrast. On the pouches the doodles are loud:
 * bright lime on dark green, at full strength. Reproduced literally behind body
 * copy that would be unreadable, so the doodles are mixed toward the section's
 * own ground colour and `subtle` is the default. Use `bold` only where nothing
 * has to be read on top -- a full-bleed band, or behind a puddle that carries
 * the text itself.
 *
 * Placement is seeded, so a given section's field is identical on every render
 * and every reload. Nothing here shifts under the reader.
 *
 * Host requirement: the section must be `relative isolate`. The field sits at
 * -z-10 so it paints above the section's own background but below every piece
 * of content, without each caller having to wrap its children in a positioned
 * layer. `isolate` is what makes that safe -- it gives the section its own
 * stacking context, so the negative z-index resolves against this section
 * rather than dropping behind an ancestor's background.
 */

/** Deterministic PRNG. Same seed, same field, forever. */
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16
  )
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Mix `hex` toward `toward` by t (0 = unchanged, 1 = fully the ground). */
function mix(hex, toward, t) {
  const a = hexToRgb(hex)
  const b = hexToRgb(toward)
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

// How far each ink is pulled toward the ground. Seeds and keylines keep a
// little more of themselves than the big fills do, so the doodles still read as
// drawn rather than dissolving into a wash.
const INTENSITY = {
  subtle: { fill: 0.84, stem: 0.88, line: 0.8, seed: 0.86 },
  medium: { fill: 0.62, stem: 0.7, line: 0.56, seed: 0.64 },
  bold: { fill: 0.16, stem: 0.22, line: 0.1, seed: 0.18 },
}

// Weighted like the packs: a few big characters, plenty of small punctuation.
const PICKS = [
  ['seed', 5],
  ['chilli-slice', 3],
  ['pepper-section', 2],
  ['chilli-whole', 2],
  ['chilli-half', 2],
  ['jalapeno', 2],
]
const POOL = PICKS.flatMap(([name, n]) => Array(n).fill(name))

// Big doodles sit furthest back and drift least, so the field gains depth
// without anything racing the content.
const LAYERS = [
  { depth: 0.35, scale: 1 },
  { depth: 0.7, scale: 0.78 },
  { depth: 1, scale: 0.58 },
]

export default function DoodleField({
  flavour = 'jalapeno-kick',
  ground = '#fbf6d0',
  intensity = 'subtle',
  count = 14,
  seed = 1,
  drift = true,
  className = '',
}) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const palette = useMemo(() => {
    const base = packPalettes[flavour] || packPalettes['jalapeno-kick']
    const t = INTENSITY[intensity] || INTENSITY.subtle
    return {
      fill: mix(base.fill, ground, t.fill),
      stem: mix(base.stem, ground, t.stem),
      line: mix(base.line, ground, t.line),
      seed: mix(base.seed, ground, t.seed),
    }
  }, [flavour, ground, intensity])

  const items = useMemo(() => {
    const rnd = mulberry32(seed * 2654435761)

    // Stratified placement, not plain random. Uniform random clumps -- you get
    // three doodles piled in one corner and bare ground everywhere else. One
    // doodle per jittered grid cell fills a ground evenly, which is what the
    // packs actually look like.
    const cols = Math.max(3, Math.ceil(Math.sqrt(count * 1.7)))
    const rows = Math.max(2, Math.ceil(count / cols))
    const cells = []
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) cells.push([c, r])
    }
    // Shuffle so which cells stay empty varies with the seed.
    for (let i = cells.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rnd() * (i + 1))
      ;[cells[i], cells[j]] = [cells[j], cells[i]]
    }

    // The field should look cropped out of something larger, so it runs past
    // every edge rather than being arranged inside the box.
    const spanX = 118
    const spanY = 116
    return cells.slice(0, count).map(([c, r], i) => {
      const name = POOL[Math.floor(rnd() * POOL.length)]
      const layer = i % LAYERS.length
      const big = name !== 'seed'
      return {
        key: i,
        name,
        layer,
        left: -9 + ((c + 0.15 + rnd() * 0.7) / cols) * spanX,
        top: -8 + ((r + 0.15 + rnd() * 0.7) / rows) * spanY,
        rotate: -50 + rnd() * 100,
        size: (big ? 4.6 + rnd() * 3.6 : 1.4 + rnd() * 1.2) * LAYERS[layer].scale,
        flip: rnd() > 0.5,
      }
    })
  }, [count, seed])

  const moving = drift && !reduced

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}
    >
      {LAYERS.map((layer, li) => (
        <Layer
          key={li}
          progress={scrollYProgress}
          depth={moving ? layer.depth : 0}
          items={items.filter((it) => it.layer === li)}
          palette={palette}
        />
      ))}
    </div>
  )
}

function Layer({ progress, depth, items, palette }) {
  // One transform per layer rather than per doodle: three animated values
  // instead of fourteen, for the same parallax.
  const y = useTransform(progress, [0, 1], [depth * 44, depth * -44])
  return (
    <motion.div className="absolute inset-0" style={{ y: depth ? y : 0 }}>
      {items.map((it) => {
        const Art = doodleComponents[it.name]
        if (!Art) return null
        return (
          <div
            key={it.key}
            className="absolute"
            style={{
              left: `${it.left}%`,
              top: `${it.top}%`,
              width: `${it.size}vw`,
              transform: `translate(-50%, -50%) rotate(${it.rotate}deg)${
                it.flip ? ' scaleX(-1)' : ''
              }`,
            }}
          >
            <Art palette={palette} className="jni-doodle-art" />
          </div>
        )
      })}
    </motion.div>
  )
}
