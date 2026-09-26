#!/usr/bin/env python3
"""Bring the bundle photography into the site.

The owner's folder carries six studio shots of the two bundles -- three each in
PDP/combo of 3/ and PDP/combo of 6/ -- and none of them were being used. Both
bundle pages were showing a single image lifted from the live site, so the
trio and the six-pack had no gallery at all while every single-flavour product
had four.

Exports a full-size webp and a thumbnail for each, named to match the product
gallery's convention so products.js can reference them the same way.

Run `python tools/build-bundle-gallery.py` from the repo root.
"""

import os

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

SRC = os.path.join("reference", "drive", "website", "PDP")
OUT = os.path.join("public", "assets", "pick")

FULL = 1200
THUMB = 320

SETS = [
    ("flipos-flavour-trio", "combo of 3", ["01.png", "02.png", "3.png"]),
    ("flipos-party-six", "combo of 6", ["01.png", "02.png", "03.png"]),
]


def export(src, stem):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    full = im.resize((FULL, round(FULL * h / w)), Image.LANCZOS) if w > FULL else im
    full.save(os.path.join(OUT, stem + ".webp"), "WEBP", quality=86, method=6)
    thumb = im.resize((THUMB, round(THUMB * h / w)), Image.LANCZOS)
    thumb.save(os.path.join(OUT, stem + "-thumb.webp"), "WEBP", quality=82, method=6)
    return (
        os.path.getsize(os.path.join(OUT, stem + ".webp")) / 1024,
        os.path.getsize(os.path.join(OUT, stem + "-thumb.webp")) / 1024,
    )


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    os.makedirs(OUT, exist_ok=True)
    for slug, folder, files in SETS:
        for i, name in enumerate(files, start=1):
            stem = "%s-%d" % (slug, i)
            a, b = export(os.path.join(SRC, folder, name), stem)
            print("  %-28s %6.1f KB  thumb %5.1f KB" % (stem + ".webp", a, b))


if __name__ == "__main__":
    main()
