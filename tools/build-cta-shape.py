#!/usr/bin/env python3
"""Trace the brand's CTA button shape into CSS.

reference/drive/website/CTA shape.png is the real button: a lozenge whose top
and bottom edges bow, inside a heavy ink keyline. The site approximates it with
`--radius-organic`, which can vary the four corner radii but leaves the edges
between them straight -- so the bow, which is the whole character of the shape,
is the one thing it cannot do.

Emitted as a background image rather than a clip-path, because a clip-path on
the button would clip its own keyline away with everything else, and drawing
the keyline outside the button means wrapping every button on the site in an
extra element.

Two stacked paths, not one path with a stroke: the keyline silhouette first,
the yellow field on top of it. A stroke would have to survive the background
being stretched to whatever the button measures, and a stretched stroke goes
thick on one axis and thin on the other. Two filled paths stretch together.

Run `python tools/build-cta-shape.py` from the repo root. Outputs:
  src/styles/cta-shape.css
"""

import os
from urllib.parse import quote

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import measure

SRC = os.path.join("reference", "drive", "website", "CTA shape.png")
OUT = os.path.join("src", "styles", "cta-shape.css")

FIELD = "#f3c63b"     # the site's sunshine, in place of the source's own yellow
KEYLINE = "#071a16"   # the site's ink
VIEW = 1000.0
SAMPLES = 64
PREC = 1


def largest(mask):
    lab, n = ndi.label(mask)
    if n == 0:
        return mask
    sizes = ndi.sum(mask, lab, range(1, n + 1))
    return lab == (1 + int(np.argmax(sizes)))


def outline(mask, n=SAMPLES):
    padded = np.pad(mask.astype(float), 2)
    c = max(measure.find_contours(padded, 0.5), key=len)
    pts = np.column_stack([c[:, 1] - 2, c[:, 0] - 2])
    if np.allclose(pts[0], pts[-1]):
        pts = pts[:-1]
    ring = np.vstack([pts, pts[:1]])
    steps = np.linalg.norm(np.diff(ring, axis=0), axis=1)
    dist = np.concatenate([[0.0], np.cumsum(steps)])
    want = np.linspace(0.0, dist[-1], n, endpoint=False)
    res = np.column_stack([np.interp(want, dist, ring[:, i]) for i in (0, 1)])
    k = np.ones(3) / 3
    return np.column_stack([
        np.convolve(np.concatenate([res[-1:, i], res[:, i], res[:1, i]]), k, mode="valid")
        for i in (0, 1)
    ])


def to_path(pts, ox, oy, sx, sy):
    f = "%%.%df" % PREC
    p = np.column_stack([(pts[:, 0] - ox) * sx, (pts[:, 1] - oy) * sy])
    n = len(p)
    out = [("M" + f + "," + f) % tuple(p[0])]
    for i in range(n):
        p0, p1 = p[(i - 1) % n], p[i]
        p2, p3 = p[(i + 1) % n], p[(i + 2) % n]
        c1 = p1 + (p2 - p0) / 6.0
        c2 = p2 - (p3 - p1) / 6.0
        out.append(("C" + ",".join([f] * 6)) % (c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]))
    return " ".join(out) + "Z"


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)

    a = np.asarray(Image.open(SRC).convert("RGBA")).astype(int)
    rgb, alpha = a[..., :3], a[..., 3]
    opaque = alpha > 120

    # The field is the light half of the artwork; everything else opaque is
    # keyline. Splitting on brightness rather than on a named colour keeps this
    # working if the source is ever re-exported in another tint.
    field = largest(ndi.binary_closing(opaque & (rgb.sum(axis=2) > 330), np.ones((5, 5))))
    silhouette = largest(ndi.binary_fill_holes(ndi.binary_closing(opaque, np.ones((5, 5)))))

    ys, xs = np.nonzero(silhouette)
    ox, oy = xs.min(), ys.min()
    w, h = xs.max() - ox + 1, ys.max() - oy + 1
    sx, sy = VIEW / w, VIEW / h

    d_line = to_path(outline(silhouette), ox, oy, sx, sy)
    d_field = to_path(outline(field), ox, oy, sx, sy)

    # Single quotes inside, double quotes around the url(): a double quote in
    # the markup would close the CSS string. And `#` has to be escaped, or the
    # first colour turns the rest of the data URI into a fragment identifier
    # and the whole background silently resolves to nothing.
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 %d %d' preserveAspectRatio='none'>"
        "<path d='%s' fill='%s'/><path d='%s' fill='%s'/></svg>"
    ) % (VIEW, VIEW, d_line, KEYLINE, d_field, FIELD)
    uri = 'url("data:image/svg+xml,%s")' % quote(svg, safe="/:=<>,.-() '")

    css = '''/* The CTA button's shape, traced from reference/drive/website/CTA shape.png
   by tools/build-cta-shape.py. Regenerate with the script; do not hand-edit
   the data URI.

   The shape replaces the border and the radius rather than sitting behind
   them: `--radius-organic` gave the corners their wobble but left the edges
   between straight, and the bow along the top and bottom is what makes this
   button the brand's rather than a rounded rectangle.

   Stretched with preserveAspectRatio="none", so one shape covers a label of
   any length. The keyline is a filled path underneath the field rather than a
   stroke, so it cannot go thick on one axis when the button is wide. */
:root {
  --jni-cta-shape: %s;
}
''' % uri

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(css)
    print("CTA shape -> %s  (%.1f KB data URI)" % (OUT, len(uri) / 1024))


if __name__ == "__main__":
    main()
