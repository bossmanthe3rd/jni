#!/usr/bin/env python3
"""Draws the FLIPO's chip mascot pose sheet.

The mascot is built from the brand's own parts, not invented alongside them:

  * The body is the actual product - a round scalloped waffle disc, the shape in
    public/assets/products/flipos-collection.webp - not a wavy potato crisp.
  * The eyes are the site's existing googly-eye motif (white sclera, ink
    keyline, ink pupil) already used in components/home/FlavourGrid.jsx.
  * Putting a face on food is established pack language: every pouch has little
    chilli characters with eyes and dot mouths printed on it.
  * The teal motion darts are lifted from public/assets/doodles/Asset_4.png,
    which is the brand's own speed mark.
  * The seasoning dust takes the live flavour's colour, so the mascot re-seasons
    as the reader scrolls the flavour stage instead of clashing with it.

Writes design/mascot/flip-v1.html; render it to PNG with headless Chrome.
"""

import math
import os
import random

# --- palette ---------------------------------------------------------------
INK = '#0d2818'
CREAM = '#fbf6d0'
FOAM = '#f5f0dc'
SUNSHINE = '#f3c63b'
TEAL = '#4db8ae'

# The neutral chip, plus one seasoning per flavour. `base` shifts with the
# seasoning because the product does: the jalapeno chips are pale gold and the
# peri ones are nearly brick.
CHIP = {'base': '#e8b34a', 'lattice': '#c88a26', 'rim': '#b87a1c'}
FLAVOURS = [
    {'slug': 'jalapeno-kick', 'label': 'Jalapeño Kick',
     'base': '#e4c552', 'lattice': '#bfa130', 'rim': '#a88c1e',
     'dust': '#77d21c', 'dust_dark': '#4f8f12'},
    {'slug': 'sweet-chilli-rush', 'label': 'Sweet Chilli Rush',
     'base': '#e2903a', 'lattice': '#bd6d1c', 'rim': '#a85c14',
     'dust': '#ef3f23', 'dust_dark': '#b02a13'},
    {'slug': 'peri-peri-punch', 'label': 'Peri Peri Punch',
     'base': '#d9702f', 'lattice': '#b25419', 'rim': '#9c4512',
     'dust': '#c8102e', 'dust_dark': '#8e0a20'},
]

R = 95          # body radius, in mascot units
KEY = 6.0       # keyline weight on the body
LIMB = 15.0     # limb stroke weight


# --- geometry --------------------------------------------------------------
def _catmull_closed(pts):
    """Smooth closed cubic through pts, so the rim reads hand-drawn."""
    n = len(pts)
    d = 'M%.2f,%.2f' % pts[0]
    for i in range(n):
        p0, p1, p2, p3 = pts[(i - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6.0, p1[1] + (p2[1] - p0[1]) / 6.0)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6.0, p2[1] - (p3[1] - p1[1]) / 6.0)
        d += ' C%.2f,%.2f %.2f,%.2f %.2f,%.2f' % (c1 + c2 + p2)
    return d + ' Z'


def wavy_disc(r=R, lobes=9, amp=0.030, n=44, seed=7):
    """The chip's rim: round, with the gentle scallop the fried disc has."""
    rnd = random.Random(seed)
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        rr = r * (1 + amp * math.sin(lobes * t) + rnd.uniform(-0.010, 0.010))
        pts.append((rr * math.cos(t), rr * math.sin(t)))
    return _catmull_closed(pts)


BODY = wavy_disc()
BODY_INNER = wavy_disc(r=R - 11, lobes=9, amp=0.026, seed=7)


def lattice(colour, clip_id):
    """The waffle cross-hatch pressed into the chip."""
    out = ['<g clip-path="url(#%s)" stroke="%s" stroke-width="4.5" '
           'stroke-linecap="round" opacity="0.5">' % (clip_id, colour)]
    for angle in (34, -34):
        a = math.radians(angle)
        dx, dy = math.cos(a), math.sin(a)
        nx, ny = -dy, dx
        step = 17
        for k in range(-8, 9):
            cx, cy = nx * k * step, ny * k * step
            out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f"/>' % (
                cx - dx * R * 1.2, cy - dy * R * 1.2,
                cx + dx * R * 1.2, cy + dy * R * 1.2))
    out.append('</g>')
    return ''.join(out)


