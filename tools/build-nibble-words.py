#!/usr/bin/env python3
"""Typeset the header's rotating words as outlines, in the logo's own face.

The badge in the site header holds the JUST NIBBLE IT lockup, which is traced
artwork rather than live type. The words that take its place on rotation have
to be the same material, or the swap reads as a font change rather than as the
badge saying something.

So they are set here, at build time, in Milkyway -- confirmed letter for letter
as the face the logo is drawn in -- and emitted as paths. That buys three
things over live text in a <span>:

  * the two glyphs Milkyway lacks (`?` and `3`, see nibble_glyphs.py) can be
    dropped in beside the real ones instead of falling back to Comic Sans,
  * tracking is set to the logo's own, which is far tighter than the face's
    natural fit, and
  * nothing can flash in an unstyled fallback face mid-rotation.

Tracking: measured off the traced lockup, which is hand-set per line --
+0.047em on JUST, -0.064em on NIBBLE, -0.052em on IT. The words take -0.055em,
between the two long lines, since those carry the lockup's character.

Run `python tools/build-nibble-words.py` from the repo root. Outputs:
  src/components/ui/NibbleWords.jsx
"""

import os
import sys

import numpy as np
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import nibble_glyphs as ng  # noqa: E402

FONT = os.path.join("public", "assets", "fonts", "milkyway.woff2")

# id, the copy, and how it breaks across lines.
WORDS = [
    ("hungry", "Hungry?", ["HUNGRY?"]),
    ("bored", "Bored?", ["BORED?"]),
    ("threepm", "3PM?", ["3PM?"]),
    ("craving", "Craving?", ["CRAVING?"]),
    ("snackbreak", "Snack break?", ["SNACK", "BREAK?"]),
]

TRACKING = -55          # font units per gap; see the module docstring
LINE_PITCH = 1.06       # of the cap height, matching the lockup's tight stack
PREC = 0                # font units are 1/1000 em -- a decimal buys nothing


def font_contours(glyph_set, name):
    """A real glyph's contours, flattened to points, y-up."""
    pen = RecordingPen()
    glyph_set[name].draw(pen)
    out, cur, last = [], [], (0.0, 0.0)

    def flush():
        if len(cur) > 2:
            out.append(np.array(cur, dtype=float))

    for op, pts in pen.value:
        if op == "moveTo":
            flush(); cur = [pts[0]]; last = pts[0]
        elif op == "lineTo":
            cur.append(pts[0]); last = pts[0]
        elif op == "qCurveTo":
            on, prev = list(pts), last
            end, ctrl = on[-1], on[:-1]
            for i, c in enumerate(ctrl):
                nxt = ctrl[i + 1] if i + 1 < len(ctrl) else end
                mid = ((c[0] + nxt[0]) / 2, (c[1] + nxt[1]) / 2) if i + 1 < len(ctrl) else end
                for t in np.linspace(0, 1, 14)[1:]:
                    u = 1 - t
                    cur.append((u * u * prev[0] + 2 * u * t * c[0] + t * t * mid[0],
                                u * u * prev[1] + 2 * u * t * c[1] + t * t * mid[1]))
                prev = mid
            last = prev
        elif op == "curveTo":
            p0 = last
            for i in range(0, len(pts), 3):
                p1, p2, p3 = pts[i], pts[i + 1], pts[i + 2]
                for t in np.linspace(0, 1, 16)[1:]:
                    u = 1 - t
                    cur.append((u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
                                u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]))
                p0 = p3
            last = p0
        elif op == "closePath":
            flush(); cur = []
    flush()
    return out


def signed_area(poly):
    x, y = poly[:, 0], poly[:, 1]
    return 0.5 * float(np.sum(x * np.roll(y, -1) - np.roll(x, -1) * y))


def contains(outer, inner):
    """Crude but sufficient: is inner's first point inside outer?"""
    px, py = inner[0]
    x, y = outer[:, 0], outer[:, 1]
    x2, y2 = np.roll(x, -1), np.roll(y, -1)
    cross = ((y > py) != (y2 > py)) & (px < (x2 - x) * (py - y) / np.where(y2 == y, np.nan, y2 - y) + x)
    return bool(np.nansum(cross) % 2)


def orient(contours, outer_sign):
    """Wind outers one way and the holes inside them the other.

    The word is one path under nonzero fill, so every outer contour has to
    agree: tight tracking lets neighbouring letters touch, and two outers wound
    against each other would punch a hole where they overlap instead of
    merging. The drawn glyphs come off a raster trace with no winding
    guarantee, so this is not optional.
    """
    out = []
    for i, c in enumerate(contours):
        hole = any(j != i and contains(other, c) for j, other in enumerate(contours))
        want = -outer_sign if hole else outer_sign
        out.append(c[::-1] if np.sign(signed_area(c)) != want else c)
    return out


def to_path(contours, prec=PREC):
    """Closed Catmull-Rom through each contour, as one path."""
    f = "%%.%df" % prec
    parts = []
    for pts in contours:
        n = len(pts)
        parts.append(("M" + f + "," + f) % tuple(pts[0]))
        for i in range(n):
            p0, p1 = pts[(i - 1) % n], pts[i]
            p2, p3 = pts[(i + 1) % n], pts[(i + 2) % n]
            c1 = p1 + (p2 - p0) / 6.0
            c2 = p2 - (p3 - p1) / 6.0
            parts.append(("C" + ",".join([f] * 6)) % (c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]))
        parts.append("Z")
    return " ".join(parts)


