#!/usr/bin/env python3
"""Export the owner's own Why Flipo's icons into the site's asset slots.

The four tiles were already image-driven (site.js points at
/assets/why-flipos/*.webp), so this is a straight swap of the artwork behind
them -- no markup changes. The site's own labels stay as HTML text.

The source PNGs have their labels baked in, in white, for the black section
they were designed on. The site sets those tiles on a dark panel but renders
the wording itself, so the white is dropped and the icon cropped out of it --
otherwise every tile would carry a second, lower-resolution copy of its own
caption.

Run `python tools/build-why-icons.py` from the repo root.
"""

import os

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

SRC = os.path.join("reference", "drive", "website", "game assets")
OUT = os.path.join("public", "assets", "why-flipos")
SIZE = 512

PAIRS = [
    ("Asset 7.png", "bold-flavour.webp"),
    ("Asset 8.png", "desk-crunch.webp"),
    ("Asset 9.png", "creative-sidekick.webp"),
    ("BRAIN-01.png", "brain-break.webp"),
]


def icon_only(path):
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im).astype(int)
    rgb, alpha = a[..., :3], a[..., 3]
    opaque = alpha > 120
    label = opaque & (rgb.min(axis=2) > 190)   # the baked-in white caption
    keep = opaque & ~label

    out = np.asarray(im).copy()
    out[..., 3] = np.where(keep, out[..., 3], 0)
    ys, xs = np.nonzero(keep)
    crop = Image.fromarray(out).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))

    # Square, so the four tiles share one optical size however wide the mark is.
    side = max(crop.size)
    pad = int(side * 0.06)
    sq = Image.new("RGBA", (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    sq.alpha_composite(crop, (pad + (side - crop.width) // 2, pad + (side - crop.height) // 2))
    return sq.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    for src, dest in PAIRS:
        icon = icon_only(os.path.join(SRC, src))
        path = os.path.join(OUT, dest)
        icon.save(path, "WEBP", quality=92, method=6)
        print("  %-16s -> %-24s %5.1f KB" % (src, dest, os.path.getsize(path) / 1024))


if __name__ == "__main__":
    main()
