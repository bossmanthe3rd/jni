"""
Cut each flavour's desk objects out of reference/Websiteflipos1.ai.

Artboard 2 of the .ai holds the three hero banners side by side. Each one
draws a desk across its foot with that flavour's props on it -- a keyboard and
mouse for jalapeno, a folder and calculator for sweet chilli, an envelope and
a mug for peri peri -- and then paints a dark front wave OVER the lower half
of every prop.

An earlier version of this tool cut the props out of the flattened banner
PNGs, where that wave had already buried them, so it had to trim each prop at
the wave line and every sprite came out sliced across its base. The .ai still
has each prop as whole vector paths underneath the wave. So this rebuilds the
chosen paths onto a blank page (the wave is simply never drawn) and
rasterises them with a transparent background: every prop comes out complete.

Props are chosen by content-stream sequence number (their paint order, which
is also how the artist grouped them) and by an x-range so a prop never picks
up a neighbour. `edge` props are cut by the banner's own frame in the source
art -- the keyboard runs off the left edge, the mouse off the right -- so
they still have to sit against that edge of the layout.

Needs reference/Websiteflipos1.ai (not committed). Re-run only if the art
changes.
"""
import os
import sys

import pymupdf
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AI = os.path.join(ROOT, "reference", "Websiteflipos1.ai")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "public", "assets", "hero", "desk")
CAP = 900  # longest side of each sprite, px

# slug -> [(name, seq_lo, seq_hi, x0, x1, edge)], all inclusive, in .ai points.
JOBS = {
    "sweet-chilli-rush": [
        ("folder", 59, 63, 2680, 3340, "l"),
        ("clips", 153, 155, 3340, 3625, None),
        ("pens", 43, 57, 3615, 3870, None),
        ("calculator", 11, 38, 4375, 4640, "r"),
    ],
    "peri-peri-punch": [
        ("envelope", 390, 402, 320, 810, "l"),
        ("pencil", 405, 413, 812, 925, None),
        ("pen", 379, 383, 960, 1045, None),
        ("clips", 386, 388, 1100, 1315, None),
        ("mug", 415, 423, 1960, 2280, "r"),
    ],
    "jalapeno-kick": [
        ("keyboard", 534, 565, 5025, 5380, "l"),
        ("clipboard", 594, 598, 5450, 5795, None),
        ("pens", 578, 592, 5795, 5985, None),
        ("mouse", 569, 576, 6680, 6980, "r"),
    ],
}


def cap_join(v):
    return max(v) if isinstance(v, (tuple, list)) else (v or 0)


def build(drawings, pick):
    """Redraw the picked paths, in their original paint order, on a blank page."""
    doc = pymupdf.open()
    page = doc.new_page(width=8000, height=2400)
    sh = page.new_shape()
    box = None
    for x in sorted(pick, key=lambda d: d["seqno"]):
        for it in x["items"]:
            if it[0] == "l":
                sh.draw_line(it[1], it[2])
            elif it[0] == "c":
                sh.draw_bezier(it[1], it[2], it[3], it[4])
            elif it[0] == "re":
                sh.draw_rect(it[1])
            elif it[0] == "qu":
                sh.draw_quad(it[1])
        stroke = x.get("color") if x["type"] != "f" else None
        fill = x.get("fill") if x["type"] != "s" else None
        w = x.get("width") or 0
        sh.finish(
            fill=fill,
            color=stroke,
            width=w,
            even_odd=x.get("even_odd", False),
            closePath=x.get("closePath", False),
            fill_opacity=x.get("fill_opacity") or 1,
            stroke_opacity=x.get("stroke_opacity") or 1,
            lineCap=cap_join(x.get("lineCap")),
            lineJoin=cap_join(x.get("lineJoin")),
        )
        r = pymupdf.Rect(x["rect"])
        r.x0 -= w; r.y0 -= w; r.x1 += w; r.y1 += w
        box = r if box is None else box | r
    sh.commit()
    return doc, page, box


def main():
    os.makedirs(OUT, exist_ok=True)
    drawings = pymupdf.open(AI)[1].get_drawings()
    for slug, props in JOBS.items():
        print(f"\n{slug}")
        for name, lo, hi, x0, x1, edge in props:
            pick = [
                d for d in drawings
                if lo <= d["seqno"] <= hi
                and x0 <= (d["rect"].x0 + d["rect"].x1) / 2 <= x1
                and d["rect"].y1 > 900
            ]
            if not pick:
                print(f"   {name:<10} nothing found")
                continue
            doc, page, box = build(drawings, pick)
            scale = min(6, CAP / max(box.width, box.height)) * 1.6
            pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale), clip=box, alpha=True)
            im = Image.frombytes("RGBA", (pix.width, pix.height), pix.samples)
            im = im.crop(im.getchannel("A").getbbox())
            im.thumbnail((CAP, CAP), Image.LANCZOS)
            im.save(os.path.join(OUT, f"{slug}--{name}.webp"), quality=92, method=6)
            tag = f"edge:{edge}" if edge else "whole"
            print(f"   {name:<10} {im.size[0]:>3}x{im.size[1]:<3} {tag}  ({len(pick)} paths)")


if __name__ == "__main__":
    main()