def speckles(dust, dust_dark, clip_id, seed=3):
    """Seasoning. Deterministic so the mascot is the same every render."""
    rnd = random.Random(seed)
    out = ['<g clip-path="url(#%s)">' % clip_id]
    for i in range(26):
        t = rnd.uniform(0, 2 * math.pi)
        rad = R * math.sqrt(rnd.uniform(0, 1)) * 0.88
        x, y = rad * math.cos(t), rad * math.sin(t)
        rx = rnd.uniform(2.6, 5.4)
        out.append('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s" '
                   'opacity="%.2f" transform="rotate(%.0f %.1f %.1f)"/>' % (
                       x, y, rx, rx * 0.7,
                       dust if i % 3 else dust_dark,
                       rnd.uniform(0.55, 0.95), rnd.uniform(0, 180), x, y))
    out.append('</g>')
    return ''.join(out)


# --- parts -----------------------------------------------------------------
def limb(start, ctrl, end, width=LIMB):
    return ('<path d="M%.1f,%.1f Q%.1f,%.1f %.1f,%.1f" fill="none" stroke="%s" '
            'stroke-width="%.1f" stroke-linecap="round"/>' % (
                start[0], start[1], ctrl[0], ctrl[1], end[0], end[1], INK, width))


def hand(pos, colour, r=18):
    return ('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s" stroke="%s" '
            'stroke-width="5"/>' % (pos[0], pos[1], r, colour, INK))


def foot(pos, colour, rot=0, rx=26, ry=15):
    return ('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s" '
            'stroke="%s" stroke-width="5" transform="rotate(%.0f %.1f %.1f)"/>'
            % (pos[0], pos[1], rx, ry, colour, INK, rot, pos[0], pos[1]))


def eyes(pupil=(0, 0), lid=0.0):
    """The site's googly eyes. `lid` closes them from the top, for a squint."""
    out = []
    for cx, cy, r in ((-36, -22, 26), (33, -25, 24)):
        px, py = cx + pupil[0], cy + pupil[1]
        pr = r * 0.42
        out.append('<circle cx="%d" cy="%d" r="%d" fill="#ffffff" stroke="%s" '
                   'stroke-width="5.5"/>' % (cx, cy, r, INK))
        out.append('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/>' % (
            px, py, pr, INK))
        if lid > 0:
            out.append('<path d="M%d,%d a%d,%d 0 0 1 %d,0 Z" fill="%s" '
                       'stroke="%s" stroke-width="5.5" stroke-linejoin="round" '
                       'transform="translate(0,%.1f)"/>' % (
                           cx - r, cy, r, r * 1.15, r * 2, CHIP['base'], INK,
                           -r + lid * r * 1.6))
    return ''.join(out)


def mouth(kind='grin'):
    if kind == 'grin':
        return ('<path d="M-30,26 Q0,58 32,24" fill="none" stroke="%s" '
                'stroke-width="7" stroke-linecap="round"/>' % INK)
    if kind == 'smile':
        return ('<path d="M-19,30 Q0,46 21,29" fill="none" stroke="%s" '
                'stroke-width="6.5" stroke-linecap="round"/>' % INK)
    if kind == 'open':
        return ('<path d="M-24,22 Q0,20 24,22 Q22,58 0,58 Q-22,58 -24,22 Z" '
                'fill="%s" stroke="%s" stroke-width="5" '
                'stroke-linejoin="round"/>'
                '<path d="M-12,46 Q0,38 12,46 Q10,57 0,57 Q-10,57 -12,46 Z" '
                'fill="#e85d4c"/>' % (INK, INK))
    if kind == 'chomp':
        return ('<path d="M-26,20 Q0,16 26,20 Q24,54 0,54 Q-24,54 -26,20 Z" '
                'fill="%s" stroke="%s" stroke-width="5" '
                'stroke-linejoin="round"/>'
                '<path d="M-18,20 l6,11 l7,-11 l7,11 l7,-11 l7,11 l6,-11 Z" '
                'fill="#ffffff"/>' % (INK, INK))
    return ''


