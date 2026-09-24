import { WaveDivider } from '../ui/Primitives'

/**
 * The edge between two product-page sections.
 *
 * Every section used to stop on a ruler-straight line, which is most of why
 * the page read as a stack of boxes. A seam is drawn in one section's colour
 * and laid over the other's edge, so the two meet along a wave or a torn
 * paper line instead.
 *
 *   rise  the default: the NEXT section's colour pushing up into the one
 *         above -- place it just before that section
 *   hang  the PREVIOUS section's colour dripping down into the next -- place
 *         it just after that section
 *
 * The wave is Primitives' WaveDivider, the site's own divider, so these match
 * the seams the homepage already uses.
 */

/* A torn edge, deterministic so it never reshuffles between renders: short
   ragged steps with the odd deeper tear, the way card rips. */
const TORN = (() => {
  let seed = 17
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const pts = ['M0 60', 'L0 34']
  for (let x = 0; x <= 1440; x += 18 + rnd() * 26) {
    const deep = rnd() > 0.86
    pts.push(`L${x.toFixed(0)} ${(deep ? 6 + rnd() * 10 : 22 + rnd() * 18).toFixed(0)}`)
  }
  pts.push('L1440 30', 'L1440 60', 'Z')
  return pts.join(' ')
})()

export default function SectionSeam({ fill, variant = 'wave', hang = false }) {
  return (
    <div className="jni-seam" data-hang={hang ? '' : undefined} aria-hidden="true">
      {variant === 'torn' ? (
        <svg
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          style={hang ? { transform: 'scaleY(-1)' } : undefined}
        >
          <path d={TORN} fill={fill} />
        </svg>
      ) : (
        <WaveDivider fill={fill} flip={hang} />
      )}
    </div>
  )
}
