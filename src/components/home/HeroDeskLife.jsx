import { useEffect, useId, useState } from 'react'
import { motion } from 'framer-motion'
import { BODY, BODY_INNER, CHIP, FLAVOUR_CHIPS, INK, KEY, LATTICE, SPECKLES } from '../mascot/flipGeometry'

/*
 * What makes the hero's desk feel lived at rather than drawn: it keeps the
 * reader's own hours, it has a lamp on it, and the chips come out of the pack.
 *
 *   useDeskClock  the reader's local time, ticking on the minute
 *   deskLight     turns that time into the light in the room
 *   PendantShade  the lamp itself, hanging over the packs
 *   LampBeam      the flat cone of light it throws, behind the packs
 *   LampPool      the pool that beam leaves on the desk
 *   DeskChip      one crisp, lying on the desk
 */

const TEAL = '#6ec5b8'
const TOP = '#f3c63b'

/**
 * The reader's local time, updated on the minute.
 *
 * `?deskHour=19.5` pins it, so the owner can see the desk at 7:30 pm without
 * waiting for 7:30 pm -- and so it can be checked at every hour of the day.
 */
export function useDeskClock() {
  const [now, setNow] = useState(() => pinned() ?? new Date())

  useEffect(() => {
    if (pinned()) return undefined
    let id = 0
    const tick = () => {
      setNow(new Date())
      id = window.setTimeout(tick, 60000 - (Date.now() % 60000))
    }
    id = window.setTimeout(tick, 60000 - (Date.now() % 60000))
    return () => window.clearTimeout(id)
  }, [])

  return now
}

function pinned() {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('deskHour')
  const h = raw == null ? NaN : Number(raw)
  if (!Number.isFinite(h) || h < 0 || h >= 24) return null
  const d = new Date()
  d.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0)
  return d
}

const clamp01 = (v) => Math.min(1, Math.max(0, v))

/**
 * The light in the room at a given time.
 *
 * By day the sun crosses from the left of the frame to the right, so the packs'
 * shadow swings from falling right in the morning to falling left by late
 * afternoon, and stretches as the sun gets low. The wall takes a cool wash in
 * the morning and a warm one in the afternoon.
 *
 * After five the room dims and the lamp takes over: it hangs right over the
 * packs, so the shadow falls short and straight under them, and its pool of
 * light is what the packs stand in.
 *
 * `dim` is kept off a pool around the packs -- the lamp's pool -- so after
 * dark the packs stand in light and the rest of the room falls away.
 *
 * `lamp` is how strongly the lamp's light reads (it is always on -- it carries
 * the flavour's colour -- but by day the sun drowns most of it out).
 */
export function deskLight(date) {
  const h = date.getHours() + date.getMinutes() / 60
  const phase =
    h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 17 ? 'afternoon' : h >= 17 && h < 21 ? 'evening' : 'night'

  if (phase === 'evening' || phase === 'night') {
    return {
      phase,
      shadowX: 0,
      stretch: 0.94,
      shadowOpacity: 0.3,
      dim: phase === 'evening' ? 0.2 : 0.32,
      lamp: phase === 'evening' ? 0.85 : 1,
      wash: 'none',
    }
  }

  const sun = clamp01((h - 6) / 12) // 0 at 6 am, 1 at 6 pm
  return {
    phase,
    shadowX: (0.5 - sun) * 2,
    stretch: 1 + 0.32 * Math.abs(2 * sun - 1),
    shadowOpacity: 0.22,
    dim: 0,
    lamp: phase === 'morning' ? 0.3 : 0.4,
    wash:
      phase === 'morning'
        ? 'linear-gradient(112deg, rgba(255,255,255,0.42) 0%, rgba(222,240,238,0.16) 38%, rgba(255,255,255,0) 70%)'
        : 'linear-gradient(248deg, rgba(255,184,92,0.26) 0%, rgba(255,210,140,0.1) 40%, rgba(255,255,255,0) 72%)',
  }
}

