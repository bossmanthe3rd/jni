#!/usr/bin/env python3
"""Trace the JUST NIBBLE IT badge blob straight off the pouch artwork.

Every FLIPO's pack hangs its logo in a dark blob that drops from the top seal
and ends in a row of fat rounded lobes. The header used to be a full-bleed
strip, which is the one shape the packaging never uses. This lifts the real
silhouette so the header can wear it.

Source is the owner's hero artwork, reference/drive/website/01-Jalapeno kick.png
-- the jalapeno pack is the one whose blob reads cleanly, because its dark green
sits on a mid-green ground rather than the near-black the other two use.

Isolation leans on hue, not darkness. The pack is full of dark greens: doodle
strokes, the shaded right-hand curve of the pouch, the mascot outlines. What
separates the blob is that it is a *teal*-leaning green -- B/G around 0.76 --
where every other dark green on the pack sits near 0.55. Threshold on that
ratio, erode to snap the hairline doodle strokes that bridge the blob to its
neighbours, keep the largest island, then dilate back.

The blob has no top edge to trace: the pouch's seal already cuts it off. So
the trace is of the sides and the lobes -- the part the pack actually draws --
and the top is closed flat, which is what lets the header hang the badge off
its own top edge the way the pouch hangs it off the seal.

Where that flat cut lands is ours to pick, since the pack's own cut is just
wherever the pouch ended. TOP_CUT sits low enough to skip the dead straight
run behind the zip and leave the wordmark centred in what remains.

Also emitted: where the wordmark sits inside the blob, measured from the same
artwork, so the header does not have to eyeball the logo's place in the badge.

Run `python tools/build-nibble-blob.py` from the repo root. Outputs:
  src/components/ui/NibbleBlob.jsx
"""

import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import measure

SOURCE = os.path.join("reference", "drive", "website", "01-Jalapeno kick.png")

# Window around the pack's top third. Generous -- the isolation does the work,
# this only keeps the rest of the artboard out of the histogram.
WINDOW = (5300, 850, 6900, 2200)

# Blob green is the teal-leaning one. See the docstring.
MAX_RED = 70
GREEN_RANGE = (35, 170)
MIN_BLUE_OVER_GREEN = 0.66

# Radius that snaps the doodle strokes bridging the blob to its neighbours,
# without eating a lobe. The strokes are ~12px at this resolution; the lobes
# are ~300px across.
BRIDGE = 25

# Where to cut the flat top, in source rows. Above ~500 the silhouette is two
# near-straight verticals behind the zip; starting here keeps the lobes and the
# flare that carry the shape, and centres the wordmark in the badge.
TOP_CUT = 470

# Outline samples. The silhouette carries about a dozen lobes; this resolves
# every one of them and still emits a path short enough to read in a diff.
SAMPLES = 60

# Arc-length smoothing window, in samples. The mask edge is pixel-jagged and
# the pack is a photograph of a matte pouch, so the raw trace has grain on it.
SMOOTH = 2

# Emitted viewBox width. Height follows the traced aspect.
VIEW_WIDTH = 1000


def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def isolate(rgb):
    """The blob, as a boolean mask in window coordinates."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lo, hi = GREEN_RANGE
    mask = (r < MAX_RED) & (g > lo) & (g < hi)
    mask &= b / np.maximum(g, 1) > MIN_BLUE_OVER_GREEN
    mask = ndi.binary_closing(mask, disk(6))

    core = ndi.binary_erosion(mask, disk(BRIDGE))
    labels, count = ndi.label(core)
    if count == 0:
        raise SystemExit("no blob survived erosion -- check WINDOW / thresholds")
    sizes = ndi.sum(core, labels, range(1, count + 1))
    core = labels == (1 + int(np.argmax(sizes)))

    blob = ndi.binary_dilation(core, disk(BRIDGE)) & mask
    blob = ndi.binary_fill_holes(blob)
    return ndi.binary_closing(blob, disk(12))


def wordmark_box(rgb, blob):
    """Bounding box of the white logo sitting inside the blob."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    white = blob & (r > 175) & (g > 175) & (b > 165)
    white = ndi.binary_opening(white, np.ones((5, 5)))
    labels, count = ndi.label(white)
    sizes = ndi.sum(white, labels, range(1, count + 1))
    # Letters only. The pouch's specular highlights read white too, but they
    # come in as slivers next to a 400px-plus glyph.
    keep = [i + 1 for i, s in enumerate(sizes) if s > 400]
    ys, xs = np.nonzero(np.isin(labels, keep))
    return xs.min(), ys.min(), xs.max(), ys.max()


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


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = os.path.join(root, SOURCE)
    x0, y0, x1, y1 = WINDOW
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(int)[y0:y1, x0:x1]

    blob = isolate(rgb)
    wx0, wy0, wx1, wy1 = wordmark_box(rgb, blob)
    arc = smooth(resample(outline(blob), SAMPLES), SMOOTH)

    # Normalise: traced x/y -> viewBox, with the flat top at y = 0.
    bx0, bx1 = arc[:, 0].min(), arc[:, 0].max()
    by1 = arc[:, 1].max()
    scale = VIEW_WIDTH / (bx1 - bx0)
    height = (by1 - TOP_CUT) * scale
    arc = (arc - [bx0, TOP_CUT]) * scale
    edge = to_path(arc)
    path = close_flat(edge, arc, 0.0)

    box = {
        "x": (wx0 - bx0) / (bx1 - bx0),
        "y": (wy0 - TOP_CUT) / (by1 - TOP_CUT),
        "width": (wx1 - wx0) / (bx1 - bx0),
        "height": (wy1 - wy0) / (by1 - TOP_CUT),
    }

    view = "0 0 %d %.1f" % (VIEW_WIDTH, height)
    body = f'''// The JUST NIBBLE IT badge blob, traced from the pouch artwork
// ({SOURCE.replace(os.sep, "/")}) by tools/build-nibble-blob.py.
// Regenerate with the script rather than editing the path.
//
// The shape is flat along the top because it is flat along the top on the
// pack, where the pouch's seal cuts it off. Hang it from the header's top edge
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

/**
 * Where the wordmark sits inside the blob, as fractions of the viewBox --
 * measured off the same artwork, so the badge reproduces the pack's spacing
 * instead of a guess at it.
 */
export const NIBBLE_BLOB_WORDMARK = {{
  x: {box["x"]:.4f},
  y: {box["y"]:.4f},
  width: {box["width"]:.4f},
  height: {box["height"]:.4f},
}}

export const NIBBLE_BLOB_ASPECT = {VIEW_WIDTH / height:.4f}

/**
 * The blob with something held in its wordmark slot.
 *
 * Give it a width (or a height plus `aspect-[--nibble-blob-aspect]`); the
 * aspect ratio comes from the trace, so the lobes never stretch.
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
      <span
        className="absolute grid place-items-center"
        style={{{{
          left: `${{NIBBLE_BLOB_WORDMARK.x * 100}}%`,
          top: `${{NIBBLE_BLOB_WORDMARK.y * 100}}%`,
          width: `${{NIBBLE_BLOB_WORDMARK.width * 100}}%`,
          height: `${{NIBBLE_BLOB_WORDMARK.height * 100}}%`,
        }}}}
      >
        {{children}}
      </span>
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
    print("  wordmark  x %.4f  y %.4f  w %.4f  h %.4f" % tuple(box[k] for k in ("x", "y", "width", "height")))


if __name__ == "__main__":
    main()