def darts(spec):
    """The brand's teal speed marks, from doodles/Asset_4.png."""
    out = []
    for x, y, length, thick, rot in spec:
        out.append('<path d="M0,%.1f L%.1f,%.1f L%.1f,%.1f L0,%.1f Z" '
                   'fill="%s" stroke="%s" stroke-width="4" '
                   'stroke-linejoin="round" '
                   'transform="translate(%.1f %.1f) rotate(%.0f)"/>' % (
                       -thick, length, -thick * 0.34, length, thick * 0.34,
                       thick, TEAL, INK, x, y, rot))
    return ''.join(out)


# --- poses -----------------------------------------------------------------
# Each pose is the same character, re-posed. `note` says what triggers it on the
# page, so the sheet doubles as the spec for wiring it to scroll.
POSES = [
    {
        'id': 'idle',
        'name': 'Idle / wave',
        'note': 'Resting state. Breathes and blinks, waves on hover.',
        'rotate': -3,
        'arms': [((-80, 8), (-118, 26), (-126, 72)),
                 ((80, -2), (124, -24), (130, -74))],
        'hands': [(-127, 77), (132, -80)],
        'legs': [((-36, 82), (-48, 120), (-44, 150)),
                 ((32, 84), (46, 120), (42, 150))],
        'feet': [((-52, 157), -8), ((50, 157), 8)],
        'pupil': (3, 2),
        'mouth': 'grin',
        'darts': [],
    },
    {
        'id': 'tumble',
        'name': 'Tumble',
        'note': 'Fast scroll. Spins on scroll velocity, darts trail behind.',
        'rotate': 27,
        'arms': [((-78, 12), (-116, 44), (-92, 88)),
                 ((82, -6), (124, 4), (116, 56))],
        'hands': [(-90, 93), (118, 61)],
        'legs': [((-32, 84), (-64, 112), (-24, 134)),
                 ((36, 82), (68, 106), (48, 140))],
        'feet': [((-20, 139), 40), ((52, 146), -30)],
        'pupil': (-6, -6),
        'mouth': 'open',
        'darts': [(-150, 96, 74, 15, 200), (-168, 40, 92, 17, 184),
                  (-142, -34, 66, 13, 168)],
    },
    {
        'id': 'peek',
        'name': 'Peek',
        'note': 'Section entry. Pops over the edge of a card or the viewport.',
        'rotate': 0,
        'ledge': 46,
        'arms': [((-72, -6), (-100, 14), (-80, 36)),
                 ((72, -10), (100, 8), (78, 34))],
        'hands': [(-80, 40), (78, 38)],
        'legs': [],
        'feet': [],
        'pupil': (2, -9),
        'mouth': 'smile',
        'darts': [],
    },
    {
        'id': 'run',
        'name': 'Run',
        'note': 'Scroll travel. Dashes across a band, facing the scroll direction.',
        'rotate': 16,
        'arms': [((-68, -12), (-112, -38), (-132, -16)),
                 ((-72, 16), (-114, 24), (-126, 56))],
        'hands': [(-138, -12), (-130, 62)],
        'legs': [((30, 86), (76, 100), (92, 136)),
                 ((-28, 84), (-58, 120), (-96, 108))],
        'feet': [((100, 142), 12), ((-105, 105), -24)],
        'pupil': (9, -2),
        'mouth': 'grin',
        'darts': [(-184, -16, 58, 15, 180), (-178, 32, 48, 13, 178)],
    },
]


