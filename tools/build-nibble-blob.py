#!/usr/bin/env python3
"""Trace the JUST NIBBLE IT badge blob off the owner's drawn shape.

Every FLIPO's pack hangs its logo in a dark blob that drops from the top seal
and ends in a row of fat rounded lobes. The header used to be a full-bleed
strip, which is the one shape the packaging never uses. This lifts the
silhouette so the header can wear it.

Source is reference/drive/website/Nibble blob.png: the owner's own drawing of
the badge, a single flat shape on a transparent ground. An earlier version of
this script dug the blob out of the jalapeno pouch photo by hue; the drawing
replaces that, so isolation is just the alpha channel.

The drawing is already cut flat along its top edge, where the header's top
edge hangs it, so TOP_CUT is the first row -- the trace is of the sides and
the lobes, and the top is closed flat.

Also emitted, measured off the same artwork:

  * the blob's own centre -- halfway down, midway between the edges at that
    height -- the one point every face the badge shows is centred on, so the
    logo and the words that replace it all land on the same spot and nothing
    jumps on a swap;
  * the blob's width, row by row, so the page can fit each face to the
    largest box of its own proportions that the silhouette has room for.

Run `python tools/build-nibble-blob.py` from the repo root. Outputs:
  src/components/ui/NibbleBlob.jsx
"""

import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import measure

SOURCE = os.path.join("reference", "drive", "website", "Nibble blob.png")

# Alpha above this is shape. The edge is anti-aliased; the midpoint traces it.
ALPHA_CUT = 127

# Where to cut the flat top, in source rows. The drawing is flat from row 0.
TOP_CUT = 0

# Rows in the emitted width profile. One per ~1% of the badge's height is finer
# than any lobe and still reads in a diff.
PROFILE_ROWS = 100

# Outline samples. Resolves every lobe and still emits a path short enough to
# read in a diff.
SAMPLES = 140

# Arc-length smoothing window, in samples. Just enough to take the pixel steps
# off the mask edge; any more and the valleys between lobes fill in.
SMOOTH = 1

# Emitted viewBox width. Height follows the traced aspect.
VIEW_WIDTH = 1000


def isolate(alpha):
    """The blob, as a boolean mask: the largest opaque island, holes filled."""
    mask = alpha > ALPHA_CUT
    labels, n = ndi.label(mask)
    if n == 0:
        raise SystemExit("no opaque pixels in SOURCE")
    sizes = ndi.sum(mask, labels, range(1, n + 1))
    return ndi.binary_fill_holes(labels == (int(np.argmax(sizes)) + 1))


def outline(blob):
    """The blob's boundary below TOP_CUT, as an open arc of (x, y) points.

    find_contours wants the mask padded, otherwise a shape touching the array
    edge traces open and the walk below has nothing to cut.
    """
    padded = np.pad(blob.astype(float), 1)
    contours = measure.find_contours(padded, 0.5)
    contour = max(contours, key=len) - 1.0
    pts = np.column_stack([contour[:, 1], contour[:, 0]])  # (x, y)

    # The cut crosses the silhouette exactly twice, so the kept points form one
    # contiguous arc -- but the contour's own start index lands anywhere on the
    # ring. Roll it to a point above the cut first, and the arc comes out whole
    # instead of split across the seam.
    above = np.nonzero(pts[:, 1] < TOP_CUT)[0]
    if len(above) == 0:
        raise SystemExit("TOP_CUT is above the blob -- nothing to trim")
    pts = np.roll(pts, -above[0], axis=0)
    keep = np.nonzero(pts[:, 1] >= TOP_CUT)[0]
    arc = pts[keep[0]:keep[-1] + 1]

    # find_contours walks counter-clockwise in array coordinates, which is
    # clockwise on screen. Either winding fills the same, but left-to-right
    # keeps the emitted path readable next to the measurements above it.
    if arc[0, 0] > arc[-1, 0]:
        arc = arc[::-1]
    return arc


def resample(arc, n):
    """n points spaced evenly along the arc, endpoints preserved."""
    steps = np.linalg.norm(np.diff(arc, axis=0), axis=1)
    dist = np.concatenate([[0.0], np.cumsum(steps)])
    want = np.linspace(0.0, dist[-1], n)
    return np.column_stack([np.interp(want, dist, arc[:, i]) for i in (0, 1)])


