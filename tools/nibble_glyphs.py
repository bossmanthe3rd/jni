"""The two glyphs Milkyway does not have: `?` and `3`.

The brand face is Milkyway DEMO, which ships A-Z and a-z and nothing else --
no digits, no punctuation. Four of the five header words end in a question
mark and one of them starts with a 3, so those two have to be drawn.

They are drawn as thick strokes rather than as outlines, because that is what
the rest of the face is: one heavy, near-constant-width stroke with rounded
joins and small counters. Draw a centreline, give it a width, and the
letterform follows -- which also keeps the weight tied to the real glyphs,
since the widths here are measured off them.

Measured off the rendered face, in font units:
    I   ink 248 wide                 -> stem 249
    O   ink 568 wide, counter 146    -> bowl stroke 209, radius 284/73
    C   ink 531 wide, side stroke 210
    B   ink 524 wide, counters 22    -> this face is happy with slit counters

Two things this file learned the hard way:

The centreline runs down the MIDDLE of the stroke, so every extreme of it sits
half a stroke inside the intended ink: a bowl whose crown should touch the cap
line peaks at CAP - width/2. Get that wrong and the glyph towers over its
neighbours.

And the outline is rasterised and traced rather than computed as a pair of
offset curves. Where a bowl's radius is smaller than half the stroke -- which
is most of a `?` at this weight -- the inner offset curve turns itself inside
out, and the fill renders the crossings as slivers and slits. Stamping discs
along the centreline cannot do that: overlaps simply union, so tight curves,
the `3`'s welded waist and the tail curling back under the `?`'s bowl all come
out as the one solid shape they should be.

Everything is in font units, y-up from the baseline, to sit alongside the real
outlines without a second coordinate system.
"""

import math

import numpy as np
from scipy import ndimage as ndi
from skimage import measure

CAP = 738          # Milkyway's cap height
STEM = 249         # its stem width, measured off `I`
BOWL = 209         # its bowl stroke, measured across the middle of `O` and `C`

# Punctuation and figures carry a little less weight than the caps here. At the
# caps' own 209 a question mark has no room for a bowl, a tail and a dot inside
# 738 units -- it simply fills in.
DRAWN_W = 172

SUPERSAMPLE = 3    # raster units per font unit while tracing
SAMPLES = 52       # outline points per contour after tracing
SMOOTH = 1


