#!/usr/bin/env python3
"""Trace the JUST NIBBLE IT wordmark into separable vector pieces.

public/assets/brand/just-nibble-logo.png is a 2014x1533 flat-black RGBA render of
the wordmark -- vector-quality art, not photography -- so it can be traced
faithfully rather than redrawn by eye. The mask splits into exactly 15 connected
components: twelve letters across three lines, plus the three crumb dots flying
off the bitten second B.

Every piece is emitted in the SAME coordinate space as the full logo, so
overlaying the words or letters reassembles the wordmark pixel-perfectly while
each piece can still be transformed on its own -- which is what an intro
animation needs.

Pipeline per component: sub-pixel marching-squares contour -> Ramer-Douglas-
Peucker simplification -> cubic bezier fit that keeps tangents continuous on
curves but cusps at genuine corners, so the fat rounded terminals stay smooth
without the stroke joins going soft.

Run `python tools/build-wordmark.py` from the repo root. Outputs:
  src/components/icons/Wordmark.jsx        words, letters, crumbs, metadata
  public/assets/brand/wordmark/*.svg       flat SVGs for non-React use
"""

import json
import math
import os

import numpy as np
from PIL import Image
from scipy import ndimage
from skimage import measure

SRC = os.path.join("public", "assets", "brand", "just-nibble-logo.png")

# Tracing knobs. RDP_TOL is in source pixels; CORNER_DEG is the turn angle above
# which a vertex is treated as a corner instead of a smooth point.
RDP_TOL = 1.4
CORNER_DEG = 58.0
CRUMB_AREA = 6000          # components smaller than this are crumb dots
ROW_SPLITS = (520, 1040)   # y-centre boundaries between the three lines

# Letter ids, left-to-right within each line. Suffixed where a letter repeats,
# so every piece has a stable unique key.
LINES = [
    ("just", "JUST", ["j", "u", "s", "t"]),
    ("nibble", "NIBBLE", ["n", "i", "b1", "b2", "l", "e"]),
    ("it", "IT", ["i2", "t2"]),
]
CHARS = {"j": "J", "u": "U", "s": "S", "t": "T", "n": "N", "i": "I",
         "b1": "B", "b2": "B", "l": "L", "e": "E", "i2": "I", "t2": "T"}


# ------------------------------------------------------------------- geometry

def rdp(pts, tol):
    """Ramer-Douglas-Peucker on an open polyline, iterative to avoid recursion."""
    n = len(pts)
    if n < 3:
        return list(range(n))
    keep = [False] * n
    keep[0] = keep[n - 1] = True
    stack = [(0, n - 1)]
    while stack:
        a, b = stack.pop()
        if b <= a + 1:
            continue
        ax, ay = pts[a]
        bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        seg = math.hypot(dx, dy)
        worst, wi = -1.0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            if seg < 1e-9:
                d = math.hypot(px - ax, py - ay)
            else:
                d = abs(dy * (px - ax) - dx * (py - ay)) / seg
            if d > worst:
                worst, wi = d, i
        if worst > tol:
            keep[wi] = True
            stack.append((a, wi))
            stack.append((wi, b))
    return [i for i in range(n) if keep[i]]


def simplify_closed(pts, tol):
    """RDP a closed ring. Rotates to the extreme point first so the split seam
    lands on a stable, geometrically meaningful vertex."""
    start = min(range(len(pts)), key=lambda i: (pts[i][1], pts[i][0]))
    ring = pts[start:] + pts[:start]
    idx = rdp(ring + [ring[0]], tol)
    out = [ring[i] for i in idx if i < len(ring)]
    # Drop near-duplicate neighbours that survive the seam.
    dedup = [out[0]]
    for p in out[1:]:
        if math.hypot(p[0] - dedup[-1][0], p[1] - dedup[-1][1]) > 0.35:
            dedup.append(p)
    if len(dedup) > 2 and math.hypot(dedup[0][0] - dedup[-1][0],
                                    dedup[0][1] - dedup[-1][1]) < 0.35:
        dedup.pop()
    return dedup


