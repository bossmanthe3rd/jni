import { useId } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  BODY,
  BODY_INNER,
  CHIP,
  FLAVOUR_CHIPS,
  INK,
  KEY,
  LATTICE,
  SPECKLES,
} from '../mascot/flipGeometry'

/**
 * One crisp, eaten a bite at a time -- the heat climb's centrepiece.
 *
 * It is Flip's own chip with the face and limbs left off: the same scalloped
 * rim, waffle press and seasoning scatter that tools/build-mascot.py baked
 * into flipGeometry.js, seasoned with the flavour's dust. So the crisp on the
 * product page and the mascot are the same drawing, not a second one.
 *
 * Each bite is a cluster of three circles punched out of the rim through a
 * mask. The keyline strokes of those circles go through the same mask, so
 * only their outer halves survive: the bitten edge keeps its ink line like
 * every other edge in the brand, instead of looking sliced by software.
 * A new bite snaps in with crumbs spraying off it and a word popping beside
 * it.
 */

/* Where each bite lands, clockwise from the top right, in degrees. */
const ANGLES = [-38, 28, 96, 164, 232]
/* The words that pop with each bite. */
const CRUNCH = ['Crunch!', 'Snap!', 'Crack!', 'Crunch!', 'Gone?']

const RIM = 100 // bite centre distance from the middle, chip units

const rad = (d) => (d * Math.PI) / 180
const polar = (deg, r) => [Math.cos(rad(deg)) * r, Math.sin(rad(deg)) * r]

/** A bite: one big tooth mark flanked by two smaller ones. */
function biteCircles(deg) {
  return [
    [...polar(deg, RIM), 36],
    [...polar(deg - 21, RIM - 2), 23],
    [...polar(deg + 21, RIM - 2), 23],
  ]
}

/* Crumb shards, as small closed paths around their own origin. */
const SHARDS = [
  'M-5 -3 L4 -5 L6 2 L-2 5 Z',
  'M-4 -4 L5 -2 L3 5 L-5 3 Z',
  'M-3 -5 L5 -1 L0 5 L-5 0 Z',
  'M-6 -1 L1 -5 L6 1 L0 4 Z',
]
const SPRAY = [-40, -22, -6, 10, 26, 44, 60]

export default function BittenCrisp({ flavour, bites, className = '', style }) {
  const reduce = useReducedMotion()
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const clipId = `crisp-body-${id}`
  const maskId = `crisp-bites-${id}`
  const chip = FLAVOUR_CHIPS[flavour] || CHIP
  const taken = Math.max(0, Math.min(ANGLES.length, bites))
  const last = taken - 1

  const pop = reduce
    ? { initial: false }
    : {
        initial: { r: 0 },
        transition: { type: 'spring', stiffness: 520, damping: 18 },
      }

  return (
    <div className={`jni-crisp ${className}`} style={style} aria-hidden="true">
      <svg viewBox="-135 -135 270 270">
        <defs>
          <clipPath id={clipId}>
            <path d={BODY} />
          </clipPath>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="-135" y="-135" width="270" height="270">
            <rect x="-135" y="-135" width="270" height="270" fill="#fff" />
            {ANGLES.slice(0, taken).map((deg) =>
              biteCircles(deg).map(([cx, cy, r], k) => (
                <motion.circle key={`${deg}-${k}`} cx={cx} cy={cy} animate={{ r }} {...pop} fill="#000" />
              ))
            )}
          </mask>
        </defs>

        <g mask={`url(#${maskId})`}>
          <path d={BODY} fill={chip.base} stroke={INK} strokeWidth={KEY} strokeLinejoin="round" />
          <g clipPath={`url(#${clipId})`} stroke={chip.lattice} strokeWidth="4.5" strokeLinecap="round" opacity="0.5">
            {LATTICE.map(([x1, y1, x2, y2], i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
            ))}
          </g>
          <g clipPath={`url(#${clipId})`}>
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
          {/* The bitten edge's keyline: full circles, masked to their outer
              halves along with everything else, clipped to the chip. */}
          <g clipPath={`url(#${clipId})`}>
            {ANGLES.slice(0, taken).map((deg) =>
              biteCircles(deg).map(([cx, cy, r], k) => (
                <motion.circle
                  key={`${deg}-${k}`}
                  cx={cx}
                  cy={cy}
                  animate={{ r }}
                  {...pop}
                  fill="none"
                  stroke={INK}
                  strokeWidth={KEY * 2}
                />
              ))
            )}
          </g>
        </g>

        {/* Crumbs off the newest bite. */}
        <AnimatePresence>
          {!reduce &&
            last >= 0 &&
            SPRAY.map((spread, i) => {
              const deg = ANGLES[last] + spread
              const [x0, y0] = polar(ANGLES[last], RIM - 18)
              const [dx, dy] = polar(deg, 46 + (i % 3) * 16)
              return (
                <motion.path
                  key={`${last}-${i}`}
                  d={SHARDS[i % SHARDS.length]}
                  fill={i % 2 ? chip.base : chip.lattice}
                  stroke={INK}
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                  initial={{ x: x0, y: y0, rotate: 0, opacity: 1, scale: 1.2 }}
                  animate={{ x: x0 + dx, y: y0 + dy + 34, rotate: spread * 6, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.9, ease: [0.2, 0.7, 0.4, 1] }}
                />
              )
            })}
        </AnimatePresence>
      </svg>

      <AnimatePresence>
        {!reduce && last >= 0 && (
          <motion.span
            key={`word-${last}`}
            className="jni-crisp-word"
            style={{
              left: `${50 + (polar(ANGLES[last], 150)[0] / 270) * 100}%`,
              top: `${50 + (polar(ANGLES[last], 150)[1] / 270) * 100}%`,
            }}
            initial={{ scale: 0.3, opacity: 0, rotate: -14 }}
            animate={{ scale: 1, opacity: [0, 1, 1, 0], rotate: -6 }}
            exit={{ opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 17,
              opacity: { duration: 1.5, times: [0, 0.08, 0.7, 1] },
            }}
          >
            {CRUNCH[last]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