def smooth(arc, window):
    """Moving average along the arc, with the two ends pinned.

    The ends sit on the flat top edge. Letting the filter drag them inwards
    would open a wedge of daylight between the badge and the header's top.
    """
    if window < 1:
        return arc
    kernel = np.ones(2 * window + 1) / (2 * window + 1)
    out = arc.copy()
    for i in (0, 1):
        padded = np.pad(arc[:, i], window, mode="reflect")
        out[:, i] = np.convolve(padded, kernel, mode="valid")
    out[0], out[-1] = arc[0], arc[-1]
    return out


def to_path(arc, prec=1):
    """Open Catmull-Rom through arc: the traced edge on its own."""
    f = "%%.%df" % prec
    n = len(arc)
    out = [("M" + f + "," + f) % tuple(arc[0])]
    for i in range(n - 1):
        p0 = arc[max(i - 1, 0)]
        p1, p2 = arc[i], arc[i + 1]
        p3 = arc[min(i + 2, n - 1)]
        c1 = p1 + (p2 - p0) / 6.0
        c2 = p2 - (p3 - p1) / 6.0
        out.append(("C" + ",".join([f] * 6)) % (c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]))
    return " ".join(out)


def close_flat(outline, arc, top, prec=1):
    """The same edge, shut along the flat top so it can be filled."""
    f = "%%.%df" % prec
    return outline + (" L" + f + "," + f) % (arc[-1][0], top) +         (" L" + f + "," + f) % (arc[0][0], top) + "Z"