def bezier_ring(pts, corner_deg=CORNER_DEG):
    """Fit a closed cubic bezier path through pts.

    Smooth vertices take a tangent from their neighbours (Catmull-Rom style);
    vertices whose turn exceeds corner_deg cusp instead, so stroke joins stay
    crisp while the rounded terminals stay round.
    """
    n = len(pts)
    if n < 3:
        return ""
    thresh = math.radians(corner_deg)
    t_in, t_out = [], []
    for i in range(n):
        p_prev = pts[(i - 1) % n]
        p = pts[i]
        p_next = pts[(i + 1) % n]
        v_in = (p[0] - p_prev[0], p[1] - p_prev[1])
        v_out = (p_next[0] - p[0], p_next[1] - p[1])
        a_in = math.atan2(v_in[1], v_in[0])
        a_out = math.atan2(v_out[1], v_out[0])
        turn = abs((a_out - a_in + math.pi) % (2 * math.pi) - math.pi)
        if turn > thresh:                      # corner: keep the cusp
            m_in = math.hypot(*v_in) or 1.0
            m_out = math.hypot(*v_out) or 1.0
            t_in.append((v_in[0] / m_in, v_in[1] / m_in))
            t_out.append((v_out[0] / m_out, v_out[1] / m_out))
        else:                                   # smooth: shared tangent
            vx = p_next[0] - p_prev[0]
            vy = p_next[1] - p_prev[1]
            m = math.hypot(vx, vy) or 1.0
            t_in.append((vx / m, vy / m))
            t_out.append((vx / m, vy / m))

    out = ["M%.1f,%.1f" % pts[0]]
    for i in range(n):
        p = pts[i]
        q = pts[(i + 1) % n]
        seg = math.hypot(q[0] - p[0], q[1] - p[1]) / 3.0
        c1 = (p[0] + t_out[i][0] * seg, p[1] + t_out[i][1] * seg)
        j = (i + 1) % n
        c2 = (q[0] - t_in[j][0] * seg, q[1] - t_in[j][1] * seg)
        out.append("C%.1f,%.1f %.1f,%.1f %.1f,%.1f" % (c1[0], c1[1], c2[0], c2[1], q[0], q[1]))
    return " ".join(out) + "Z"


def trace_component(mask):
    """All rings of a binary component as one bezier path (outer + counters).

    Rings are emitted into a single subpath list and filled evenodd, so the
    counters in B punch through without needing winding bookkeeping.
    """
    padded = np.pad(mask.astype(float), 2, mode="constant")
    rings = []
    for c in measure.find_contours(padded, 0.5):
        pts = [(float(x) - 2.0, float(y) - 2.0) for y, x in c]   # (row,col) -> (x,y)
        if len(pts) > 1 and math.hypot(pts[0][0] - pts[-1][0], pts[0][1] - pts[-1][1]) < 1e-6:
            pts.pop()
        if len(pts) < 8:
            continue
        simple = simplify_closed(pts, RDP_TOL)
        if len(simple) < 3:
            continue
        area = abs(sum(simple[i][0] * simple[(i + 1) % len(simple)][1]
                       - simple[(i + 1) % len(simple)][0] * simple[i][1]
                       for i in range(len(simple)))) / 2.0
        rings.append((area, bezier_ring(simple)))
    rings.sort(key=lambda r: -r[0])            # outer ring first
    return " ".join(d for _, d in rings), len(rings)


# ------------------------------------------------------------------ pipeline

