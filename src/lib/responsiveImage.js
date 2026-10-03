import manifest from '../data/responsiveImages.json'

/*
 * The smaller copies tools/build-responsive-images.py cuts of the site's art,
 * as <img> props.
 *
 *   <img {...responsiveImage('/assets/hero/pouch-x.webp', '40vw')} alt="" />
 *
 * gives back `src`, plus -- when the file is in the manifest -- its intrinsic
 * `width` and `height`, so the box is the right shape before the file lands
 * rather than collapsing and shoving the layout when it does, and a `srcSet`
 * of its copies when `sizes` says how wide it is shown. Without `sizes` a
 * srcset would be read as full-viewport width, so it is left off.
 *
 * Anything not in the manifest comes back as just its `src`.
 */
export function responsiveImage(src, sizes) {
  const entry = manifest[src]
  if (!entry) return { src }
  const [width, height, rungs] = entry
  if (!sizes || !rungs.length) return { src, width, height }
  const dot = src.lastIndexOf('.')
  const stem = src.slice(0, dot)
  const ext = src.slice(dot)
  const srcSet = [...rungs.map((w) => `${stem}-${w}w${ext} ${w}w`), `${src} ${width}w`].join(', ')
  return { src, srcSet, sizes, width, height }
}

/** A source's intrinsic height over its width, or null if it is not known. */
export function aspectOf(src) {
  const entry = manifest[src]
  return entry ? entry[1] / entry[0] : null
}
