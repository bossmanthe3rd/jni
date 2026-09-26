/*
 * The wall behind the Why Flipo's monitor: the campaign banner's own wall,
 * pale chillies and bitten chips drifting round the monitor, a few
 * full-colour triangles. It is the hero's wall seen close up -- the hero's
 * camera move ends here -- so it has to be the same paper.
 *
 * Laid out in the 1180 x 600 artboard's own units and hung off the rig, so it
 * zooms with the monitor. Laptops only.
 */

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

export default function WhyWall() {
  return (
    <div className="wf-wall" aria-hidden="true">
      {SCATTER.map(([src, x, y, width, rot, pale], i) => (
        <img
          key={i}
          src={src}
          alt=""
          loading="lazy"
          className={pale ? 'is-pale' : ''}
          style={{ left: x, top: y, width, transform: `rotate(${rot}deg)` }}
        />
      ))}
    </div>
  )
}