def mascot(pose, chip, uid, dust=None, dust_dark=None, scale=1.0):
    """One posed mascot, as an SVG group."""
    dust = dust or chip['lattice']
    dust_dark = dust_dark or chip['rim']
    clip = 'clip-%s' % uid
    s = []
    s.append('<defs><clipPath id="%s"><path d="%s"/></clipPath></defs>' % (clip, BODY))
    s.append('<g transform="scale(%.3f) rotate(%.1f)" '
             'style="filter:drop-shadow(5px 6px 0 rgba(13,40,24,0.18))">'
             % (scale, pose['rotate']))

    if pose['darts']:
        s.append(darts(pose['darts']))

    for a in pose['arms']:
        s.append(limb(*a))
    for l in pose['legs']:
        s.append(limb(*l, width=LIMB + 1))

    # Body: rim, waffle, seasoning, then the keyline on top so it stays crisp.
    s.append('<path d="%s" fill="%s" stroke="%s" stroke-width="%.1f" '
             'stroke-linejoin="round"/>' % (BODY, chip['base'], INK, KEY))
    s.append(lattice(chip['lattice'], clip))
    s.append(speckles(dust, dust_dark, clip))
    s.append('<path d="%s" fill="none" stroke="%s" stroke-width="3.5" '
             'opacity="0.55"/>' % (BODY_INNER, chip['rim']))
    s.append('<path d="%s" fill="none" stroke="%s" stroke-width="%.1f" '
             'stroke-linejoin="round"/>' % (BODY, INK, KEY))

    if pose.get('ledge') is not None:
        y = pose['ledge']
        s.append('<path d="M-300,%d H300 V300 H-300 Z" fill="%s" stroke="%s" '
                 'stroke-width="6" stroke-linejoin="round"/>' % (y, SUNSHINE, INK))

    for h in pose['hands']:
        s.append(hand(h, chip['base']))
    for f, rot in pose['feet']:
        s.append(foot(f, chip['base'], rot))

    s.append(eyes(pose['pupil']))
    s.append(mouth(pose['mouth']))
    s.append('</g>')
    return ''.join(s)


def cell(pose, chip, uid, label, note, box=500, scale=1.0, dust=None,
         dust_dark=None):
    return '''<figure class="cell">
  <div class="art"><svg viewBox="-{h} -{h} {b} {b}">{body}</svg></div>
  <figcaption><b>{label}</b><span>{note}</span></figcaption>
</figure>'''.format(h=box // 2, b=box,
                    body=mascot(pose, chip, uid, dust, dust_dark, scale),
                    label=label, note=note)


def swatch(colour, name):
    return ('<li><i style="background:%s"></i><span>%s<em>%s</em></span></li>'
            % (colour, name, colour))