/*
 * The pendant lamp: a wide, shallow industrial shade on a short cord, in the
 * banners' prop register -- ink keyline, a teal sheen on dark enamel, yellow
 * fittings. Its underside is the brightest thing on it: a flat cream ellipse
 * with the bulb in it, which is what makes it read as switched on.
 *
 * 300 x 150. The fitting's top is at (150,0), where the cord meets it; the
 * lit rim is centred at y118 and spans x10..290 -- LampBeam's top edge is cut
 * to that width, so beam and shade meet exactly.
 */
export const SHADE_RIM = { y: 118 / 150, half: 140 / 300 }

export function PendantShade({ tint, glow = 0.5, className = '' }) {
  const fade = { transition: 'fill 600ms ease' }
  return (
    <svg viewBox="0 0 300 150" className={className} style={{ overflow: 'visible' }} aria-hidden="true">
      {/* bloom under the rim, in the flavour's colour */}
      <ellipse cx="150" cy="124" rx="150" ry="30" fill={tint} style={{ ...fade, opacity: 0.22 + 0.3 * glow, filter: 'blur(14px)' }} />
      {/* fitting */}
      <path d="M138 0 L162 0 L165 26 L135 26 Z" fill={TOP} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
      <path d="M128 24 L172 24 L174 36 L126 36 Z" fill={INK} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      {/* the shade: a wide, shallow cone */}
      <path
        d="M120 34 L180 34 C192 34 198 40 204 52 L286 106 C294 112 292 120 282 120 L18 120 C8 120 6 112 14 106 L96 52 C102 40 108 34 120 34 Z"
        fill={INK}
        stroke={INK}
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path d="M110 50 L40 100" fill="none" stroke="#4db8ae" strokeWidth="7" strokeLinecap="round" opacity="0.85" />
      <path d="M126 44 L118 48" fill="none" stroke="#4db8ae" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
      {/* the lit underside, seen from just below, and the bulb in it */}
      <ellipse cx="150" cy="118" rx="140" ry="13" fill="#fff4c8" stroke={INK} strokeWidth="6" />
      <ellipse cx="150" cy="119" rx="38" ry="8" fill="#fffdf2" />
      <ellipse cx="150" cy="119" rx="20" ry="4.5" fill={tint} style={{ ...fade, opacity: 0.4 }} />
      {/* rays: the site draws anything switched on with a few ticks */}
      <g stroke="#fff8dc" strokeWidth="5" strokeLinecap="round" style={{ opacity: 0.5 + 0.5 * glow }}>
        <path d="M104 138 L96 148" />
        <path d="M150 140 L150 152" />
        <path d="M196 138 L204 148" />
      </g>
    </svg>
  )
}

/**
 * The lamp's beam: a wide cone, cream at the shade and the flavour's colour
 * further down, with a brighter core and a glow on the wall round the shade.
 *
 * It is light, not a shape, so it has no edges. Both cones fade to nothing
 * before they reach the desk -- the pool (LampPool) is what the light leaves
 * there, so the beam dissolves into it instead of stopping on a hard line --
 * and a sideways blur feathers their slanted sides. The blur is horizontal
 * only: vertically the gradient already does the fading, and a vertical blur
 * would pull the beam's top edge away from the shade's rim. Stretched over its box (0..100 each way); `topHalf`
 * is the half-width of the top edge as a share of the box, so the host can
 * match it to the shade's rim.
 */
