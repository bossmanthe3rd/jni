/** Small cluster of triangle confetti that flanks a section heading. */
export function TriangleCluster({ className = '' }) {
  const tris = [
    { cls: 'absolute -left-8 top-1 h-5 w-5', fill: '#F3C63B' },
    { cls: 'absolute -left-3 -top-6 h-4 w-4 rotate-45', fill: '#F3C63B' },
    { cls: 'absolute left-2 -top-5 h-3.5 w-3.5 -rotate-12', fill: '#F3C63B' },
    { cls: 'absolute left-10 -top-2 h-3 w-3 rotate-6', fill: '#F3C63B' },
    { cls: 'absolute left-14 top-2 h-2.5 w-2.5 -rotate-6', fill: '#E85D4C' },
  ]
  return (
    <span className={`pointer-events-none ${className}`} aria-hidden="true">
      {tris.map((t, i) => (
        <svg key={i} className={t.cls} viewBox="0 0 20 20">
          <path d="M10 2 18 16H2Z" fill={t.fill} stroke="#071A16" strokeWidth="2" />
        </svg>
      ))}
    </span>
  )
}

export default TriangleCluster