def arc(cx, cy, r, a0, a1, steps=90):
    """Points along a circular arc, in degrees, sweeping a0 -> a1."""
    return [
        (cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
        for a in (a0 + (a1 - a0) * i / (steps - 1) for i in range(steps))
    ]


def bezier(p0, p1, p2, p3, steps=40):
    out = []
    for i in range(1, steps):
        t = i / (steps - 1)
        u = 1 - t
        out.append((
            u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
            u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
        ))
    return out


def oval(cx, cy, rx, ry, angle=0.0, wobble=0.0, steps=64):
    """A slightly irregular oval -- this face's dots lean, they are never
    true circles."""
    a = math.radians(angle)
    out = []
    for k in range(steps):
        t = 2 * math.pi * k / steps
        r = 1.0 + wobble * math.cos(2 * t + 0.7)
        x, y = math.cos(t) * rx * r, math.sin(t) * ry * r
        out.append((cx + x * math.cos(a) - y * math.sin(a),
                    cy + x * math.sin(a) + y * math.cos(a)))
    return out


def _resample_closed(pts, n, smooth):
    if np.allclose(pts[0], pts[-1]):
        pts = pts[:-1]
    ring = np.vstack([pts, pts[:1]])
    steps = np.linalg.norm(np.diff(ring, axis=0), axis=1)
    dist = np.concatenate([[0.0], np.cumsum(steps)])
    want = np.linspace(0.0, dist[-1], n, endpoint=False)
    res = np.column_stack([np.interp(want, dist, ring[:, i]) for i in (0, 1)])
    if smooth:
        k = np.ones(2 * smooth + 1) / (2 * smooth + 1)
        res = np.column_stack([
            np.convolve(np.concatenate([res[-smooth:, i], res[:, i], res[:smooth, i]]), k, mode='valid')
            for i in (0, 1)
        ])
    return res


class Glyph:
    """A centreline sketch that knows how to become an outline."""

    def __init__(self, advance, box):
        self.advance = advance
        self.box = box                 # (x0, y0, x1, y1) raster window, font units
        self.strokes = []              # (points, width, taper)
        self.fills = []                # closed polygons

    def stroke(self, pts, width=DRAWN_W, taper=None):
        self.strokes.append((pts, width, taper))
        return self

    def fill(self, poly):
        self.fills.append(poly)
        return self

    def mask(self):
        x0, y0, x1, y1 = self.box
        s = SUPERSAMPLE
        w, h = int((x1 - x0) * s), int((y1 - y0) * s)
        grid_y, grid_x = np.mgrid[0:h, 0:w]
        # raster row 0 is the TOP of the window, so y runs back down
        px = grid_x / s + x0
        py = y1 - grid_y / s
        out = np.zeros((h, w), dtype=bool)

        for pts, width, taper in self.strokes:
            n = len(pts)
            for i, (cx, cy) in enumerate(pts):
                t = i / (n - 1) if n > 1 else 0.0
                r = width * (taper(t) if taper else 1.0) / 2.0
                out |= (px - cx) ** 2 + (py - cy) ** 2 <= r * r

        for poly in self.fills:
            p = np.asarray(poly, dtype=float)
            inside = np.zeros_like(out)
            j = len(p) - 1
            for i in range(len(p)):
                xi, yi = p[i]
                xj, yj = p[j]
                if yj != yi:
                    cond = (yi > py) != (yj > py)
                    xint = (xj - xi) * (py - yi) / (yj - yi) + xi
                    inside ^= cond & (px < xint)
                j = i
            out |= inside

        return ndi.binary_closing(out, np.ones((3, 3)))

    def contours(self):
        """Traced outline(s) in font units, y-up."""
        x0, y0, x1, y1 = self.box
        s = SUPERSAMPLE
        mask = np.pad(self.mask().astype(float), 2)
        out = []
        for c in measure.find_contours(mask, 0.5):
            if len(c) < 40:
                continue
            pts = np.column_stack([(c[:, 1] - 2) / s + x0, y1 - (c[:, 0] - 2) / s])
            out.append(_resample_closed(pts, SAMPLES, SMOOTH))
        return out


# --- ? -----------------------------------------------------------------------
# A bowl that stops at the shoulder, a tail curling back under it to close the
# counter, and a dot. Narrow and tall: the wide bowls of the earlier cuts left
# no room for a tail that did not touch the bowl.
def question():
    r = 132.5
    # Set well clear of the left edge: at the lockup's tracking a tighter
    # sidebearing fuses the mark into whatever letter precedes it.
    cx, cy = 288.0, CAP - DRAWN_W / 2 - r
    tail = (cx - 12.0, 322.0)
    line = arc(cx, cy, r, 182, -58)
    end = line[-1]
    line += bezier(end, (end[0] + 34, end[1] - 70), (tail[0] + 96, tail[1] + 30), tail)
    g = Glyph(advance=492, box=(-40, -40, 580, CAP + 40))
    g.stroke(line, DRAWN_W,
             taper=lambda t: 1.0 + 0.05 * math.sin(math.pi * min(t / 0.72, 1.0))
             + 0.10 * max(0.0, t - 0.7) / 0.3)
    g.fill(oval(tail[0] + 4, 92.0, 98.0, 92.0, angle=-10, wobble=0.05))
    return g


# --- 3 -----------------------------------------------------------------------
# Two bowls opening left, the lower one wider, overlapping at the waist and
# tapered into it so the join pinches instead of pooling.
def three():
    top_r, bot_r = 145.0, 165.0
    top = arc(300.0, CAP - DRAWN_W / 2 - top_r, top_r, 112, -100)
    bottom = arc(288.0, DRAWN_W / 2 + bot_r, bot_r, 100, -140)
    g = Glyph(advance=594, box=(-40, -40, 600, CAP + 40))
    g.stroke(top, DRAWN_W,
             taper=lambda t: 1.0 + 0.05 * math.sin(math.pi * t) - 0.24 * max(0.0, t - 0.8) / 0.2)
    g.stroke(bottom, DRAWN_W,
             taper=lambda t: 1.0 + 0.05 * math.sin(math.pi * t) - 0.24 * max(0.0, 0.2 - t) / 0.2)
    return g


DRAWN = {'?': question, '3': three}
