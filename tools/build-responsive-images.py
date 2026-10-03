#!/usr/bin/env python3
"""Cut smaller copies of the site's raster art, for srcset.

Most of the art in public/assets is drawn at print-ish sizes -- the hero
pouches are 820 px wide, the flavour packs 1254, the PDP shots 2000 -- and is
shown at a fraction of that: the front pouch on a phone is about 160 CSS px.
Every reader was downloading and decoding the full file regardless.

This writes `<name>-<width>w.<ext>` beside each source for every rung of
LADDER narrower than it, and a manifest at src/data/responsiveImages.json
mapping each source's public URL to its intrinsic size and the widths cut.
src/lib/responsiveImage.js reads the manifest, so a component only names the
original file and gets `srcSet`, `width` and `height` back -- the width and
height being what stops an image that has not arrived yet from collapsing to
nothing and shoving the layout when it does.

The copies keep the source's own format (WebP stays WebP, PNG stays PNG, a
JPEG stays JPEG) so nothing changes for browsers or for transparency, and a
copy that comes out no smaller than the next size up is dropped. Re-running is
safe: sources are never touched, copies are overwritten.

Run `python tools/build-responsive-images.py` from the repo root.
"""

import json
import os
import re

from PIL import Image

PUBLIC = "public"
MANIFEST = os.path.join("src", "data", "responsiveImages.json")

# Folders under public/ whose raster art is shown smaller than it is drawn.
# Small confetti and icon files are left alone: their copies would save bytes
# no one would notice and cost a request header each.
ROOTS = [
    "assets/hero",
    "assets/products",
    "assets/pick",
    "assets/promo",
    "assets/why-flipos",
    "assets/brand",
    "assets/doodles",
]

LADDER = [320, 640, 960, 1400]
# A rung is only cut if it is meaningfully narrower than the source.
MIN_STEP = 0.85
# Below this the source is already about as small as it is shown.
MIN_SOURCE_W = 360
MIN_SOURCE_BYTES = 24 * 1024

VARIANT_RE = re.compile(r"-\d+w\.(webp|png|jpe?g)$", re.I)


def save(img, path, fmt):
    if fmt == "WEBP":
        img.save(path, "WEBP", quality=82, method=6)
    elif fmt == "PNG":
        img.save(path, "PNG", optimize=True)
    else:
        img.convert("RGB").save(path, "JPEG", quality=82, optimize=True, progressive=True)


def main():
    manifest = {}
    for root in ROOTS:
        for dirpath, _, files in os.walk(os.path.join(PUBLIC, root)):
            for name in sorted(files):
                if VARIANT_RE.search(name) or name.endswith("-thumb.webp"):
                    continue
                stem, ext = os.path.splitext(name)
                if ext.lower() not in (".webp", ".png", ".jpg", ".jpeg"):
                    continue
                src = os.path.join(dirpath, name)
                with Image.open(src) as im:
                    fmt = im.format
                    w, h = im.size
                    if fmt not in ("WEBP", "PNG", "JPEG"):
                        continue
                    url = "/" + os.path.relpath(src, PUBLIC).replace(os.sep, "/")
                    big_enough = w >= MIN_SOURCE_W and os.path.getsize(src) >= MIN_SOURCE_BYTES
                    last_bytes = os.path.getsize(src)
                    rungs = [r for r in LADDER if r <= w * MIN_STEP] if big_enough else []
                    cut = []
                    # Widest first, so each copy can be checked against the
                    # one above it.
                    for rung in reversed(rungs):
                        out = os.path.join(dirpath, f"{stem}-{rung}w{ext}")
                        small = im.resize((rung, round(h * rung / w)), Image.LANCZOS)
                        save(small, out, fmt)
                        size = os.path.getsize(out)
                        if size >= last_bytes * 0.92:
                            os.remove(out)
                            continue
                        last_bytes = size
                        cut.append(rung)
                    # [width, height, [rungs]] -- the copy for rung r is the
                    # source's own URL with -<r>w before the extension.
                    manifest[url] = [w, h, sorted(cut)]

    os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(dict(sorted(manifest.items())), f, separators=(",", ":"))
        f.write("\n")
    total = sum(len(e[2]) for e in manifest.values())
    print(f"{len(manifest)} sources, {total} variants -> {MANIFEST}")


if __name__ == "__main__":
    main()