export function LampBeam({ tint, strength = 0.5, topHalf = 20, className = '' }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const stop = { transition: 'stop-color 600ms ease' }
  const l = 50 - topHalf
  const r = 50 + topHalf
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={className} style={{ overflow: 'visible' }} aria-hidden="true">
      <defs>
        <radialGradient id={`glow-${id}`} cx="50" cy="0" r="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={tint} stopOpacity="0.32" style={stop} />
          <stop offset="1" stopColor={tint} stopOpacity="0" style={stop} />
        </radialGradient>
        <linearGradient id={`beam-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6d2" stopOpacity="0.78" />
          <stop offset="0.3" stopColor={tint} stopOpacity="0.3" style={stop} />
          <stop offset="0.62" stopColor={tint} stopOpacity="0.16" style={stop} />
          <stop offset="0.88" stopColor={tint} stopOpacity="0.04" style={stop} />
          <stop offset="1" stopColor={tint} stopOpacity="0" style={stop} />
        </linearGradient>
        <linearGradient id={`core-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffbe8" stopOpacity="0.7" />
          <stop offset="0.55" stopColor="#fffbe8" stopOpacity="0.18" />
          <stop offset="0.85" stopColor="#fffbe8" stopOpacity="0" />
        </linearGradient>
        <filter id={`feather-${id}`} x="-15%" y="0" width="130%" height="100%">
          <feGaussianBlur stdDeviation="2.4 0" />
        </filter>
      </defs>
      <motion.g animate={{ opacity: strength }} transition={{ duration: 0.8 }}>
        <ellipse cx="50" cy="-2" rx="60" ry="40" fill={`url(#glow-${id})`} />
        <g filter={`url(#feather-${id})`}>
          <path d={`M${l} 0 L${r} 0 L99 100 L1 100 Z`} fill={`url(#beam-${id})`} />
          <path d={`M${l + topHalf * 0.45} 0 L${r - topHalf * 0.45} 0 L${50 + 26} 100 L${50 - 26} 100 Z`} fill={`url(#core-${id})`} />
        </g>
      </motion.g>
    </svg>
  )
}

/** Where the beam lands: a pool of the flavour's light on the desk. */
export function LampPool({ tint, strength = 0.5, className = '' }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const stop = { transition: 'stop-color 600ms ease' }
  return (
    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`pool-${id}`}>
          <stop offset="0" stopColor="#fff6d2" stopOpacity="0.9" />
          <stop offset="0.55" stopColor={tint} stopOpacity="0.5" style={stop} />
          <stop offset="1" stopColor={tint} stopOpacity="0" style={stop} />
        </radialGradient>
      </defs>
      <motion.ellipse cx="50" cy="10" rx="50" ry="10" fill={`url(#pool-${id})`} animate={{ opacity: strength }} transition={{ duration: 0.8 }} />
    </svg>
  )
}

/**
 * One Flipo's crisp -- Flip's own chip geometry, face and limbs left off, in
 * the flavour's seasoning. The same drawing the product page's bitten crisp
 * uses, so the chip on the desk is the brand's chip, not a new one.
 */
export function DeskChip({ flavour, className = '', style }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const chip = FLAVOUR_CHIPS[flavour] || CHIP
  return (
    <svg viewBox="-135 -135 270 270" className={className} style={style} aria-hidden="true">
      <defs>
        <clipPath id={`chip-${id}`}>
          <path d={BODY} />
        </clipPath>
      </defs>
      <path d={BODY} fill={chip.base} />
      <g clipPath={`url(#chip-${id})`} stroke={chip.lattice} strokeWidth="4.5" strokeLinecap="round" opacity="0.5">
        {LATTICE.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
      <g clipPath={`url(#chip-${id})`}>
        {SPECKLES.map(([cx, cy, r, op, rot, dark], i) => (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={r}
            ry={r * 0.7}
            opacity={op}
            transform={`rotate(${rot} ${cx} ${cy})`}
            fill={dark ? chip.dustDark : chip.dust}
          />
        ))}
      </g>
      <path d={BODY_INNER} fill="none" stroke={chip.rim} strokeWidth="3.5" opacity="0.55" />
      <path d={BODY} fill="none" stroke={INK} strokeWidth={KEY} strokeLinejoin="round" />
    </svg>
  )
}
