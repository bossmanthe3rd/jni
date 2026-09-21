import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { packPalettes } from '../icons/PackDoodles'

/**
 * The pouch, lifted off its card and annotated.
 *
 * It is the card's own photograph, not a second one: the layer opens at
 * exactly the rect of the photo in the card -- same file, same size, same
 * corners, no shadow -- and only then rises and grows. Underneath, the whole
 * grid is dissolving at the same moment, so what is left on screen is one pack
 * coming up off a colour field. It has to be a separate element to do that at
 * all, because the teal panel clips its own overflow and the grid it sits in is
 * the thing being blurred away.
 *
 * On the way out it settles back onto the card as the card fades back in. The
 * two are pixel-aligned at rest, which is what makes the handover invisible in
 * both directions.
 *
 * The arrow coordinates are the prototype's, unchanged: percentages of a square
 * photo, which is what the card's tile now is.
 */

const ARROWS = [
  { d: 'M21,13 C32,14 39,19 46,26', head: [46, 26, 39.5, 22.5, 40, 29.5] },  // the zip seal
  { d: 'M79,42 C72,44 66,46 60,49', head: [60, 49, 65.5, 46, 66, 52] },      // the window
  { d: 'M26,84 C31,79 35,73 40,66', head: [40, 66, 34.5, 66.5, 38.5, 71] },  // the seasoning
]

const PIP_CHILLI =
  'M17 8c5-6 11-7 12-2s-5 7-8 8c6 4 9 14 6 26-3 13-13 22-19 20S2 44 6 33s8-18 11-25Z'

/* Enough to read as the pack coming forward, and no more: the notes hang off
   the sides at fixed percentages and scale with it, and past about 1.1 the
   outer cards push their left-hand note off the edge of the section. */
const LIFT = -22
const GROW = 1.08

function notesFor(product) {
  return [
    { cls: 'p-a', title: 'Reseal it', body: 'Zip-lock stand-up pouch — stash the rest for later.' },
    { cls: 'p-b', title: 'Baked', body: 'Not fried. Crisp without the greasy aftertaste.', pip: true },
    { cls: 'p-c', title: "What's in it", body: `${product.ingredients.join(', ')}.` },
  ]
}

export default function FlavourProbeOverlay({ product, rect }) {
  const svgRef = useRef(null)
  const reduce = useReducedMotion()
  const palette = packPalettes[product.slug]

  /*
   * Each path measures itself and hands its own length to the dash reveal: one
   * shared guess makes the short strokes finish early and the long ones snap.
   * `lit` goes on only once every path is sitting hidden, because until --len
   * is set the dash is invalid, the line renders solid, and transitioning out
   * of that state draws all six strokes at once on the first frame.
   */
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.classList.remove('lit')
    svg.replaceChildren()
    const ns = 'http://www.w3.org/2000/svg'
    // A second pass a hair off the first, the way a pen goes over a line twice.
    const jitter = (d, k) =>
      d.replace(/\d+(?:\.\d+)?/g, (n) =>
        (Number(n) + Math.sin(Number(n) * 12.9898 + k) * 0.75).toFixed(2)
      )
    ARROWS.forEach((a, i) => {
      const [hx, hy, ax, ay, bx, by] = a.head
      const headD = `M${ax},${ay} L${hx},${hy} L${bx},${by}`
      const specs = [
        [a.d, false],
        [headD, false],
        [jitter(a.d, i + 1), true],
        [jitter(headD, i + 5), true],
      ]
      specs.forEach(([d, ghost]) => {
        const p = document.createElementNS(ns, 'path')
        p.setAttribute('d', d)
        if (ghost) p.setAttribute('class', 'ghost')
        p.style.setProperty('--i', String(i))
        svg.appendChild(p)
        p.style.setProperty('--len', p.getTotalLength().toFixed(1))
      })
    })
    const id = requestAnimationFrame(() => svg.classList.add('lit'))
    return () => cancelAnimationFrame(id)
  }, [product.slug])

  const seated = { x: 0, y: 0, scale: 1, boxShadow: '0px 0px 0px rgba(7,26,22,0)' }
  const raised = {
    x: rect.pull || 0,
    y: LIFT,
    scale: GROW,
    boxShadow: '14px 16px 0px rgba(7,26,22,0.55)',
  }

  return (
    <motion.div
      className="jni-probe-overlay"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        borderColor: palette?.line || '#071a16',
      }}
      initial={{ ...seated, opacity: 1 }}
      animate={reduce ? { ...raised, transition: { duration: 0 } } : { ...raised, opacity: 1 }}
      exit={{ ...seated, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 210, damping: 24, opacity: { duration: 0.24 } }}
      aria-hidden="true"
    >
      <img src={product.images?.plp || product.imageUrl} alt="" className="jni-probe-photo" />

      <svg ref={svgRef} className="jni-probe-marks" viewBox="0 0 100 100" />

      {notesFor(product).map((n, i) => (
        <span
          key={n.cls}
          className={`jni-probe-note ${n.cls}`}
          style={{ '--pin': palette?.fill, '--i': i }}
        >
          {n.pip && (
            <svg className="jni-probe-pip" viewBox="0 0 34 64">
              <path
                d={PIP_CHILLI}
                fill="var(--pin)"
                stroke="#071a16"
                strokeWidth="3.4"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <b>{n.title}</b>
          {n.body}
        </span>
      ))}
    </motion.div>
  )
}
