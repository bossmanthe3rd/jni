/*
 * The marks a receipt carries, shared by the vending machine's receipt and
 * the checkout bill so the two read as the same till roll. Each takes the
 * class its host styles it with; the defaults are the vending machine's.
 */

/** The total, circled by hand. The host's CSS draws it on. */
export function MarkerRing({ className = 'vm-ring' }) {
  return (
    <svg className={className} viewBox="0 0 130 60" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M16 34 C10 12 70 4 112 14 C132 20 126 46 92 53 C58 60 14 54 8 36 C4 24 26 12 52 9"
        pathLength="1"
      />
    </svg>
  )
}

/** A barcode built from `code`, so each receipt's is its own. */
export function Barcode({ code, className = 'vm-barcode' }) {
  const seed = `${code}FLIPOS-JNI`
  const bars = []
  let x = 0
  for (let i = 0; i < seed.length * 2; i += 1) {
    const c = seed.charCodeAt(i % seed.length) + i * 7
    const w = (c % 3) + 1
    if (i % 2 === 0) bars.push(<rect key={i} x={x} y="0" width={w} height="26" />)
    x += w + 1
  }
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox={`0 0 ${x} 26`} preserveAspectRatio="none">
        {bars}
      </svg>
      <span>*{code}-JNI*</span>
    </span>
  )
}
