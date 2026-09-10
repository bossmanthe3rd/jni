#!/usr/bin/env python3
"""Rebuild the FLIPO's pack doodles.

The doodles printed on the FLIPO's pouches were only ever available to this repo
as photographs (`public/assets/products/*-pack.webp`), where every shape is
perspective-warped across a curved pouch and carries baked-in studio lighting.
Cutting them out of the photos would yield bitmaps that cannot be recoloured or
scaled, so they are redrawn here as vectors instead, using the pack shots as
reference.

Shapes are generated rather than hand-authored: the peppers are a tapered ribbon
swept along a cubic spine, the cross-sections are polar functions and unions of
overlapping circles. That keeps the curves organic and, more usefully, keeps them
parametric -- proportions are tuned by editing one number, not by nudging dozens
of bezier handles.

Outputs (run `python tools/build-doodles.py` from the repo root):
  src/components/icons/PackDoodles.jsx   themeable React components
  public/assets/doodles/pack/*.svg       flat SVGs, one per flavour x doodle

The on-pack palette in FLAVOURS was sampled from the pack photos and nudged back
toward print values, since the photographs read a little dark and desaturated.
"""

import json
import math
import os

# --------------------------------------------------------------- path helpers

def smooth_closed(pts):
    """Closed Catmull-Rom through pts, emitted as cubic beziers."""
    n = len(pts)
    out = ["M%.2f,%.2f" % (pts[0][0], pts[0][1])]
    for i in range(n):
        p0 = pts[(i - 1) % n]; p1 = pts[i]; p2 = pts[(i + 1) % n]; p3 = pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        out.append("C%.2f,%.2f %.2f,%.2f %.2f,%.2f" % (c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]))
    return " ".join(out) + "Z"


