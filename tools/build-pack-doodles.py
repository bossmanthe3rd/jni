#!/usr/bin/env python3
"""Trace the brand's own doodle artwork into the site's doodle set.

The doodles are the most reused mark on the site -- the hero ground, the
flavour stage, the testimonials edge, every panel behind every panel. They were
drawn from scratch, in the style of the packs. The owner's folder has the real
ones, so this replaces the lot.

Source: reference/drive/website/game assets/. Five flat-colour PNGs with clean
alpha, each built the way this kind of vector art always is -- a black
silhouette with flat colour laid on top of it. That construction is what this
reproduces, rather than trying to trace each coloured shape and butt them
together: the silhouette is emitted first as the keyline, and the colour
regions are drawn over it, so wherever a region stops the keyline shows
through. Seams are impossible by construction.

Colour is not baked in. Each region is classified against the source palette
and emitted against a palette ROLE -- fill, stem, seed, line -- so the traced
art still recolours per flavour the way the drawn set did. Without that the
flavour stage could not cross-fade between grounds and the testimonials border
could not carry three flavours at once.

The shapes keep the names the old set used, because every call site refers to
them by name from data (site.js `shapes` arrays, DoodleField's PICKS,
DoodleBorder's pool). `chilli-half` is now the second chilli silhouette rather
than a halved one; the name is a key, not a description.

Run `python tools/build-pack-doodles.py` from the repo root. Outputs:
  src/components/icons/PackDoodles.jsx
"""

import os

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import measure

SRC = os.path.join("reference", "drive", "website", "game assets")

# role -> the flat colour that carries it in the source art. Measured, not
# guessed: every one of these files quantises to three or four flat values.
SOURCES = [
    {
        "name": "chilli-whole",
        "file": "chillie art.png",
        "roles": {"fill": "#d83030", "stem": "#780018"},
    },
    {
        "name": "chilli-half",
        "file": "sweet.png",
        "roles": {"fill": "#f07830", "stem": "#780018"},
    },
    {
        "name": "jalapeno",
        "file": "jalapeno.png",
        "roles": {"fill": "#60a830", "stem": "#004818"},
    },
    {
        "name": "chilli-slice",
        "file": "rounded chillie.png",
        "roles": {"fill": "#d81848", "seed": "#d8c048"},
    },
    {
        "name": "pepper-section",
        "file": "Asset 4.png",
        "roles": {"fill": "#60a830", "seed": "#d8c048"},
        # The teal burst beside it is a separate mark, not part of the section.
        "drop": ["#60c0a8"],
    },
    {
        # One seed, lifted out of the slice's own seeds rather than drawn: the
        # old one was a bare oval that read as nothing at doodle size.
        #
        # The body colour is declared even though nothing is emitted for it.
        # Classification is nearest-colour, so leaving it out does not exclude
        # the body -- it hands every red pixel to whichever declared colour is
        # closest, which is the yellow, and the "seed" comes out as the whole
        # slice.
        "name": "seed",
        "file": "rounded chillie.png",
        "roles": {"fill": "#d81848", "seed": "#d8c048"},
        "isolate": "seed",
    },
]

LINE = "#001818"          # the keyline every one of them shares
COMPONENT = {
    "chilli-whole": "ChilliWhole",
    "chilli-half": "ChilliHalved",
    "chilli-slice": "ChilliSlice",
    "pepper-section": "PepperSection",
    "jalapeno": "Jalapeno",
    "seed": "ChilliSeed",
}

VIEW = 200.0      # longest side of the emitted viewBox
SMOOTH = 1
MIN_AREA = 80     # px, before normalising -- drops speckle from the alpha edge
MIN_RING = 90     # px^2, the smallest enclosed area worth a contour
PREC = 0          # a 200-unit viewBox does not need decimals


def hex_to_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)])


def classify(rgb, alpha, palette):
    """Nearest declared colour per pixel, over the opaque area."""
    opaque = alpha > 120
    names = list(palette)
    cols = np.stack([hex_to_rgb(palette[n]) for n in names])
    d = np.linalg.norm(rgb[:, :, None, :].astype(float) - cols[None, None, :, :], axis=3)
    idx = np.argmin(d, axis=2)
    return {n: opaque & (idx == i) for i, n in enumerate(names)}, opaque


