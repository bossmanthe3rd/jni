import { useEffect, useState } from 'react'

/*
 * The break room around the vending machine.
 *
 * The machine stood alone on a tiled wall, and on a wide screen that left two
 * bare strips either side of it. These fill them with what a real break room
 * has, in the same doodle hand as the machine: a wall clock and a plant on the
 * left; a noticeboard and a bin of crumpled receipts on the right -- the bin
 * being where torn-off receipts would go.
 *
 * They hang off the machine's rig rather than the section, so they zoom with
 * it and always stand on the same floor. Where the screen is too narrow for
 * them, they run off the edge of the frame instead of crowding the machine.
 * Laptops only: on a phone there is no wall beside the machine.
 */

const INK = '#0d2818'
const TEAL = '#4db8ae'
const TEAL_DK = '#3a9d93'
const CREAM = '#fbf6d0'
const PAPER = '#fffbea'

export default function BreakRoom() {
  return (
    <div className="vm-room" aria-hidden="true">
      <WallClock />
      <Plant />
      <Noticeboard />
      <Bin />
    </div>
  )
}

/** The real time, because a break room clock that's wrong is a joke nobody asked for. */
function WallClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20000)
    return () => clearInterval(t)
  }, [])

  const h = now.getHours() % 12
  const m = now.getMinutes()
  const s = now.getSeconds()
  const hourAngle = h * 30 + m * 0.5
  const minuteAngle = m * 6 + s * 0.1

  return (
    <svg className="vm-room-clock" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r="62" fill={TEAL} stroke={INK} strokeWidth="6" />
      <circle cx="70" cy="70" r="50" fill={CREAM} stroke={INK} strokeWidth="4" />
      {Array.from({ length: 12 }, (_, i) => {
        const major = i % 3 === 0
        return (
          <line
            key={i}
            x1="70"
            y1={major ? 26 : 28}
            x2="70"
            y2="34"
            stroke={INK}
            strokeWidth={major ? 4 : 2.5}
            strokeLinecap="round"
            transform={`rotate(${i * 30} 70 70)`}
          />
        )
      })}
      <text x="70" y="96" textAnchor="middle" fontSize="7" fontWeight="900" letterSpacing="1.2" fill={INK} opacity="0.55">
        SNACK O&apos;CLOCK
      </text>
      <line x1="70" y1="74" x2="70" y2="44" stroke={INK} strokeWidth="6" strokeLinecap="round" transform={`rotate(${hourAngle} 70 70)`} />
      <line x1="70" y1="76" x2="70" y2="32" stroke={INK} strokeWidth="4" strokeLinecap="round" transform={`rotate(${minuteAngle} 70 70)`} />
      <line
        className="vm-room-sec"
        x1="70"
        y1="80"
        x2="70"
        y2="30"
        stroke="#c8102e"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ animationDelay: `-${s}s` }}
      />
      <circle cx="70" cy="70" r="4.5" fill={INK} />
    </svg>
  )
}

/** A snake plant: the one plant every office manages not to kill. */
function Plant() {
  return (
    <svg className="vm-room-plant" viewBox="0 0 160 260">
      <path d="M52 178 C38 150 24 122 14 92 C36 112 56 142 68 178 Z" fill="#1f7a33" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M64 178 C50 132 48 82 58 28 C72 80 76 132 76 178 Z" fill="#0b5c2e" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M80 178 C76 120 82 62 94 8 C104 70 100 132 92 178 Z" fill="#1f7a33" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M94 178 C100 132 112 92 132 58 C128 102 112 142 106 178 Z" fill="#0b5c2e" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      <path d="M68 168 C63 124 62 84 60 46" fill="none" stroke="#c3d92e" strokeWidth="3" strokeLinecap="round" />
      <path d="M86 168 C84 118 88 72 93 30" fill="none" stroke="#c3d92e" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 182 L114 182 L106 250 Q80 256 54 250 Z" fill={TEAL_DK} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
      <rect x="38" y="170" width="84" height="20" rx="6" fill={TEAL} stroke={INK} strokeWidth="6" />
    </svg>
  )
}

/** The noticeboard, with the notes every shared kitchen grows. */
function Noticeboard() {
  return (
    <div className="vm-room-board">
      <p className="vm-room-note vm-room-note--a">
        Snack break: 4 PM. Non-negotiable.
      </p>
      <p className="vm-room-note vm-room-note--b">
        Machine takes taps, not coins.
      </p>
      <p className="vm-room-note vm-room-note--c">
        Whoever keeps taking the Peri Peri — we know.
      </p>
    </div>
  )
}

/** Where the torn-off receipts end up. */
function Bin() {
  return (
    <svg className="vm-room-bin" viewBox="0 0 150 130">
      <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
        <path d="M34 22 C28 10 44 2 54 8 C64 2 74 14 66 24 C70 34 50 38 42 32 C32 36 26 28 34 22 Z" fill={PAPER} />
        <path d="M62 18 C60 6 76 0 84 8 C96 6 98 20 90 26 C92 36 72 36 68 30 C58 30 56 22 62 18 Z" fill={PAPER} />
      </g>
      <path d="M40 18 L54 24 M46 28 L60 22 M70 14 L84 22 M74 26 L88 18" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <path d="M22 40 L98 40 L90 124 Q60 129 30 124 Z" fill={TEAL} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
      <path d="M42 56 L46 112 M60 56 L60 114 M78 56 L74 112" stroke={INK} strokeWidth="4" strokeLinecap="round" opacity="0.35" />
      <rect x="14" y="30" width="92" height="14" rx="5" fill={TEAL_DK} stroke={INK} strokeWidth="6" />
      {/* the one that missed */}
      <g transform="translate(116 104)">
        <path d="M-14 4 C-18 -8 -4 -16 4 -10 C14 -14 20 -2 12 6 C14 16 -4 18 -8 12 C-18 14 -20 8 -14 4 Z" fill={PAPER} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M-8 -2 L6 4 M-4 8 L8 0" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </g>
    </svg>
  )
}
