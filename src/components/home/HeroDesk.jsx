/*
 * The hero's desk.
 *
 * Every campaign banner is shot from the chair: a cream wall behind, a yellow
 * desktop running the full width across the lower third, the pack standing on
 * it with a flat olive shadow, the stationery sitting on the same surface at
 * the pack's own scale, and a dark front edge closing the frame. That is what
 * makes the brand read as a desk brand -- the desk is the ground you are at,
 * not an object you look at.
 *
 * An earlier pass drew a little table on the right and hung the banner props
 * off the corners. Two desks, two scales, and neither was the floor. This is
 * the banner's version: one surface, section-wide.
 *
 * Three layers, stacked by the host in this order:
 *
 *   DeskSurface  the desktop itself, from the back edge down to the lip
 *   (props + packs stand on it)
 *   DeskLip      the dark front edge, painted over the feet of the big props so
 *                they run off the bottom of the frame the way the banners crop
 *                them. It is also the seam into the next section.
 *
 * Heights come from two custom properties the host sets on the section:
 * `--desk` (the whole desk, lip included) and `--lip`. Everything that stands
 * on the desk positions against those, so nothing here knows a pixel value.
 */

const INK = '#0d2818'
const TOP = '#f3c63b'
const GRAIN = '#e3b12c'

/** The desktop. Stretches to whatever box the host gives it. */
export function DeskSurface({ className = '' }) {
  return (
    <svg
      viewBox="0 0 1440 300"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {/* the back edge wobbles very slightly: drawn, not ruled */}
      <path
        d="M0 10 C 240 2 480 14 720 8 C 960 2 1200 13 1440 6 L1440 300 L0 300 Z"
        fill={TOP}
      />
      <path
        d="M0 10 C 240 2 480 14 720 8 C 960 2 1200 13 1440 6"
        fill="none"
        stroke={INK}
        strokeWidth="4"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M90 96 C 300 88 520 100 700 94"
        fill="none"
        stroke={GRAIN}
        strokeWidth="5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M820 150 C 1010 142 1180 154 1370 146"
        fill="none"
        stroke={GRAIN}
        strokeWidth="5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/** The dark front edge -- the banners' closing wave. */
export function DeskLip({ className = '' }) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0 22 C 200 4 380 30 620 18 C 860 6 1080 34 1260 16 C 1340 8 1400 12 1440 18 L1440 80 L0 80 Z"
        fill={INK}
      />
    </svg>
  )
}

/*
 * One fixed set of props, lifted from the banners (tools/hero-desk-objects.py).
 * It does not change with the flavour: a desk does not swap its keyboard every
 * few seconds. The art is one teal-and-yellow family across all three banners,
 * so any piece can sit next to any pack.
 *
 * `left` and `width` are vw so the set scales with the frame. Each prop stands
 * on the lip line and `sink` (a share of its own height) drops it behind the
 * lip -- the banners crop the big pieces there, and the keyboard and mouse were
 * cut by the banner frame, so they go hard against their edge.
 *
 * `mobile` marks the two that survive a phone width: one edge piece each side,
 * framing the pack rather than crowding it.
 */
export const DESK_PROPS = [
  { src: 'jalapeno-kick--keyboard', left: -3, width: 21, sink: 22, edge: 'l', mobile: { left: -8, width: 32 } },
  { src: 'jalapeno-kick--clipboard', left: 19.5, width: 10.5, sink: 18 },
  { src: 'peri-peri-punch--pencil', left: 31.5, width: 3.1, sink: 14 },
  { src: 'peri-peri-punch--pen', left: 35.2, width: 2.8, sink: 16 },
  { src: 'jalapeno-kick--mouse', left: 91.5, width: 12, sink: 20, edge: 'r', mobile: { left: 80, width: 24 } },
]

/*
 * Where the three packs stand, as percentages of the cluster box the host lays
 * over the desk. `bottom` lifts the two behind onto the back of the surface --
 * further away on the desk, so higher in the frame and a touch smaller -- which
 * is what makes it read as depth rather than as three tiles in a row.
 */
export const DESK_SLOTS = [
  { cx: 50, bottom: 0, width: 46, rotate: -2, z: 20, dim: false },
  { cx: 23, bottom: 9, width: 33, rotate: -8, z: 14, dim: true },
  { cx: 77, bottom: 9, width: 33, rotate: 7, z: 14, dim: true },
]

/**
 * A wall clock set to the reader's own time -- the one thing on the wall that
 * is true for them specifically. Desk snacking is a time-of-day habit (the
 * 11 am lull, the 4 pm slump), and a real clock says "your desk, right now"
 * without a word of copy. The host passes the time in (useDeskClock), because
 * the same time sets the light in the room.
 */
export function WallClock({ now, className = '' }) {
  const m = now.getMinutes()
  const h = (now.getHours() % 12) + m / 60
  const minute = m * 6
  const hour = h * 30
  const label = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label={`Clock showing ${label}`}>
      <circle cx="60" cy="60" r="50" fill="#4db8ae" stroke={INK} strokeWidth="7" />
      <circle cx="60" cy="60" r="38" fill="#fbf6d0" stroke={INK} strokeWidth="4" />
      {[0, 90, 180, 270].map((a) => (
        <path
          key={a}
          d="M60 27 L60 34"
          stroke={INK}
          strokeWidth="5"
          strokeLinecap="round"
          transform={`rotate(${a} 60 60)`}
        />
      ))}
      <path d="M60 60 L60 40" stroke={INK} strokeWidth="6" strokeLinecap="round" transform={`rotate(${hour} 60 60)`} />
      <path d="M60 60 L60 31" stroke={INK} strokeWidth="4" strokeLinecap="round" transform={`rotate(${minute} 60 60)`} />
      <circle cx="60" cy="60" r="5" fill={TOP} stroke={INK} strokeWidth="3" />
    </svg>
  )
}

export default DeskSurface