def clean(mask, min_area=MIN_AREA):
    mask = ndi.binary_closing(mask, np.ones((3, 3)))
    lab, n = ndi.label(mask)
    if n == 0:
        return mask
    sizes = ndi.sum(mask, lab, range(1, n + 1))
    keep = [i + 1 for i, s in enumerate(sizes) if s >= min_area]
    return np.isin(lab, keep)


def ring_area(pts):
    x, y = pts[:, 0], pts[:, 1]
    return abs(0.5 * float(np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y)))


def contours(mask, samples_per_px=0.075, cap=58):
    """Smoothed outlines of a mask, in pixel coordinates.

    Point budget follows each ring's own perimeter, so a big silhouette gets
    the detail and a seed does not pay for it.
    """
    padded = np.pad(mask.astype(float), 2)
    out = []
    for c in measure.find_contours(padded, 0.5):
        if len(c) < 24:
            continue
        pts = np.column_stack([c[:, 1] - 2, c[:, 0] - 2])
        if ring_area(pts) < MIN_RING:
            continue
        n = int(min(cap, max(14, len(pts) * samples_per_px)))
        out.append(resample(pts, n))
    return out


def resample(pts, n):
    if np.allclose(pts[0], pts[-1]):
        pts = pts[:-1]
    ring = np.vstack([pts, pts[:1]])
    steps = np.linalg.norm(np.diff(ring, axis=0), axis=1)
    dist = np.concatenate([[0.0], np.cumsum(steps)])
    want = np.linspace(0.0, dist[-1], n, endpoint=False)
    res = np.column_stack([np.interp(want, dist, ring[:, i]) for i in (0, 1)])
    if SMOOTH:
        k = np.ones(2 * SMOOTH + 1) / (2 * SMOOTH + 1)
        res = np.column_stack([
            np.convolve(np.concatenate([res[-SMOOTH:, i], res[:, i], res[:SMOOTH, i]]), k, mode="valid")
            for i in (0, 1)
        ])
    return res


def to_path(rings, ox, oy, scale):
    """Closed Catmull-Rom through every ring, as one path."""
    f = "%%.%df" % PREC
    parts = []
    for pts in rings:
        p = (pts - [ox, oy]) * scale
        n = len(p)
        parts.append(("M" + f + "," + f) % tuple(p[0]))
        for i in range(n):
            p0, p1 = p[(i - 1) % n], p[i]
            p2, p3 = p[(i + 1) % n], p[(i + 2) % n]
            c1 = p1 + (p2 - p0) / 6.0
            c2 = p2 - (p3 - p1) / 6.0
            parts.append(("C" + ",".join([f] * 6)) % (c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]))
        parts.append("Z")
    return " ".join(parts)


