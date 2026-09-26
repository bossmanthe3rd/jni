#!/usr/bin/env python3
"""Export the launch-offer banner in the two shapes the site needs.

Source: reference/captures/4.jpeg -- the same composition as the brand
folder's `pre order offer.png`, in a cleaner 1600x900 cut.

Two crops, not one image scaled twice. The artwork runs content to all four
edges, so squeezing the 16:9 frame onto a phone leaves the price at about forty
pixels tall and the sticky notes as unreadable garnish:

  wide   1600x800, the desk foreground trimmed. Everything that carries the
         offer sits above y=800; below it is atmosphere.
  narrow 1160x870 at 4:3, cropped in to the offer itself -- the struck 949,
         the 299, the packet count, the launch badge, the timer and all six
         packs, with the plant and the books dropped.

Run `python tools/build-launch-banner.py` from the repo root.
"""

import os

from PIL import Image

SRC = os.path.join("reference", "captures", "4.jpeg")
OUT = os.path.join("public", "assets", "promo")

CUTS = [
    ("launch-offer-wide.webp", (0, 5, 1600, 805), 1600),
    ("launch-offer.webp", (240, 0, 1400, 870), 1160),
]


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)
    os.makedirs(OUT, exist_ok=True)
    im = Image.open(SRC).convert("RGB")
    for name, box, width in CUTS:
        cut = im.crop(box)
        if cut.width > width:
            cut = cut.resize((width, round(width * cut.height / cut.width)), Image.LANCZOS)
        path = os.path.join(OUT, name)
        cut.save(path, "WEBP", quality=88, method=6)
        print("  %-26s %4dx%-4d  %6.1f KB  aspect %.3f"
              % (name, cut.width, cut.height, os.path.getsize(path) / 1024, cut.width / cut.height))


if __name__ == "__main__":
    main()