def build():
    im = Image.open(SRC).convert("RGBA")
    a = np.array(im)
    ink = (a[..., 3] > 128) & (a[..., :3].mean(axis=2) < 128)
    H, W = ink.shape

    lab, n = ndimage.label(ink)
    comps = []
    for i, sl in enumerate(ndimage.find_objects(lab), start=1):
        m = lab[sl] == i
        y0, x0 = sl[0].start, sl[1].start
        comps.append(dict(idx=i, slice=sl, mask=m, area=int(m.sum()),
                          box=(x0, y0, sl[1].stop, sl[0].stop),
                          cx=(sl[1].start + sl[1].stop) / 2.0,
                          cy=(sl[0].start + sl[0].stop) / 2.0))

    crumbs = sorted([c for c in comps if c["area"] < CRUMB_AREA], key=lambda c: c["cx"])
    glyphs = [c for c in comps if c["area"] >= CRUMB_AREA]

    rows = [[], [], []]
    for c in glyphs:
        r = 0 if c["cy"] < ROW_SPLITS[0] else (1 if c["cy"] < ROW_SPLITS[1] else 2)
        rows[r].append(c)
    for r in rows:
        r.sort(key=lambda c: c["cx"])

    expected = [len(ids) for _, _, ids in LINES]
    got = [len(r) for r in rows]
    if got != expected:
        raise SystemExit("expected %s letters per line, traced %s -- retune "
                         "ROW_SPLITS/CRUMB_AREA" % (expected, got))

    letters = []
    masks = {}
    for (word, _text, ids), row in zip(LINES, rows):
        for lid, c in zip(ids, row):
            full = np.zeros((H, W), dtype=bool)
            full[c["slice"]] |= c["mask"]
            masks[lid] = full
            d, nrings = trace_component(full)
            letters.append(dict(id=lid, char=CHARS[lid], word=word, d=d,
                                box=[int(v) for v in c["box"]], rings=nrings))

    # Extra pieces for the intro: the second B before the bite, and the chunk
    # that comes out of it.
    whole, chunk = reconstruct_bite(masks["b1"], masks["b2"])
    extras = []
    for eid, m in (("b2whole", whole), ("bite", chunk)):
        d, nrings = trace_component(m)
        ys, xs = np.nonzero(m)
        extras.append(dict(id=eid, d=d, rings=nrings,
                           box=[int(xs.min()), int(ys.min()),
                                int(xs.max()) + 1, int(ys.max()) + 1]))

    crumb_pieces = []
    for k, c in enumerate(crumbs, start=1):
        full = np.zeros((H, W), dtype=bool)
        full[c["slice"]] |= c["mask"]
        d, _ = trace_component(full)
        crumb_pieces.append(dict(id="crumb%d" % k, d=d, box=[int(v) for v in c["box"]]))

    return (W, H), letters, crumb_pieces, extras


def union_box(boxes):
    return [min(b[0] for b in boxes), min(b[1] for b in boxes),
            max(b[2] for b in boxes), max(b[3] for b in boxes)]


# The bite is baked into the second B, so an intro cannot un-bite it without an
# unbitten shoulder to restore. The first B supplies one: it is the same letter,
# unbitten, at within a couple of pixels of the same size. The two are drawn by
# hand so they do not agree globally -- but they only need to agree inside the
# bite, where the donor contributes the missing rounded shoulder.
BITE_BOX = (495, 700, 1130, 1340)     # y0, y1, x0, x1 around the bite
DONOR_ROT = -1.0                       # b1 sits ~1 degree off b2
DONOR_DX = range(350, 376)
DONOR_DY = range(-14, 6)


def reconstruct_bite(b1, b2):
    """Return (unbitten b2, the bitten-off chunk) as masks.

    The donor is aligned by maximising coverage of b2 inside BITE_BOX while
    maximising what it adds there; only the largest added component is kept, so
    stray slivers from imperfect alignment elsewhere in the box are discarded.
    """
    y0, y1, x0, x1 = BITE_BOX
    box = np.zeros(b2.shape, dtype=bool)
    box[y0:y1, x0:x1] = True
    donor_rot = ndimage.rotate(b1.astype(float), DONOR_ROT, order=1, reshape=False) > 0.5

    best = None
    for dx in DONOR_DX:
        for dy in DONOR_DY:
            d = np.roll(np.roll(donor_rot, dy, axis=0), dx, axis=1)
            uncovered = int((b2 & ~d & box).sum())
            added = int((d & ~b2 & box).sum())
            score = uncovered * 4 - added
            if best is None or score < best[0]:
                best = (score, dx, dy)
    _, dx, dy = best
    donor = np.roll(np.roll(donor_rot, dy, axis=0), dx, axis=1)

    patched = ndimage.binary_closing(b2 | (donor & box), structure=np.ones((7, 7)))
    added = patched & ~b2
    lab, n = ndimage.label(added)
    if n == 0:
        raise SystemExit("bite reconstruction added nothing -- retune BITE_BOX/DONOR_*")
    sizes = [(int((lab == j).sum()), j) for j in range(1, n + 1)]
    chunk = lab == max(sizes)[1]
    chunk = ndimage.binary_closing(chunk, structure=np.ones((5, 5)))
    if not 6000 <= chunk.sum() <= 20000:
        raise SystemExit("bite chunk is %d px, outside the expected range -- "
                         "retune BITE_BOX/DONOR_*" % chunk.sum())
    return (b2 | chunk), chunk