def build(spec):
    im = Image.open(os.path.join(SRC, spec["file"])).convert("RGBA")
    a = np.asarray(im)
    rgb, alpha = a[..., :3], a[..., 3]

    palette = dict(spec["roles"])
    palette["line"] = LINE
    for i, extra in enumerate(spec.get("drop", [])):
        palette["_drop%d" % i] = extra

    regions, opaque = classify(rgb, alpha, palette)

    # The silhouette is everything the artwork covers, minus anything dropped.
    art = opaque.copy()
    for key in list(regions):
        if key.startswith("_drop"):
            art &= ~regions[key]
            del regions[key]
    art = clean(art, min_area=200)

    if spec.get("drop"):
        # Dropping the burst's teal leaves its keyline behind as a set of
        # hollow triangles floating beside the section. They are their own
        # islands, so keeping the largest one clears them.
        lab, n = ndi.label(art)
        if n > 1:
            sizes = ndi.sum(art, lab, range(1, n + 1))
            art = lab == (1 + int(np.argmax(sizes)))

    if spec.get("isolate"):
        # Keep only the largest blob of one role, and crop to it. Labelled
        # before any closing: the seeds sit shoulder to shoulder, and closing
        # first welds two of them into one peanut.
        mask = regions[spec["isolate"]]
        lab, n = ndi.label(mask)
        sizes = ndi.sum(mask, lab, range(1, n + 1))
        mask = clean(lab == (1 + int(np.argmax(sizes))))
        art = ndi.binary_dilation(mask, np.ones((7, 7)))
        regions = {spec["isolate"]: mask}
    else:
        # Every region is clipped to the silhouette so an alpha-edge stray
        # cannot put a scrap of colour outside the shape.
        regions = {k: clean(v & art) for k, v in regions.items() if k != "line"}

    ys, xs = np.nonzero(art)
    ox, oy = xs.min(), ys.min()
    w, h = xs.max() - ox + 1, ys.max() - oy + 1
    scale = VIEW / max(w, h)

    layers = [("line", to_path(contours(art), ox, oy, scale))]
    for role in ("fill", "stem", "seed"):
        if role in regions and regions[role].any():
            rings = contours(regions[role])
            if rings:
                layers.append((role, to_path(rings, ox, oy, scale)))

    return {
        "name": spec["name"],
        "component": COMPONENT[spec["name"]],
        "view": "0 0 %.1f %.1f" % (w * scale, h * scale),
        "aspect": w / h,
        "layers": layers,
    }


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    built = [build(s) for s in SOURCES]

    head = '''// The pack doodles, traced from the brand's own artwork in
// reference/drive/website/game assets/ by tools/build-pack-doodles.py.
// Regenerate with the script rather than editing the paths.
//
// Each doodle is a keyline silhouette with flat colour laid over it, which is
// how the source art is built: wherever a colour region stops, the keyline
// underneath shows through, so the shapes cannot develop seams. Colour is by
// palette ROLE, not baked in, so one traced shape still serves all three
// flavours -- which is what lets the flavour stage cross-fade grounds and the
// testimonials edge carry three flavours at once.

export const packPalettes = {
  'jalapeno-kick': { ground: '#0b5c2e', fill: '#c3d92e', stem: '#0e4a26', line: '#0d3f22', seed: '#dfe7bd' },
  'peri-peri-punch': { ground: '#5c0d16', fill: '#c8102e', stem: '#4a0a11', line: '#3d060c', seed: '#e8c7c1' },
  'sweet-chilli-rush': { ground: '#c8180d', fill: '#f59120', stem: '#7a1408', line: '#5a0f08', seed: '#f7ead9' },
}

const DEFAULT_FLAVOUR = 'jalapeno-kick'

// Keyline weight in doodle units. The silhouette carries the keyline itself;
// this strokes it as well, so the line can be thickened without redrawing.
export const STROKE = 4.3
'''

    body = [head]
    body.append("// width / height, for sizing the set proportionally.")
    body.append("export const ASPECT = { " + ", ".join(
        "'%s': %.4f" % (b["name"], b["aspect"]) for b in built) + " }\n")
    body.append("export const doodleNames = [" + ", ".join(
        "'%s'" % b["name"] for b in built) + "]\n")

    for b in built:
        body.append("// %s" % b["name"])
        body.append("export function %s({ flavour = DEFAULT_FLAVOUR, palette, className = '', weight = STROKE }) {"
                    % b["component"])
        body.append("  const c = palette || packPalettes[flavour] || packPalettes[DEFAULT_FLAVOUR]")
        body.append("  return (")
        body.append("    <svg viewBox=\"%s\" className={className} aria-hidden=\"true\">" % b["view"])
        for role, d in b["layers"]:
            body.append("      <path")
            body.append("        d=\"%s\"" % d)
            body.append("        fill={c.%s}" % role)
            if role == "line":
                body.append("        stroke={c.line}")
                body.append("        strokeWidth={weight}")
                body.append("        strokeLinejoin=\"round\"")
            body.append("        fillRule=\"evenodd\"")
            body.append("      />")
        body.append("    </svg>")
        body.append("  )")
        body.append("}\n")

    body.append("// Name -> component, for scattering doodles from data.")
    body.append("export const doodleComponents = {")
    for b in built:
        body.append("  '%s': %s," % (b["name"], b["component"]))
    body.append("}")

    out = os.path.join("src", "components", "icons", "PackDoodles.jsx")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(body) + "\n")

    print("%d doodles -> %s" % (len(built), out))
    for b in built:
        chars = sum(len(d) for _, d in b["layers"])
        print("  %-15s %-16s aspect %.3f  %d layers  %5d chars"
              % (b["name"], b["view"], b["aspect"], len(b["layers"]), chars))


if __name__ == "__main__":
    main()