def drawn_path(contours, outer_sign, dx, dy, prec=PREC):
    """A drawn glyph, oriented to the font's winding and placed."""
    placed = [np.column_stack([c[:, 0] + dx, dy - c[:, 1]]) for c in contours]
    return to_path(orient(placed, -outer_sign))


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    font = TTFont(os.path.join(root, FONT))
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    cap = ng.CAP

    # Whatever winding this face uses for its outer contours is the one every
    # contour in the emitted word has to be measured against.
    outer_sign = np.sign(signed_area(max(font_contours(glyph_set, cmap[ord("O")]),
                                         key=lambda c: abs(signed_area(c)))))

    drawn_cache = {}

    def glyph(ch):
        """(contours, advance) for one character, real or drawn."""
        if ch in ng.DRAWN:
            if ch not in drawn_cache:
                g = ng.DRAWN[ch]()
                drawn_cache[ch] = (g.contours(), g.advance)
            return drawn_cache[ch]
        name = cmap[ord(ch)]
        return font_contours(glyph_set, name), hmtx[name][0]

    emitted = []
    for word_id, text, lines in WORDS:
        # Pass one: place every glyph and find the ink box. Real glyphs are
        # measured rather than flattened -- flattening them here and re-fitting
        # curves through the samples is what made the first cut of this file
        # emit 730KB of path data for five words.
        run, x0, x1, y0, y1 = [], None, None, None, None
        for row, line in enumerate(lines):
            x = 0.0
            baseline = -row * cap * LINE_PITCH
            for i, ch in enumerate(line):
                if ch in ng.DRAWN:
                    contours, advance = glyph(ch)
                    every = np.vstack(contours)
                    bounds = (every[:, 0].min(), every[:, 1].min(),
                              every[:, 0].max(), every[:, 1].max())
                    run.append(("drawn", contours, x, baseline))
                else:
                    name = cmap[ord(ch)]
                    advance = hmtx[name][0]
                    bp = BoundsPen(glyph_set)
                    glyph_set[name].draw(bp)
                    bounds = bp.bounds
                    run.append(("font", name, x, baseline))
                bx0, by0, bx1, by1 = bounds
                bx0, bx1 = bx0 + x, bx1 + x
                by0, by1 = by0 + baseline, by1 + baseline
                x0 = bx0 if x0 is None else min(x0, bx0)
                x1 = bx1 if x1 is None else max(x1, bx1)
                y0 = by0 if y0 is None else min(y0, by0)
                y1 = by1 if y1 is None else max(y1, by1)
                x += advance + (TRACKING if i < len(line) - 1 else 0)

        # Pass two: emit. font units, y-up -> viewBox units, y-down, origin at
        # the ink's top-left corner.
        parts = []
        for kind, payload, dx, baseline in run:
            if kind == "drawn":
                parts.append(drawn_path(payload, outer_sign, dx - x0, y1 - baseline))
            else:
                pen = SVGPathPen(glyph_set, ntos=lambda v: ("%%.%df" % PREC) % v)
                glyph_set[payload].draw(TransformPen(pen, (1, 0, 0, -1, dx - x0, y1 - baseline)))
                parts.append(pen.getCommands())

        emitted.append({
            "id": word_id,
            "text": text,
            "lines": len(lines),
            "view": "0 0 %.1f %.1f" % (x1 - x0, y1 - y0),
            "d": " ".join(p for p in parts if p),
        })

    body = ['''// The header badge's rotating words, set in Milkyway -- the face the JUST
// NIBBLE IT logo is drawn in -- and emitted as outlines by
// tools/build-nibble-words.py. Edit the generator, not this file.
//
// Outlines rather than live text because the badge's logo is artwork too, and
// because Milkyway DEMO has no `?` and no digits: those two glyphs are drawn
// in tools/nibble_glyphs.py and set here beside the real ones.
//
// Each word is its own viewBox, tight to the ink. Fit one into a box with
// preserveAspectRatio="xMidYMid meet" and the long words land on their width
// while the short ones land on their height, which is what keeps the cap
// heights within a few per cent of each other across the whole rotation.

export const NIBBLE_WORDS = [''']
    for w in emitted:
        body.append("  {")
        body.append("    id: '%s'," % w["id"])
        body.append("    text: '%s'," % w["text"])
        body.append("    lines: %d," % w["lines"])
        body.append("    viewBox: '%s'," % w["view"])
        body.append("    d:")
        body.append("      '%s'," % w["d"])
        body.append("  },")
    body.append("]\n")

    out = os.path.join(root, "src", "components", "ui", "NibbleWords.jsx")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(body))

    print("%d words -> src/components/ui/NibbleWords.jsx" % len(emitted))
    for w in emitted:
        vw, vh = w["view"].split()[2:]
        print("  %-11s %-13s lines=%d  %sx%s  aspect %.2f  %d chars"
              % (w["id"], w["text"], w["lines"], vw, vh, float(vw) / float(vh), len(w["d"])))


if __name__ == "__main__":
    main()
