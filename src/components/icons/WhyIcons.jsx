// The four hand-drawn "Why Flipo's ?" icons, transcribed path-for-path
// from the live bundle. S = #F3C63B (sunshine), k = #071A16 (ink), Oe = #E85D4C (coral).

const S = '#F3C63B'
const K = '#071A16'
const CORAL = '#E85D4C'

/**
 * The heat flame. Defaults are the filled "Why Flipo's ?" treatment; the
 * product page overrides them for the live site's outline-only version, where
 * the flame sits beside the title in the flavour's own accent.
 */
export function FlameIcon({ className = '', fill = S, stroke = K, spark = CORAL }) {
  return (
    <svg className={className} viewBox="0 0 88 88" fill="none" aria-hidden="true">
      <path
        d="M46 78c-16 0-27-11-27-25 0-11 7-18 15-24 1 8 5 12 9 14-3-11 0-22 8-29 2 13 9 17 15 25 5 7 7 12 7 19 0 12-11 20-27 20Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <path
        d="M46 74c-8 0-13-6-13-13 0-6 4-10 8-13 1 5 3 7 6 8-2-6 0-12 4-16 1 7 5 10 8 15 2 4 3 6 3 9 0 6-5 10-16 10Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {spark && (
        <path
          d="M31 30c-7-5-6-14 2-17 4-1 7 1 8 4"
          stroke={spark}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

export function KeyboardIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 88 88" fill="none" aria-hidden="true">
      <path d="M66 34c6-8 4-14-2-16" stroke={K} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <rect x="56" y="8" width="16" height="12" rx="3" fill={S} stroke={K} strokeWidth="3.2" />
      <rect x="8" y="34" width="72" height="38" rx="7" fill={S} stroke={K} strokeWidth="3.4" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={`r1-${i}`} x={15 + i * 11} y="41" width="7" height="6" rx="1.5" fill={K} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={`r2-${i}`} x={15 + i * 11} y="51" width="7" height="6" rx="1.5" fill={K} />
      ))}
      <rect x="24" y="61" width="40" height="5" rx="2.5" fill={K} />
    </svg>
  )
}

export function PencilCupIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 88 88" fill="none" aria-hidden="true">
      <path d="M30 44V16l5-8 5 8v28Z" fill={S} stroke={K} strokeWidth="3.2" strokeLinejoin="round" />
      <path d="M48 44V20l5-8 5 8v24Z" fill={S} stroke={K} strokeWidth="3.2" strokeLinejoin="round" />
      <path
        d="M22 44h44l-4 30a4 4 0 0 1-4 3H30a4 4 0 0 1-4-3Z"
        fill={S}
        stroke={K}
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <path
        d="M66 52h8a4 4 0 0 1 0 8h-8M66 62h6a4 4 0 0 1 0 8h-6"
        stroke={K}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export function BrainIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 88 88" fill="none" aria-hidden="true">
      <path
        d="M44 16c-6-6-18-4-20 5-8 0-13 7-10 14-6 4-6 13 0 17-2 8 4 15 12 14 3 7 13 9 18 3 5 6 15 4 18-3 8 1 14-6 12-14 6-4 6-13 0-17 3-7-2-14-10-14-2-9-14-11-20-5Z"
        fill={S}
        stroke={K}
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <path d="M44 18v52" stroke={K} strokeWidth="2.8" strokeLinecap="round" />
      <path
        d="M34 30c6 2 7 8 4 12M54 30c-6 2-7 8-4 12M32 52c6-1 9 3 9 8M56 52c-6-1-9 3-9 8"
        stroke={K}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Outlined 5-point star (teal fill) used as a scattered accent. */
export function StarDoodle({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M24 2 28.8 16.4 44 18.2 32.4 28 35.2 44 24 36.2 12.8 44 15.6 28 4 18.2 19.2 16.4Z"
        fill="#4DB8AE"
        stroke={K}
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const whyIconMap = {
  flavour: FlameIcon,
  desk: KeyboardIcon,
  creative: PencilCupIcon,
  brain: BrainIcon,
}