def bez(p, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = p
    u = 1 - t
    return (u ** 3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3,
            u ** 3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3)


def bezd(p, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = p
    u = 1 - t
    return (3 * u * u * (x1 - x0) + 6 * u * t * (x2 - x1) + 3 * t * t * (x3 - x2),
            3 * u * u * (y1 - y0) + 6 * u * t * (y2 - y1) + 3 * t * t * (y3 - y2))


def tapered(ctrl, wfn, n=32, inset=0.0, sharp_tip=False):
    """Outline of a tapered ribbon swept along a cubic spine.

    Samples cluster toward t=1 so the tip keeps its detail; sharp_tip collapses
    the last pair onto the spine endpoint and repeats it, so the Catmull-Rom
    cusps into a point there instead of rounding it off into a stub.
    """
    left, right = [], []
    for i in range(n):
        u = i / (n - 1.0)
        t = 1 - (1 - u) ** 1.4
        if sharp_tip and i == n - 1:
            break
        x, y = bez(ctrl, t)
        dx, dy = bezd(ctrl, t)
        m = math.hypot(dx, dy) or 1e-9
        nx, ny = -dy / m, dx / m
        w = max(wfn(t) / 2 - inset, 0.5)
        left.append((x + nx * w, y + ny * w))
        right.append((x - nx * w, y - ny * w))
    if sharp_tip:
        tip = bez(ctrl, 1.0)
        return left + [tip, tip, tip] + right[::-1]
    return left + right[::-1]


def polar(cx, cy, fn, n=48, phase=0.0, sy=1.0):
    pts = []
    for i in range(n):
        th = 2 * math.pi * i / n + phase
        r = fn(th)
        pts.append((cx + r * math.cos(th), cy + r * math.sin(th) * sy))
    return pts


def union_circles(cx, cy, lobes, n=84):
    """Outline of overlapping circles: the farthest ray hit at each angle.

    lobes is a list of (distance-from-centre, angle, radius).
    """
    pts = []
    for i in range(n):
        th = 2 * math.pi * i / n
        best = 0.0
        for (d, ang, rho) in lobes:
            phi = th - ang
            s = d * math.sin(phi)
            if abs(s) <= rho:
                best = max(best, d * math.cos(phi) + math.sqrt(rho * rho - s * s))
        pts.append((cx + best * math.cos(th), cy + best * math.sin(th)))
    return pts


# Roles map onto the pack's four inks: the flavour fill, the darker stem/cap,
# the keyline, and the pale seed.
def el(role, d):
    return {"role": role, "d": d}


def bean(cx, cy, r, rot, squash=0.66):
    """A plump kidney seed, as drawn on the pack."""
    pts = polar(0, 0, lambda th: r * (1 + 0.13 * math.cos(2 * th)), n=28, sy=squash)
    ca, sa = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    pts = [(cx + x * ca - y * sa, cy + x * sa + y * ca) for x, y in pts]
    return el("seed", smooth_closed(pts))


# ------------------------------------------------------------------- doodles

DOODLES = {}

# Plump through the shoulder, then a decisive taper to a point.
prof = lambda W: (lambda t: W * (1 - t ** 3.2) ** 0.62)


def stem_hook(wide, narrow, ctrl):
    """The pack's stem: a slim tapered curl rising off the shoulder."""
    return tapered(ctrl, lambda t: wide - (wide - narrow) * t, 26, sharp_tip=True)


# 1. whole chilli -- long, comma-curved, slim hook stem
CB = [(86, 74), (34, 136), (58, 204), (30, 248)]
body_w = prof(52)
half_w = prof(64)          # halved peppers read wider on the pack
stem = stem_hook(14, 4.2, [(86, 78), (88, 30), (128, 22), (112, 58)])
calyx = polar(86, 71, lambda th: 16 + 2.6 * math.cos(5 * th), n=40, sy=0.66)

DOODLES["chilli-whole"] = dict(vb=(150, 258), els=[
    el("stem", smooth_closed(stem)),
    el("fill", smooth_closed(tapered(CB, body_w, sharp_tip=True))),
    el("stem", smooth_closed(calyx)),
])

# 2. halved chilli -- cavity wall, with the seeds banked along one edge
# rather than laddered down the centre, which is how the pack draws it.
half_seeds = []
for t, jitter, size in [(0.16, 7, 10.4), (0.29, -4, 9.8), (0.42, 9, 10.1),
                        (0.55, -6, 9.2), (0.67, 5, 8.2)]:
    x, y = bez(CB, t)
    dx, dy = bezd(CB, t)
    m = math.hypot(dx, dy) or 1
    nx, ny = -dy / m, dx / m
    off = half_w(t) * 0.26
    half_seeds.append(bean(x + nx * off, y + ny * off, size,
                           math.degrees(math.atan2(dy, dx)) + 74 + jitter))

DOODLES["chilli-half"] = dict(vb=(150, 258), els=[
    el("stem", smooth_closed(stem)),
    el("fill", smooth_closed(tapered(CB, half_w, sharp_tip=True))),
    el("line", smooth_closed(tapered(CB, half_w, inset=11.0, sharp_tip=True))),
] + half_seeds + [
    el("stem", smooth_closed(calyx)),
])

# 3. chilli slice -- round cross-section, seeds clustered loosely inside the
# inner wall (not spaced evenly around it).
DOODLES["chilli-slice"] = dict(vb=(148, 148), els=[
    el("fill", smooth_closed(polar(74, 74, lambda th: 64 + 1.8 * math.cos(3 * th), n=48))),
    el("line", smooth_closed(polar(74, 74, lambda th: 42 + 2.6 * math.cos(3 * th + 0.7), n=48))),
] + [bean(74 + r * math.cos(a), 74 + r * math.sin(a), sz, math.degrees(a) + 90 + j)
     for a, r, sz, j in [(-1.30, 22, 11.6, 12), (-0.34, 15, 10.8, -18),
                         (0.62, 24, 11.2, 8), (1.75, 17, 10.4, 22),
                         (2.62, 23, 11.0, -10)]])

# 4. pepper cross-section -- four fat lobes, each with its own chamber wall,
# three seeds in the clear middle. Per-lobe variance keeps it hand-drawn
# rather than stamped, and the generous overlap keeps the notches shallow.
VAR = [(1.00, 1.00, 0.00), (1.06, 0.95, 0.05), (0.95, 1.04, -0.04), (1.02, 0.99, 0.03)]
lobes = [(28 * f, math.pi / 4 + k * math.pi / 2 + j, 38 * g)
         for k, (f, g, j) in enumerate(VAR)]
chambers = []
for k, (f, g, j) in enumerate(VAR):
    a = math.pi / 4 + k * math.pi / 2 + j
    chambers.append(el("line", smooth_closed(polar(
        74 + 36 * f * math.cos(a), 74 + 36 * f * math.sin(a),
        lambda th, g=g: 19 * g * (1 + 0.07 * math.cos(2 * th)), n=28))))

DOODLES["pepper-section"] = dict(vb=(148, 148), els=(
    [el("fill", smooth_closed(union_circles(74, 74, lobes)))]
    + chambers
    + [bean(74 + 9.5 * math.cos(a), 74 + 9.5 * math.sin(a), 9.0, math.degrees(a) + 20)
       for a in [-2.36, 0.0, 2.36]]))

# 5. jalapeno -- shorter, broad-shouldered, rounded point
JB = [(78, 82), (54, 134), (72, 186), (60, 228)]
DOODLES["jalapeno"] = dict(vb=(154, 244), els=[
    el("stem", smooth_closed(stem_hook(15, 4.6, [(78, 86), (82, 34), (122, 26), (106, 62)]))),
    el("fill", smooth_closed(tapered(JB, lambda t: 82 * (1 - t ** 4.0) ** 0.44, sharp_tip=True))),
    el("stem", smooth_closed(polar(78, 79, lambda th: 19 + 2.8 * math.cos(5 * th), n=40, sy=0.64))),
])

# 6. loose seed -- the confetti dot scattered between the larger doodles
DOODLES["seed"] = dict(vb=(34, 34), els=[bean(17, 17, 13.5, -20, 0.74)])


# ------------------------------------------------------------------ palettes
# Sampled from the pack photographs, corrected back toward print.
FLAVOURS = {
    "jalapeno-kick": dict(ground="#0b5c2e", fill="#c3d92e", stem="#0e4a26",
                          line="#0d3f22", seed="#dfe7bd"),
    "peri-peri-punch": dict(ground="#5c0d16", fill="#c8102e", stem="#4a0a11",
                            line="#3d060c", seed="#e8c7c1"),
    "sweet-chilli-rush": dict(ground="#c8180d", fill="#f59120", stem="#7a1408",
                              line="#5a0f08", seed="#f7ead9"),
}

# Keyline weight, in the doodles' own coordinate units. All six doodles share
# one coordinate space, so a single value reads consistently across the set
# provided each is rendered at a size proportional to its viewBox.
STROKE = 4.3

COMPONENTS = [
    ("ChilliWhole", "chilli-whole"),
    ("ChilliHalved", "chilli-half"),
    ("ChilliSlice", "chilli-slice"),
    ("PepperSection", "pepper-section"),
    ("Jalapeno", "jalapeno"),
    ("ChilliSeed", "seed"),
]


# -------------------------------------------------------------------- output

def svg_file(doodle, colours):
    """Standalone SVG with concrete colours, usable as a plain <img> src."""
    w, h = doodle["vb"]
    rows = []
    for e in doodle["els"]:
        fill = "none" if e["role"] == "line" else colours[e["role"]]
        rows.append('  <path d="%s" fill="%s" stroke="%s" stroke-width="%s" '
                    'stroke-linejoin="round" stroke-linecap="round"/>'
                    % (e["d"], fill, colours["line"], STROKE))
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" '
            'height="%d">\n%s\n</svg>\n' % (w, h, w, h, "\n".join(rows)))


def jsx_component(component, key, doodle):
    w, h = doodle["vb"]
    rows = []
    for e in doodle["els"]:
        fill = '"none"' if e["role"] == "line" else "{c.%s}" % e["role"]
        rows.append(
            '      <path\n'
            '        d="%s"\n'
            '        fill=%s\n'
            '        stroke={c.line}\n'
            '        strokeWidth={weight}\n'
            '        strokeLinejoin="round"\n'
            '        strokeLinecap="round"\n'
            '      />' % (e["d"], fill))
    return (
        '// %s\n'
        'export function %s({ flavour = DEFAULT_FLAVOUR, palette, className = \'\', weight = STROKE }) {\n'
        '  const c = palette || packPalettes[flavour] || packPalettes[DEFAULT_FLAVOUR]\n'
        '  return (\n'
        '    <svg viewBox="0 0 %d %d" className={className} aria-hidden="true">\n'
        '%s\n'
        '    </svg>\n'
        '  )\n'
        '}\n' % (key, component, w, h, "\n".join(rows)))


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # --- flat SVGs, one per flavour x doodle
    out_dir = os.path.join(root, "public", "assets", "doodles", "pack")
    count = 0
    for flavour, colours in FLAVOURS.items():
        for key, doodle in DOODLES.items():
            write(os.path.join(out_dir, "%s-%s.svg" % (flavour, key)),
                  svg_file(doodle, colours))
            count += 1

    # --- React components
    ratios = ", ".join("'%s': %.4f" % (k, v["vb"][0] / float(v["vb"][1]))
                       for k, v in DOODLES.items())
    header = (
        "// FLIPO's pack doodles, redrawn as vectors from the pouch photography in\n"
        "// public/assets/products/*-pack.webp. Generated by tools/build-doodles.py --\n"
        "// edit the generator and re-run it rather than editing the paths here.\n"
        "//\n"
        "// Every doodle shares one coordinate space, so `weight` reads consistently\n"
        "// across the set as long as each is rendered at a size proportional to its\n"
        "// viewBox. ASPECT gives width/height for that.\n"
        "\n"
        "export const packPalettes = {\n"
        + "".join(
            "  '%s': { ground: '%s', fill: '%s', stem: '%s', line: '%s', seed: '%s' },\n"
            % (f, c["ground"], c["fill"], c["stem"], c["line"], c["seed"])
            for f, c in FLAVOURS.items())
        + "}\n\n"
        "const DEFAULT_FLAVOUR = 'jalapeno-kick'\n\n"
        "// Keyline weight in doodle units.\n"
        "export const STROKE = %s\n\n"
        "// width / height, for sizing the set proportionally.\n"
        "export const ASPECT = { %s }\n\n"
        "export const doodleNames = [%s]\n\n"
        % (STROKE, ratios,
           ", ".join("'%s'" % k for _, k in COMPONENTS))
    )
    body = "\n".join(jsx_component(comp, key, DOODLES[key]) for comp, key in COMPONENTS)
    registry = (
        "\n// Name -> component, for scattering doodles from data.\n"
        "export const doodleComponents = {\n"
        + "".join("  '%s': %s,\n" % (key, comp) for comp, key in COMPONENTS)
        + "}\n")
    write(os.path.join(root, "src", "components", "icons", "PackDoodles.jsx"),
          header + body + registry)

    # --- machine-readable copy, for tooling that wants the raw paths
    write(os.path.join(root, "tools", "doodles.json"),
          json.dumps({k: dict(viewBox="0 0 %d %d" % v["vb"], elements=v["els"])
                      for k, v in DOODLES.items()}, indent=1) + "\n")

    print("%d SVGs -> public/assets/doodles/pack/" % count)
    print("%d components -> src/components/icons/PackDoodles.jsx" % len(COMPONENTS))


if __name__ == "__main__":
    main()