# -------------------------------------------------------------------- output

def svg_doc(vb, ds, box=None):
    W, H = vb
    view = "0 0 %d %d" % (W, H)
    if box:
        view = "%d %d %d %d" % (box[0], box[1], box[2] - box[0], box[3] - box[1])
    body = "\n".join('  <path d="%s" fill="#231f20" fill-rule="evenodd"/>' % d for d in ds)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s">\n%s\n</svg>\n'
            % (view, body))


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    (W, H), letters, crumbs, extras = build()

    by_word = {}
    for l in letters:
        by_word.setdefault(l["word"], []).append(l)

    words = []
    for word, _text, _ids in LINES:
        ls = by_word[word]
        words.append(dict(id=word, text=_text, letters=[l["id"] for l in ls],
                          box=union_box([l["box"] for l in ls]),
                          ds=[l["d"] for l in ls]))
    crumb_box = union_box([c["box"] for c in crumbs])

    # --- flat SVGs
    out = os.path.join("public", "assets", "brand", "wordmark")
    write(os.path.join(out, "full.svg"),
          svg_doc((W, H), [l["d"] for l in letters] + [c["d"] for c in crumbs]))
    for w in words:
        write(os.path.join(out, "%s.svg" % w["id"]), svg_doc((W, H), w["ds"], w["box"]))
    write(os.path.join(out, "crumbs.svg"),
          svg_doc((W, H), [c["d"] for c in crumbs], crumb_box))
    for e in extras:
        write(os.path.join(out, "%s.svg" % e["id"]), svg_doc((W, H), [e["d"]], e["box"]))
    for l in letters:
        write(os.path.join(out, "letter-%s.svg" % l["id"]), svg_doc((W, H), [l["d"]], l["box"]))
    n_svg = 2 + len(words) + len(letters) + len(extras)

    # --- React components
    def box_js(b):
        return "[%d, %d, %d, %d]" % tuple(b)

    parts = []
    parts.append(
        "// The JUST NIBBLE IT wordmark, traced from\n"
        "// public/assets/brand/just-nibble-logo.png by tools/build-wordmark.py.\n"
        "// Regenerate with the script rather than editing these paths.\n"
        "//\n"
        "// Every piece shares the full-logo viewBox, so overlaying <Just/>, <Nibble/>,\n"
        "// <It/> and <Crumbs/> at the same size rebuilds the logo exactly while each\n"
        "// piece stays independently transformable. BOXES gives tight bounds per piece\n"
        "// (x0, y0, x1, y1) in that same space -- use it for transform-origin when you\n"
        "// want a word to scale or rotate about its own centre.\n"
        "\n"
        "export const VIEWBOX = '0 0 %d %d'\n"
        "export const LOGO_SIZE = { width: %d, height: %d }\n"
        "export const INK = '#231f20'\n" % (W, H, W, H))

    boxes = ["export const BOXES = {"]
    for w in words:
        boxes.append("  %s: %s," % (w["id"], box_js(w["box"])))
    boxes.append("  crumbs: %s," % box_js(crumb_box))
    for e in extras:
        boxes.append("  %s: %s," % (e["id"], box_js(e["box"])))
    for l in letters:
        boxes.append("  %s: %s," % (l["id"], box_js(l["box"])))
    boxes.append("}\n")
    parts.append("\n".join(boxes))

    parts.append(
        "// id -> letter, in reading order.\n"
        "export const LETTERS = [\n"
        + "".join("  { id: '%s', char: '%s', word: '%s' },\n"
                  % (l["id"], l["char"], l["word"]) for l in letters)
        + "]\n")

    parts.append(
        "export const PATHS = {\n"
        + "".join("  %s: '%s',\n" % (l["id"], l["d"]) for l in letters)
        + "".join("  %s: '%s',\n" % (c["id"], c["d"]) for c in crumbs)
        + "".join("  %s: '%s',\n" % (e["id"], e["d"]) for e in extras)
        + "}\n")

    parts.append(
        "// Intro pieces: the second B before the bite, and the chunk taken out\n"
        "// of it. The unbitten shoulder is reconstructed from the first B --\n"
        "// see tools/build-wordmark.py. To animate a chomp, swap UNBITTEN_B for\n"
        "// 'b2' and fly BITE away.\n"
        "export const UNBITTEN_B = 'b2whole'\n"
        "export const BITE = 'bite'\n")

    parts.append(
        "function Piece({ ids, fill, className, style, ...rest }) {\n"
        "  return (\n"
        "    <svg viewBox={VIEWBOX} className={className} style={style} aria-hidden=\"true\" {...rest}>\n"
        "      {ids.map((id) => (\n"
        "        <path key={id} d={PATHS[id]} fill={fill} fillRule=\"evenodd\" />\n"
        "      ))}\n"
        "    </svg>\n"
        "  )\n"
        "}\n")

    for w in words:
        comp = w["id"].capitalize()
        ids = ", ".join("'%s'" % i for i in w["letters"])
        parts.append(
            "// %s\n"
            "export const %s_IDS = [%s]\n"
            "export function %s({ fill = INK, ...rest }) {\n"
            "  return <Piece ids={%s_IDS} fill={fill} {...rest} />\n"
            "}\n" % (w["text"], w["id"].upper(), ids, comp, w["id"].upper()))

    crumb_ids = ", ".join("'%s'" % c["id"] for c in crumbs)
    parts.append(
        "// The crumbs flying off the bitten B.\n"
        "export const CRUMB_IDS = [%s]\n"
        "export function Crumbs({ fill = INK, ...rest }) {\n"
        "  return <Piece ids={CRUMB_IDS} fill={fill} {...rest} />\n"
        "}\n" % crumb_ids)

    parts.append(
        "// One letter, addressed by id from LETTERS.\n"
        "export function Letter({ id, fill = INK, ...rest }) {\n"
        "  return <Piece ids={[id]} fill={fill} {...rest} />\n"
        "}\n"
        "\n"
        "// The assembled wordmark.\n"
        "export function Wordmark({ fill = INK, withCrumbs = true, ...rest }) {\n"
        "  const ids = [...JUST_IDS, ...NIBBLE_IDS, ...IT_IDS]\n"
        "  return <Piece ids={withCrumbs ? [...ids, ...CRUMB_IDS] : ids} fill={fill} {...rest} />\n"
        "}\n")

    write(os.path.join("src", "components", "icons", "Wordmark.jsx"), "\n".join(parts))

    write(os.path.join("tools", "wordmark.json"), json.dumps(dict(
        viewBox="0 0 %d %d" % (W, H),
        words=[{k: w[k] for k in ("id", "text", "letters", "box")} for w in words],
        letters=[{k: l[k] for k in ("id", "char", "word", "box", "rings")} for l in letters],
        crumbs=[{k: c[k] for k in ("id", "box")} for c in crumbs],
        extras=[{k: e[k] for k in ("id", "box", "rings")} for e in extras],
    ), indent=1) + "\n")

    print("%d letters + %d crumbs + %d intro pieces traced"
          % (len(letters), len(crumbs), len(extras)))
    print("%d SVGs -> public/assets/brand/wordmark/" % n_svg)
    print("components -> src/components/icons/Wordmark.jsx")


if __name__ == "__main__":
    main()
