#!/usr/bin/env python3
"""Lift the FLIPO'S mark off the pouch print file, as vectors.

reference/jalapeno-kick-pouch.ai is the brand owner's print dieline for the
Jalapeno Kick pouch (gitignored, like the other .ai sources -- ask for it
again if it's missing). Illustrator saves a PDF-compatible copy, so the
lettering on the pouch front is still real outlines: eight filled paths --
F, L, the i's stem and its tilted dot, p, o, s and the apostrophe -- in the
pouch's dark-green ink. Nothing is traced or redrawn; the curves are copied
from the file as they are.

The mark is the same on every flavour's pouch, only the ink colour changes,
so it is emitted without a colour and takes `currentColor`.

Run `python tools/build-flipos-mark.py` from the repo root. Outputs:
  src/components/icons/FlipoMark.jsx       the mark as a React component
  public/assets/brand/flipos-mark.svg      the same paths, for non-React use
"""

import os

import pymupdf

SRC = os.path.join("reference", "jalapeno-kick-pouch.ai")

# Where the mark sits on the pouch front, in PDF points, and its ink. Only
# fills inside the box in that ink are taken, which leaves the pouch art, the
# JUST NIBBLE IT badge above and the flavour name below behind.
BOX = pymupdf.Rect(95, 235, 300, 335)
INK = (0.023, 0.223, 0.196)
PAD = 1.0  # points of breathing room round the tight bounds


def is_ink(fill):
    return fill is not None and all(abs(a - b) < 0.01 for a, b in zip(fill, INK))


def fmt(v):
    s = "%.2f" % v
    return s.rstrip("0").rstrip(".") if "." in s else s


def path_d(drawing, ox, oy):
    """PDF path items -> SVG path data, shifted so the mark starts at 0,0."""
    out = []
    pen = None
    pt = lambda p: "%s %s" % (fmt(p.x - ox), fmt(p.y - oy))
    for item in drawing["items"]:
        kind, start = item[0], item[1]
        if pen is None or abs(start.x - pen.x) > 1e-3 or abs(start.y - pen.y) > 1e-3:
            if out:
                out.append("Z")
            out.append("M" + pt(start))
        if kind == "l":
            out.append("L" + pt(item[2]))
            pen = item[2]
        elif kind == "c":
            out.append("C" + " ".join(pt(p) for p in item[2:5]))
            pen = item[4]
        else:
            raise ValueError("unexpected path item %r" % kind)
    out.append("Z")
    return "".join(out)


def main():
    page = pymupdf.open(SRC)[0]
    shapes = [
        d for d in page.get_drawings()
        if d["type"] == "f" and is_ink(d.get("fill")) and BOX.contains(d["rect"])
    ]
    if len(shapes) != 8:
        raise SystemExit("expected the mark's 8 paths, found %d" % len(shapes))

    bounds = pymupdf.Rect(shapes[0]["rect"])
    for d in shapes[1:]:
        bounds |= d["rect"]
    ox, oy = bounds.x0 - PAD, bounds.y0 - PAD
    w, h = bounds.width + 2 * PAD, bounds.height + 2 * PAD
    # Reading order, so the file diffs sensibly if the source ever changes.
    shapes.sort(key=lambda d: d["rect"].x0)
    ds = [path_d(d, ox, oy) for d in shapes]
    vb = "0 0 %s %s" % (fmt(w), fmt(h))

    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s">\n%s\n</svg>\n' % (
        vb, "\n".join('  <path d="%s"/>' % d for d in ds))
    with open(os.path.join("public", "assets", "brand", "flipos-mark.svg"), "w", newline="\n") as f:
        f.write(svg)

    paths = "\n".join("    <path d=\"%s\" />" % d for d in ds)
    jsx = f"""// The FLIPO'S mark from the pouch, lifted as vectors from the brand owner's
// print file by tools/build-flipos-mark.py. Regenerate with the script rather
// than editing these paths.
//
// It is lettering, not a font: there is no typeface to set "Flipo's" in that
// looks like this, so wherever the name should read as the pack does, use
// this. It draws in currentColor and is decorative -- put the words next to
// it for screen readers.

export const FLIPO_VIEWBOX = '{vb}'
export const FLIPO_ASPECT = {fmt(w / h)}

export function FlipoMark({{ className = '', ...props }}) {{
  return (
    <svg viewBox={{FLIPO_VIEWBOX}} fill="currentColor" className={{className}} aria-hidden="true" focusable="false" {{...props}}>
{paths}
    </svg>
  )
}}
"""
    with open(os.path.join("src", "components", "icons", "FlipoMark.jsx"), "w", newline="\n") as f:
        f.write(jsx)
    print("mark: %d paths, %s x %s pt" % (len(ds), fmt(w), fmt(h)))


if __name__ == "__main__":
    main()
