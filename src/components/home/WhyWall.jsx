/*
 * The wall behind the Why Flipo's monitor -- two candidates, picked with the
 * `wall` prop while we decide:
 *
 *   scatter  the campaign banner's own wall: pale chillies and bitten chips
 *            drifting round the monitor, a few full-colour triangles.
 *   office   a two-tone painted office wall with a dado rail, the monitor's
 *            cable running down into a socket, and a framed pack where there
 *            is wall enough to hang one.
 *
 * Both are laid out in the 1180 x 600 artboard's own units and hang off the
 * rig, so they zoom with the monitor. Laptops only.
 */

const INK = '#0d2818'

// [src, x, y, width, rotate, pale]
const SCATTER = [
  ['/assets/doodles/pack/peri-peri-punch-chilli-whole.svg', -250, 30, 92, -32, true],
  ['/assets/doodles/rounded_chillie.png', -200, 280, 80, 0, true],
  ['/assets/doodles/pack/sweet-chilli-rush-chilli-whole.svg', -70, 190, 64, 18, true],
  ['/assets/doodles/rounded_chillie.png', 22, -46, 70, 20, true],
  ['/assets/doodles/pack/sweet-chilli-rush-chilli-whole.svg', 560, -86, 58, 72, true],
  ['/assets/doodles/rounded_chillie.png', 966, -52, 56, -15, true],
  ['/assets/doodles/pack/jalapeno-kick-chilli-whole.svg', 1250, 70, 100, 26, true],
  ['/assets/doodles/rounded_chillie.png', 1300, 330, 82, 30, true],
  ['/assets/doodles/pack/peri-peri-punch-chilli-whole.svg', 1146, 400, 62, 104, true],
  ['/assets/doodles/rounded_chillie.png', 300, 452, 52, -10, true],
  ['/assets/doodles/pack/sweet-chilli-rush-chilli-whole.svg', 820, 420, 54, -62, true],
  ['/assets/hero/confetti/tri-jalapeno-kick.webp', 250, -34, 36, 0, false],
  ['/assets/hero/confetti/tri-sweet-chilli-rush.webp', 1150, 236, 32, 0, false],
  ['/assets/hero/confetti/tri-peri-peri-punch.webp', 700, 468, 30, 0, false],
  ['/assets/hero/confetti/dot-a.webp', -110, 140, 22, 0, false],
  ['/assets/hero/confetti/dot-b.webp', 1200, 150, 18, 0, false],
]

export default function WhyWall({ wall }) {
  if (wall === 'scatter') return <ScatterWall />
  if (wall === 'office') return <OfficeWall />
  return null
}

function ScatterWall() {
  return (
    <div className="wf-wall wf-wall--scatter" aria-hidden="true">
      {SCATTER.map(([src, x, y, w, rot, pale], i) => (
        <img
          key={i}
          src={src}
          alt=""
          loading="lazy"
          className={pale ? 'is-pale' : ''}
          style={{ left: x, top: y, width: w, transform: `rotate(${rot}deg)` }}
        />
      ))}
    </div>
  )
}

function OfficeWall() {
  return (
    <div className="wf-wall wf-wall--office" aria-hidden="true">
      <div className="wf-dado" />

      {/* The monitor's cable, from behind the stand down into the socket. */}
      <svg className="wf-cable" viewBox="0 0 260 90" width="260" height="90">
        <path d="M232 8 C 214 70, 120 84, 58 50" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
        <rect x="8" y="22" width="56" height="56" rx="10" fill="#fffbea" stroke={INK} strokeWidth="5" />
        <rect x="24" y="40" width="6" height="16" rx="2" fill={INK} />
        <rect x="42" y="40" width="6" height="16" rx="2" fill={INK} />
      </svg>

      {/* Hung only where there is wall to spare beside the notes. */}
      <figure className="wf-frame-pic">
        <div className="wf-frame-pic-mat">
          <img src="/assets/hero/pouch-peri-peri-punch.webp" alt="" loading="lazy" />
        </div>
        <figcaption>Employee of the month</figcaption>
      </figure>

      <span className="wf-switch" />
    </div>
  )
}
