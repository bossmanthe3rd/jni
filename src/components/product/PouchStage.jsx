import { motion } from 'framer-motion'
import HeatMeter from './HeatMeter'
import { responsiveImage } from '../../lib/responsiveImage'
import '../../styles/pouch-stage.css'

/**
 * The stage a product page opens on: grounds torn into bands, print grain over
 * them, the pack's doodles faded into each band, and cut-out pouches standing
 * up across the seams.
 *
 * It started as the combo page's hero, where the three bands are the three
 * flavours' grounds. A flavour page uses the same stage in three tones of its
 * own pouch, so both kinds of product page open on the same picture.
 *
 *   bands    left to right: { key, ground, doodles: [src, src], heat?, pouches }
 *            `heat` is a product for the band's HeatMeter; `pouches` are
 *            { key, src } and stand back to front, the second one behind.
 *   solo     one pouch, stood up bigger, in the middle band
 *   delay    seconds before the first pouch drops in (the host may land first)
 *   still    no drop at all -- for copies that are not the one on show
 */

/* A torn left edge for the second and third bands, as a clip-path. Seeded, so
   it never reshuffles between renders; x runs 0-7% of the band's width. */
function tornEdge(seed) {
  let s = seed
  const rnd = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  const pts = []
  for (let y = 0; y <= 100; y += 3 + rnd() * 4) {
    const deep = rnd() > 0.85
    pts.push(`${(deep ? 6 + rnd() * 2 : 1 + rnd() * 3).toFixed(1)}% ${Math.min(100, y).toFixed(1)}%`)
  }
  pts.push('2% 100%')
  return `polygon(100% 0, ${pts.join(', ')}, 100% 100%)`
}
const EDGES = [null, tornEdge(29), tornEdge(71)]
const TILTS = [-7, 1.5, 8]

/** The cut-out pouch, background removed, that the stage stands up. */
export const pouchCutout = (slug) => `/assets/hero/pouch-${slug}.webp`

/** The stage in miniature, for its thumbnail: one stripe per band. */
export function StageSwatch({ grounds }) {
  return (
    <span className="jni-stage-swatch" aria-hidden="true">
      {grounds.map((ground, i) => (
        <i key={i} style={{ backgroundColor: ground }} />
      ))}
    </span>
  )
}

export default function PouchStage({ bands, sizes, solo = false, delay = 0.18, still = false, reduce }) {
  const drop = !(reduce || still)
  return (
    <div className="jni-stage-bands" data-solo={solo ? '' : undefined}>
      {bands.map((band, i) => {
        const count = band.pouches?.length ?? 0
        const [doodleA, doodleB = doodleA] = band.doodles || []
        return (
          <div
            key={band.key}
            className="jni-stage-band"
            data-pair={count > 1 ? '' : undefined}
            style={{ '--i': i, '--n': bands.length }}
          >
            <div
              className="jni-stage-band-fill jni-grain"
              style={{ backgroundColor: band.ground, clipPath: EDGES[i] || undefined }}
            >
              {doodleA && <img src={doodleA} alt="" className="jni-stage-band-doodle d-a" />}
              {doodleB && <img src={doodleB} alt="" className="jni-stage-band-doodle d-b" />}
              {band.heat && (
                <HeatMeter
                  product={band.heat}
                  flavour={band.heat.slug}
                  className="jni-stage-band-heat"
                  labelClassName="text-foam/80"
                />
              )}
            </div>

            {/* Back to front: the second pouch of a pair stands behind. */}
            {(band.pouches || [])
              .map((pouch, copy) => ({ pouch, copy }))
              .reverse()
              .map(({ pouch, copy }) => (
                <motion.img
                  key={pouch.key}
                  {...responsiveImage(pouch.src, sizes)}
                  alt=""
                  className="jni-stage-pouch"
                  data-back={copy > 0 ? '' : undefined}
                  style={{ transformOrigin: '50% 100%' }}
                  initial={drop ? { y: '70%', opacity: 0, rotate: 0, scaleY: 1 } : false}
                  animate={{
                    y: 0,
                    opacity: 1,
                    rotate: (band.tilt ?? TILTS[i % TILTS.length]) + (copy ? 7 : 0),
                    scaleY: drop ? [1, 1, 0.94, 1.02, 1] : 1,
                  }}
                  transition={{
                    delay: delay + i * 0.12 + (copy ? 0 : 0.06),
                    duration: 0.62,
                    ease: [0.3, 0.9, 0.35, 1],
                    scaleY: { duration: 0.62, times: [0, 0.55, 0.72, 0.88, 1] },
                  }}
                />
              ))}
          </div>
        )
      })}
    </div>
  )
}