def build():
    poses = ''.join(cell(p, CHIP, p['id'], p['name'], p['note'])
                    for p in POSES)

    idle = POSES[0]
    dusts = ''.join(
        cell(idle, f, 'dust-%s' % f['slug'], f['label'],
             'Seasoning follows the live flavour.', box=500, scale=1.0,
             dust=f['dust'], dust_dark=f['dust_dark'])
        for f in FLAVOURS)

    swatches = ''.join([
        swatch(CHIP['base'], 'Chip'),
        swatch(CHIP['lattice'], 'Waffle'),
        swatch(INK, 'Keyline'),
        swatch(TEAL, 'Motion'),
        swatch(SUNSHINE, 'Sunshine'),
    ])

    return '''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Inter:wght@400;600;800;900&display=swap" rel="stylesheet">
<style>
  * {{ box-sizing: border-box; margin: 0; }}
  body {{
    width: 1400px; height: 1130px; padding: 44px 54px;
    background: {cream}; color: {ink};
    font-family: Inter, system-ui, sans-serif;
    display: flex; flex-direction: column; gap: 26px;
  }}
  header {{ display: flex; align-items: flex-end; justify-content: space-between;
            border-bottom: 4px solid {ink}; padding-bottom: 18px; }}
  h1 {{ font-family: 'Lilita One', Impact, sans-serif; font-size: 62px;
        line-height: 0.9; letter-spacing: 0.01em; color: {sunshine};
        -webkit-text-stroke: 4px {ink}; paint-order: stroke fill;
        text-shadow: 3px 4px 0 {ink}; }}
  .kicker {{ font-size: 11px; font-weight: 900; letter-spacing: 0.3em;
             text-transform: uppercase; opacity: 0.6; margin-bottom: 10px; }}
  .lede {{ max-width: 470px; font-size: 13.5px; font-weight: 600;
           line-height: 1.65; text-align: right; opacity: 0.82; }}
  .row {{ display: grid; gap: 14px; }}
  .row-poses {{ grid-template-columns: repeat(4, 1fr); }}
  .row-dust {{ grid-template-columns: repeat(3, 1fr); }}
  .cell {{ background: {foam}; border: 4px solid {ink}; border-radius: 26px;
           box-shadow: 6px 7px 0 {ink}; padding: 6px 6px 0;
           display: flex; flex-direction: column; overflow: hidden; }}
  .art {{ display: grid; place-items: center; }}
  .row-poses .art, .row-dust .art {{ height: 292px; }}
  .art svg {{ width: 100%; height: 100%; display: block; }}
  figcaption {{ border-top: 3px solid {ink}; padding: 10px 12px 12px;
                display: flex; flex-direction: column; gap: 3px; }}
  figcaption b {{ font-size: 15px; font-weight: 900; letter-spacing: -0.01em; }}
  figcaption span {{ font-size: 11.5px; font-weight: 600; line-height: 1.45;
                     opacity: 0.68; }}
  footer {{ display: flex; align-items: center; justify-content: space-between;
            border-top: 4px solid {ink}; padding-top: 16px; }}
  ul {{ display: flex; gap: 22px; list-style: none; padding: 0; }}
  ul li {{ display: flex; align-items: center; gap: 9px; }}
  ul i {{ width: 26px; height: 26px; border: 3px solid {ink};
          border-radius: 8px; display: block; }}
  ul span {{ font-size: 11px; font-weight: 900; text-transform: uppercase;
             letter-spacing: 0.1em; display: flex; flex-direction: column; }}
  ul em {{ font-style: normal; font-weight: 600; letter-spacing: 0.04em;
           opacity: 0.5; font-size: 10px; }}
  .built {{ font-size: 11.5px; font-weight: 600; line-height: 1.5;
            text-align: right; opacity: 0.7; max-width: 430px; }}
</style></head>
<body>
  <header>
    <div>
      <p class="kicker">Mascot concept &middot; v1 &middot; for review</p>
      <h1>Meet Flip</h1>
    </div>
    <p class="lede">A FLIPO&rsquo;s chip with somewhere to be. Built from the
      product&rsquo;s own shape &mdash; the round waffle disc &mdash; and the
      googly eyes the site already uses, so he reads as part of the brand
      rather than a visitor to it.</p>
  </header>

  <div class="row row-poses">{poses}</div>
  <div class="row row-dust">{dusts}</div>

  <footer>
    <ul>{swatches}</ul>
    <p class="built">Keylines match the pack art at 6&thinsp;units; the teal
      darts are the brand&rsquo;s own speed mark from
      <code>doodles/Asset_4.png</code>. Nothing is wired to the site yet.</p>
  </footer>
</body></html>'''.format(cream=CREAM, foam=FOAM, ink=INK, sunshine=SUNSHINE,
                         poses=poses, dusts=dusts, swatches=swatches)


# --- the live rig ----------------------------------------------------------
# The pose sheet above is the review artefact; the site needs the same chip as
# a rig it can pose every frame. Only the parts that never move are baked here
# -- the rim, the waffle press and the seasoning scatter, all of which depend
# on this file's RNG seeds and so must come from this file to stay identical to
# the approved sheet. Limbs, eyes and mouth are posed in JS, not here.

