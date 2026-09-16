import { blobClip, blobShape } from './BlobShapes'

/*
 * The pack's content puddle, as a container.
 *
 * Every pouch sets its type inside a wobbly organic field on a doodle ground.
 * Swapping the site's rounded rectangles for this shape is the change that most
 * makes a page look like the packaging.
 *
 * Shapes come from BlobShapes.jsx as objectBoundingBox clip paths, so one path
 * fits any box. Two things follow from clipping rather than drawing a border:
 *
 * - A clip cuts the border off too, so `keyline` is layered instead: an outer
 *   element in the line colour with an inset copy of the same shape on top.
 *   The two are normalised to their own boxes, so the gap breathes slightly
 *   around the edge rather than being a mechanically even stroke -- which is
 *   what the hand-drawn packs do anyway.
 * - The corners of the box are outside the shape, so padding has to be generous
 *   or content collides with the curve. `pad` defaults accordingly; keep it.
 */

/*
 * WHAT THIS SHAPE CAN AND CANNOT HOLD -- read before using it.
 *
 * A puddle is round, so its width collapses toward the top and bottom edges.
 * Measured off the generated paths, the inward pinch as a share of panel width:
 *
 *        height:    2%    6%   12%   20%  35-65%   80%   88%   94%   98%
 *        card1    29%   22%   15%    6%     <6%    7%   12%   21%   43%
 *        wide1    24%   11%    4%    2%     <3%    2%    5%   10%   18%
 *
 * So the usable region is the middle band, roughly 15%-85% of the height. Put
 * anything full-width nearer an edge than that and the shape cuts its corners
 * off: a photo flush to the top loses its top corners, a full-width button at
 * the bottom loses both ends.
 *
 * Use a puddle for: text and small inline elements that sit inside the middle
 * band, with vertical padding of at least ~15% of the panel's height.
 *
 * Do NOT use a puddle for: cards whose content reaches the top or bottom edge
 * -- image-topped product cards, cards ending in a full-width button. Those
 * want the brand's other authentic device, the keyline plus hard offset shadow
 * (border-[4px] border-ink shadow-doodle-lg), which is what the testimonial and
 * combo cards use.
 *
 * `wide` is the most forgiving shape; prefer it whenever content must come
 * anywhere near an edge.
 */
const PAD = {
  none: '',
  sm: 'px-8 py-6 sm:px-10 sm:py-7',
  md: 'px-10 py-8 sm:px-14 sm:py-10',
  lg: 'px-12 py-10 sm:px-16 sm:py-14',
}

export default function BlobPanel({
  shape,
  role = 'card',
  index = 0,
  bg = '#fbf6d0',
  keyline = null,
  keylineWidth = 4,
  pad = 'md',
  className = '',
  style,
  children,
  ...rest
}) {
  const name = shape || blobShape(index, role)
  const clip = blobClip(name)
  const padding = PAD[pad] ?? PAD.md

  if (!keyline) {
    return (
      <div
        className={`relative ${padding} ${className}`}
        style={{ ...clip, background: bg, ...style }}
        {...rest}
      >
        {children}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ ...clip, background: keyline, ...style }} {...rest}>
      <div
        aria-hidden="true"
        className="absolute"
        style={{ ...clip, background: bg, inset: keylineWidth }}
      />
      <div className={`relative ${padding}`}>{children}</div>
    </div>
  )
}

/**
 * The same shape as an image mask. Crops a photo to the puddle instead of a
 * rectangle -- use for product shots and lifestyle images.
 */
export function BlobImage({ src, alt, shape, role = 'stamp', index = 0, className = '', ...rest }) {
  const name = shape || blobShape(index, role)
  return (
    <img
      src={src}
      alt={alt}
      className={`block h-full w-full object-cover ${className}`}
      style={blobClip(name)}
      {...rest}
    />
  )
}
