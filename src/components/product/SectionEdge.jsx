/**
 * The edge between two product-page sections.
 *
 * An earlier version painted each seam as a flat-colour wave laid over the
 * boundary. Every section it sat on is textured -- print grain, the dotted
 * board, the hero's doodle field -- so the painted wave never quite matched,
 * and a hard line showed where the flat paint met the real ground.
 *
 * So nothing is painted now. The section ABOVE the boundary has its own
 * bottom edge cut into the shape with a mask, and hangs down over the
 * section below by the edge's height. Both sides of every seam are the real
 * backgrounds, texture and all, and the only line is the shape itself.
 *
 *   wave  the site's own divider curve -- the one Primitives' WaveDivider
 *         draws, so these match the homepage's seams
 *   torn  ragged card, the odd deeper rip
 */

/* A torn edge, deterministic so it never reshuffles between renders: short
   ragged steps with the odd deeper tear, the way card rips. Filled BELOW the
   rip, in a 1440 x 60 box. The type bands use it for their own split. */
const TORN_POINTS = (() => {
  let seed = 17
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const pts = [[0, 34]]
  for (let x = 0; x <= 1440; x += 18 + rnd() * 26) {
    const deep = rnd() > 0.86
    pts.push([Math.round(x), Math.round(deep ? 6 + rnd() * 10 : 22 + rnd() * 18)])
  }
  pts.push([1440, 30])
  return pts
})()

export const TORN = `M0 60 ${TORN_POINTS.map(([x, y]) => `L${x} ${y}`).join(' ')} L1440 60 Z`

/* The same two shapes, but as the part ABOVE the line -- what stays visible
   of the upper section. */
const KEEP = {
  wave: {
    box: '0 0 1440 90',
    d: 'M0 0 H1440 V48 C1280 18 1120 76 960 42 C800 8 640 76 480 38 C320 0 180 90 0 40 Z',
  },
  torn: {
    box: '0 0 1440 60',
    d: `M0 0 L1440 0 ${[...TORN_POINTS].reverse().map(([x, y]) => `L${x} ${y}`).join(' ')} Z`,
  },
}

const svgUrl = ({ box, d }) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${box}' preserveAspectRatio='none'><path d='${d}' fill='#000'/></svg>`
  )}")`

const MASKS = Object.fromEntries(
  Object.entries(KEEP).map(([k, v]) => {
    const image = `linear-gradient(#000, #000), ${svgUrl(v)}`
    const size = '100% calc(100% - var(--edge-h) + 1px), 100% var(--edge-h)'
    const position = 'top, bottom'
    return [
      k,
      {
        maskImage: image,
        WebkitMaskImage: image,
        maskSize: size,
        WebkitMaskSize: size,
        maskPosition: position,
        WebkitMaskPosition: position,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
      },
    ]
  })
)

/**
 * Wraps the section ABOVE a boundary and cuts its bottom edge.
 *
 * `layer` must count DOWN the page: each cut edge has to paint over the
 * section below it, and a later sibling at the same z-index paints on top.
 */
export default function SectionEdge({ variant = 'wave', layer = 2, className = '', children }) {
  return (
    <div
      className={`jni-edge ${className}`}
      style={{ ...(MASKS[variant] || MASKS.wave), zIndex: layer }}
    >
      {children}
    </div>
  )
}