def _lattice_lines():
    out = []
    for angle in (34, -34):
        a = math.radians(angle)
        dx, dy = math.cos(a), math.sin(a)
        nx, ny = -dy, dx
        step = 17
        for k in range(-8, 9):
            cx, cy = nx * k * step, ny * k * step
            out.append((cx - dx * R * 1.2, cy - dy * R * 1.2,
                        cx + dx * R * 1.2, cy + dy * R * 1.2))
    return out


def _speckle_list(seed=3):
    rnd = random.Random(seed)
    out = []
    for i in range(26):
        t = rnd.uniform(0, 2 * math.pi)
        rad = R * math.sqrt(rnd.uniform(0, 1)) * 0.88
        x, y = rad * math.cos(t), rad * math.sin(t)
        rx = rnd.uniform(2.6, 5.4)
        out.append((x, y, rx, rnd.uniform(0.55, 0.95), rnd.uniform(0, 180),
                    0 if i % 3 else 1))
    return out


def _fmt(rows, places):
    body = []
    for row in rows:
        cells = ', '.join(('%.*f' % (p, v)).rstrip('0').rstrip('.') or '0'
                          for v, p in zip(row, places))
        body.append('  [%s],' % cells)
    return '\n'.join(body)


def build_js():
    flavours = ',\n'.join(
        "  '%s': { base: '%s', lattice: '%s', rim: '%s', dust: '%s', dustDark: '%s' }"
        % (f['slug'], f['base'], f['lattice'], f['rim'], f['dust'], f['dust_dark'])
        for f in FLAVOURS)

    return '''// GENERATED by tools/build-mascot.py -- regenerate with the script rather
// than editing by hand. Holds only the parts of Flip that never move: the
// scalloped rim, the waffle press and the seasoning scatter. All three come
// out of that script's RNG seeds, so baking them here is what keeps the chip
// on the site identical to the approved pose sheet in design/mascot/.
//
// Everything that *does* move -- limbs, eyes, mouth, darts -- is posed per
// frame in FlipArt.jsx. Units are the sheet's: the body radius is %(r)s.

export const R = %(r)s
export const KEY = %(key)s
export const LIMB = %(limb)s

export const INK = '%(ink)s'
export const TEAL = '%(teal)s'
export const CORAL = '#e85d4c'

/** The unseasoned chip, and one seasoning per flavour. */
export const CHIP = { base: '%(base)s', lattice: '%(lat)s', rim: '%(rim)s', dust: '%(lat)s', dustDark: '%(rim)s' }
export const FLAVOUR_CHIPS = {
%(flavours)s,
}

/** The scalloped rim, and the inner shadow line just inside it. */
export const BODY = '%(body)s'
export const BODY_INNER = '%(inner)s'

/** The waffle press: [x1, y1, x2, y2], clipped to the body. */
export const LATTICE = [
%(lattice)s
]

/** Seasoning: [cx, cy, r, opacity, rotation, dark]. `dark` picks the deeper dust. */
export const SPECKLES = [
%(speckles)s
]
''' % {
        'r': R, 'key': KEY, 'limb': LIMB, 'ink': INK, 'teal': TEAL,
        'base': CHIP['base'], 'lat': CHIP['lattice'], 'rim': CHIP['rim'],
        'flavours': flavours,
        'body': BODY, 'inner': BODY_INNER,
        'lattice': _fmt(_lattice_lines(), (1, 1, 1, 1)),
        'speckles': _fmt(_speckle_list(), (1, 1, 2, 2, 0, 0)),
    }


if __name__ == '__main__':
    out = os.path.join('design', 'mascot')
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, 'flip-v1.html')
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(build())
    print('wrote', path)

    js = os.path.join('src', 'components', 'mascot', 'flipGeometry.js')
    os.makedirs(os.path.dirname(js), exist_ok=True)
    with open(js, 'w', encoding='utf-8') as fh:
        fh.write(build_js())
    print('wrote', js)
