"""
Derive the hero's desk-scene assets from the raw design source.

Two families come out of this:

  public/assets/hero/pouch-<slug>.webp
      The pack with no background at all. Illustrator saved each pack shot
      with a soft mask alongside it (PDF xrefs 491/492/493 and their smasks),
      so compositing the two gives a clean cut-out -- far better than keying
      the studio backdrop out of the flattened JPEG.

  public/assets/hero/confetti/*.webp
      The speed lines, gold marks and ringed dots that ring the pack on every
      old campaign banner. They are connected components on the banner's cream
      panel, so they lift out by labelling anything that is not the panel and
      keeping the pieces that are doodle-sized and clear of the pouch.

The banners carry the SAME confetti on all three flavours -- only one small
triangle is flavour-coloured -- so the shared marks are written once and the
triangle is written per flavour.

Needs the Drive originals and reference/Websiteflipos1.ai, neither of which is
committed. Re-run only when the source artwork changes.
"""

import os
import numpy as np
import pymupdf
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "assets", "hero")
CONF = os.path.join(OUT, "confetti")
AI = os.path.join(ROOT, "reference", "Websiteflipos1.ai")
DRIVE = os.path.join(ROOT, "reference", "drive", "website")

# xref -> slug. Each of these has a soft mask sitting next to it.
POUCH = {491: ("sweet-chilli-rush", 509), 492: ("peri-peri-punch", 510), 493: ("jalapeno-kick", 511)}

BANNER = {
    "jalapeno-kick": "01-Jalapeno kick.png",
    "sweet-chilli-rush": "01- sweet chilli.png",
    "peri-peri-punch": "01.png",
}

# Which labelled components to keep, by rank within the jalapeno banner. The
# three banners label identically, so one pass names them all.
SHARED = {3: "line-a", 4: "line-b", 5: "line-c", 7: "line-d", 8: "gold-a", 9: "gold-b", 1: "dot-a", 12: "dot-b"}
TRIANGLE = {"jalapeno-kick": 13, "sweet-chilli-rush": 13, "peri-peri-punch": 14}

PANEL = np.array([244, 244, 212])  # the banners' cream panel


def pouches():
    doc = pymupdf.open(AI)
    for xref, (slug, smask) in POUCH.items():
        cut = pymupdf.Pixmap(pymupdf.Pixmap(doc, xref), pymupdf.Pixmap(doc, smask))
        tmp = os.path.join(OUT, f".{slug}.png")
        cut.save(tmp)
        im = Image.open(tmp).convert("RGBA")
        im = im.crop(im.getchannel("A").getbbox())
        im.thumbnail((820, 3000))
        im.save(os.path.join(OUT, f"pouch-{slug}.webp"), quality=92, method=6)
        os.remove(tmp)
        print(f"pouch-{slug}.webp  {im.size}")


def components(slug):
    """Doodle-sized pieces of the banner's cream panel, biggest first."""
    im = Image.open(os.path.join(DRIVE, BANNER[slug])).convert("RGB")
    w, h = im.size
    zone = im.crop((int(w * 0.44), int(h * 0.09), w, int(h * 0.73)))
    d = np.abs(np.asarray(zone, dtype=np.int16) - PANEL).sum(axis=2)
    ink = d > 70
    lab, n = ndimage.label(ink)
    sizes = ndimage.sum(ink, lab, range(1, n + 1))
    keep = []
    for k, (sy, sx) in enumerate(ndimage.find_objects(lab)):
        bw, bh = sx.stop - sx.start, sy.stop - sy.start
        cx, cy = (sx.start + sx.stop) // 2, (sy.start + sy.stop) // 2
        if not (70 <= bw <= 1300 and 70 <= bh <= 1300) or sizes[k] < 4500:
            continue
        if 1380 <= cx <= 3080 and cy <= 2700:  # printed on the pouch itself
            continue
        keep.append((k, sx, sy, int(sizes[k])))
    keep.sort(key=lambda t: -t[3])
    return zone, lab, keep


def sprite(zone, lab, k, sx, sy, cap):
    sub = np.asarray(zone.crop((sx.start, sy.start, sx.stop, sy.stop)).convert("RGBA")).copy()
    sub[:, :, 3] = np.where(lab[sy, sx] == k + 1, 255, 0).astype(np.uint8)
    im = Image.fromarray(sub)
    im.thumbnail((cap, cap))
    return im


def confetti():
    zone, lab, keep = components("jalapeno-kick")
    for rank, name in SHARED.items():
        k, sx, sy, _ = keep[rank]
        sprite(zone, lab, k, sx, sy, 420).save(os.path.join(CONF, f"{name}.webp"), quality=92, method=6)
        print(f"confetti/{name}.webp")
    for slug, rank in TRIANGLE.items():
        zone, lab, keep = components(slug)
        k, sx, sy, _ = keep[rank]
        sprite(zone, lab, k, sx, sy, 240).save(os.path.join(CONF, f"tri-{slug}.webp"), quality=92, method=6)
        print(f"confetti/tri-{slug}.webp")


if __name__ == "__main__":
    os.makedirs(CONF, exist_ok=True)
    pouches()
    confetti()