def profile(arc, height, rows):
    """[y, left, right] across the closed shape, in viewBox units.

    Read off the same arc the path is drawn from, not the mask, so a face
    fitted against it lines up with the edge people actually see.
    """
    ring = np.vstack([arc, [[arc[-1][0], 0.0], [arc[0][0], 0.0]]])
    a, b = ring, np.roll(ring, -1, axis=0)
    out = []
    for y in np.linspace(0.0, height, rows):
        # Half-open, so a vertex on the scan line is counted once.
        cross = ((a[:, 1] <= y) & (b[:, 1] > y)) | ((b[:, 1] <= y) & (a[:, 1] > y))
        if not cross.any():
            continue
        t = (y - a[cross, 1]) / (b[cross, 1] - a[cross, 1])
        xs = a[cross, 0] + t * (b[cross, 0] - a[cross, 0])
        out.append((round(y, 1), round(xs.min(), 1), round(xs.max(), 1)))
    return out


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = os.path.join(root, SOURCE)
    alpha = np.asarray(Image.open(src).convert("RGBA"))[..., 3]

    blob = isolate(alpha)
    arc = smooth(resample(outline(blob), SAMPLES), SMOOTH)

    # Normalise: traced x/y -> viewBox, with the flat top at y = 0.
    bx0, bx1 = arc[:, 0].min(), arc[:, 0].max()
    by1 = arc[:, 1].max()
    scale = VIEW_WIDTH / (bx1 - bx0)
    height = (by1 - TOP_CUT) * scale
    arc = (arc - [bx0, TOP_CUT]) * scale
    edge = to_path(arc)
    path = close_flat(edge, arc, 0.0)

    rows = profile(arc, height, PROFILE_ROWS)
    mid = min(rows, key=lambda r: abs(r[0] - height / 2))
    centre = ((mid[1] + mid[2]) / 2, height / 2)
    rows_js = ",\n".join("  [%.1f, %.1f, %.1f]" % r for r in rows)

    view = "0 0 %d %.1f" % (VIEW_WIDTH, height)
    body = f'''// The JUST NIBBLE IT badge blob, traced from the owner's drawing
// ({SOURCE.replace(os.sep, "/")}) by tools/build-nibble-blob.py.
// Regenerate with the script rather than editing the path.
//
// The shape is flat along the top, the way the pack's blob is cut off by the
// pouch's seal. Hang it from the header's top edge
// and the cut disappears, leaving the lobes to break the header's lower edge --
// which is the whole point of it: the header stops being a continuous strip.

export const NIBBLE_BLOB_VIEWBOX = '{view}'

export const NIBBLE_BLOB_PATH =
  '{path}'

/**
 * The traced edge on its own, unclosed -- what to stroke. Stroking
 * NIBBLE_BLOB_PATH instead would draw a line along the flat top and turn the
 * badge into a closed outline, when the point of that edge is that the shape
 * carries on past it.
 */
export const NIBBLE_BLOB_OUTLINE =
  '{edge}'

export const NIBBLE_BLOB_ASPECT = {VIEW_WIDTH / height:.4f}

/**
 * The blob's own centre, in viewBox units: halfway down, midway between the
 * edges at that height. Every face the badge shows is centred here, so the
 * logo and the words that swap in all land on one spot instead of each
 * finding its own.
 */
export const NIBBLE_BLOB_CENTRE = {{ x: {centre[0]:.1f}, y: {centre[1]:.1f} }}

/**
 * The blob's width row by row: [y, left edge, right edge], in viewBox units,
 * read off the same trace the path is drawn from.
 */
export const NIBBLE_BLOB_PROFILE = [
{rows_js}
]

const [, , VIEW_W, VIEW_H] = NIBBLE_BLOB_VIEWBOX.split(' ').map(Number)

/**
 * The largest box of a given aspect (width / height) that fits inside the
 * blob centred on NIBBLE_BLOB_CENTRE, as percentages of the blob -- ready to
 * drop into left / top / width / height.
 *
 * `inset` is the clear space kept all round, as a fraction of the blob's
 * width. `maxHeight` caps the box as a fraction of the blob's height, for a
 * face short enough that filling the width would blow it up past its
 * neighbours.
 *
 * The centre is fixed rather than solved for. Letting each face slide to
 * wherever it fits biggest buys a few per cent of size and costs the thing
 * that makes the rotation look deliberate: every face landing on one spot.
 */
export function fitInBlob(aspect, {{ inset = 0.06, maxHeight = 1 }} = {{}}) {{
  const pad = inset * VIEW_W
  const {{ x: cx, y: cy }} = NIBBLE_BLOB_CENTRE

  const fits = (h) => {{
    const half = (aspect * h) / 2 + pad
    const top = cy - h / 2 - pad
    const bottom = cy + h / 2 + pad
    // The flat top is the header's own edge, not the blob's -- a face may not
    // run up into it any more than it may run off the lobes.
    if (top < 0 || bottom > VIEW_H) return false
    return NIBBLE_BLOB_PROFILE.every(
      ([y, left, right]) => y < top || y > bottom || (left <= cx - half && right >= cx + half),
    )
  }}

  let lo = 0
  let hi = VIEW_H
  for (let i = 0; i < 24; i++) {{
    const mid = (lo + hi) / 2
    if (fits(mid)) lo = mid
    else hi = mid
  }}

  const h = Math.min(lo, maxHeight * VIEW_H)
  const w = aspect * h
  return {{
    left: `${{((cx - w / 2) / VIEW_W) * 100}}%`,
    top: `${{((cy - h / 2) / VIEW_H) * 100}}%`,
    width: `${{(w / VIEW_W) * 100}}%`,
    height: `${{(h / VIEW_H) * 100}}%`,
  }}
}}

/**
 * The blob, with its children laid over the whole of it. Children place
 * themselves with fitInBlob -- the blob does not guess a slot for them,
 * because the right slot depends on the shape of what goes in it.
 *
 * Give it a width; the aspect ratio comes from the trace, so the lobes never
 * stretch.
 *
 * `stroke` is for the pages whose own background is as dark as the badge: in
 * cream it disappears, over anything else it cuts the silhouette back out.
 */
export function NibbleBlob({{
  fill = 'currentColor',
  stroke,
  strokeWidth = 2.5,
  className = '',
  style,
  children,
}}) {{
  return (
    <span
      className={{`relative block ${{className}}`}}
      style={{{{ aspectRatio: NIBBLE_BLOB_ASPECT, ...style }}}}
    >
      <svg
        viewBox={{NIBBLE_BLOB_VIEWBOX}}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        // The edge sits on the viewBox, so half of any stroke falls outside it.
        style={{{{ overflow: 'visible' }}}}
        aria-hidden="true"
      >
        <path d={{NIBBLE_BLOB_PATH}} fill={{fill}} />
        {{stroke && (
          <path
            d={{NIBBLE_BLOB_OUTLINE}}
            fill="none"
            stroke={{stroke}}
            strokeWidth={{strokeWidth}}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}}
      </svg>
      <span className="absolute inset-0">{{children}}</span>
    </span>
  )
}}
'''

    out = os.path.join(root, "src", "components", "ui", "NibbleBlob.jsx")
    with open(out, "w", encoding="utf-8") as f:
        f.write(body)

    print("traced %d samples -> src/components/ui/NibbleBlob.jsx" % SAMPLES)
    print("  viewBox   %s" % view)
    print("  path      %d chars" % len(path))
    print("  centre    %.1f, %.1f" % centre)
    print("  profile   %d rows" % len(rows))


if __name__ == "__main__":
    main()
