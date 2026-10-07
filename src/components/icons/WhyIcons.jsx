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

/** Outlined 5-point star, in the site's star colour unless told otherwise. */
export function StarDoodle({ className = '', fill = 'var(--color-star)' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M24 2 28.8 16.4 44 18.2 32.4 28 35.2 44 24 36.2 12.8 44 15.6 28 4 18.2 19.2 16.4Z"
        style={{ fill }}
        stroke={K}
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * The brand's heading rosette, traced from reference/drive/website/04.png.
 *
 * A twelve-point rounded burst under a heavy keyline. It flanks every section
 * title in the owner's designs -- Our flavours, Testimonials, About Us, the
 * PDP's Description -- and is the mark the site had been standing a five-point
 * star in for. Teal on the light sections, gold on About.
 */
export function Rosette({ className = '', fill = '#6FC4AF' }) {
  return (
    <svg className={className} viewBox="0 0 97.3 100.0" aria-hidden="true">
      <path d="M50.4,99.9 C48.4,100.1,46.1,98.0,44.1,96.6 C42.2,95.1,40.7,91.9,38.7,91.3 C36.6,90.7,34.1,92.2,31.8,92.8 C29.5,93.3,26.8,95.1,24.9,94.6 C23.0,94.1,21.4,91.7,20.3,89.7 C19.2,87.8,19.4,84.7,18.2,82.9 C16.9,81.2,15.0,80.1,12.9,79.1 C10.9,78.1,7.7,78.5,6.1,77.2 C4.4,75.9,2.8,73.4,2.9,71.4 C3.0,69.4,5.3,67.3,6.5,65.2 C7.8,63.2,10.0,61.2,10.3,59.1 C10.6,57.1,9.3,54.9,8.1,53.0 C6.9,51.0,4.5,49.4,3.2,47.4 C1.8,45.4,-0.3,43.1,-0.0,41.1 C0.2,39.1,2.9,37.3,4.6,35.5 C6.2,33.7,9.0,32.4,10.1,30.3 C11.2,28.3,10.8,25.5,11.0,23.1 C11.3,20.6,10.7,17.7,11.4,15.6 C12.2,13.5,13.7,11.1,15.6,10.4 C17.5,9.7,20.5,11.5,22.8,11.4 C25.1,11.4,27.5,11.1,29.3,9.8 C31.1,8.6,31.9,5.6,33.6,3.9 C35.2,2.3,37.3,-0.1,39.3,-0.1 C41.3,-0.1,43.3,2.5,45.3,3.8 C47.3,5.2,49.1,7.8,51.2,8.1 C53.3,8.3,55.5,6.2,57.7,5.4 C59.9,4.5,62.5,2.6,64.4,3.0 C66.4,3.5,68.0,6.1,69.2,8.0 C70.5,9.9,70.5,12.9,72.0,14.5 C73.4,16.1,75.7,16.8,77.8,17.5 C80.0,18.3,83.2,17.7,85.0,18.8 C86.8,20.0,88.2,22.3,88.6,24.4 C88.9,26.5,86.7,29.2,86.9,31.4 C87.0,33.5,87.9,35.6,89.3,37.3 C90.7,39.0,94.1,39.8,95.2,41.6 C96.4,43.3,96.9,46.0,96.4,48.1 C95.8,50.1,92.8,51.8,91.7,53.8 C90.5,55.8,89.3,57.9,89.4,60.0 C89.5,62.1,92.1,64.2,92.5,66.4 C93.0,68.5,93.3,71.4,92.1,72.9 C90.9,74.5,87.6,74.6,85.5,75.5 C83.4,76.4,80.4,76.7,79.3,78.4 C78.2,80.1,79.3,83.6,78.7,85.8 C78.0,88.0,77.2,91.0,75.5,91.9 C73.7,92.8,70.7,91.4,68.3,91.1 C65.9,90.8,63.3,89.2,61.2,89.9 C59.2,90.6,57.8,93.6,56.0,95.3 C54.2,96.9,52.4,99.7,50.4,99.9Z" fill={fill} stroke={K} strokeWidth="4.5" strokeLinejoin="round" />
    </svg>
  )
}
