import { doodleComponents, packPalettes } from '../icons/PackDoodles'

/*
 * How hot this flavour is, drawn with the pack's own chilli.
 *
 * The brand already has a heat ramp -- Sweet, Fresh, Big -- and the homepage
 * flavour stage presents it as a rising scale. The product page, which is where
 * someone actually decides, said nothing about heat at all. This puts it back.
 *
 * The level is read off `product.flavor` rather than a new data field, so there
 * is one source of truth and no catalogue edit needed.
 */

const LEVELS = {
  'Sweet Heat': 1,
  'Fresh Heat': 2,
  'Big Heat': 3,
}
const TOTAL = 3

export function heatLevel(product) {
  return LEVELS[product?.flavor] ?? 0
}

/**
 * `litFill` overrides the chilli body colour for callers that draw the meter on
 * the flavour's own panel. Two of the three pack palettes are a shade of their
 * panel (peri #c8102e on #7a1028 is 1.85:1), so on those pages the lit chillies
 * dissolved into the background and the scale showed nothing.
 */
export default function HeatMeter({ product, flavour, className = '', litFill }) {
  const level = heatLevel(product)
  if (!level) return null

  const palette = packPalettes[flavour] || packPalettes['jalapeno-kick']
  const Chilli = doodleComponents['chilli-whole']
  const label = product.flavor

  // Lit chillies take the flavour's own ink; unlit ones drop to a faint wash of
  // it, so the scale reads as one object at two intensities rather than two
  // unrelated colours.
  const lit = {
    fill: litFill || palette.fill,
    stem: palette.stem,
    line: palette.line,
    seed: palette.seed,
  }
  const unlit = { fill: '#ffffff22', stem: '#ffffff1a', line: '#ffffff33', seed: '#ffffff1a' }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="flex items-end gap-1"
        role="img"
        aria-label={`Heat level ${level} of ${TOTAL}: ${label}`}
      >
        {Array.from({ length: TOTAL }, (_, i) => (
          <span
            key={i}
            className="block w-3 shrink-0 sm:w-3.5"
            // A rising scale: each chilli a little taller than the last, so the
            // ramp is legible even before you read the colour.
            style={{ transform: `translateY(${(TOTAL - 1 - i) * 1.5}px)` }}
          >
            <Chilli palette={i < level ? lit : unlit} className="jni-doodle-art" />
          </span>
        ))}
      </div>
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-foam/70 sm:text-xs">
        {label}
      </span>
    </div>
  )
}
