/** The vending machine's slot with nothing in it: a bare coil over the shelf. */
export default function EmptySlot({ small = false }) {
  return (
    <div className={`ck-slot${small ? ' ck-slot--sm' : ''}`} aria-hidden="true">
      <svg className="ck-slot-coil" viewBox="0 0 200 70" fill="none" preserveAspectRatio="none">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <ellipse
            key={i}
            cx={22 + i * 31}
            cy="35"
            rx="13"
            ry="30"
            stroke="#d6dcd4"
            strokeWidth="4"
            transform={`rotate(-22 ${22 + i * 31} 35)`}
          />
        ))}
      </svg>
      <div className="ck-slot-shelf" />
      <span className="ck-slot-tag">Empty</span>
    </div>
  )
}
