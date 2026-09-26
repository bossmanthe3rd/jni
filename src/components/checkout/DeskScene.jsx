import { useEffect, useState } from 'react'
import DoodleField from '../ui/DoodleField'
import { DeskSurface, WallClock } from '../home/HeroDesk'

/*
 * Checkout, set at the same desk the homepage opens on.
 *
 * The hero is shot from the chair: a cream wall with the flavour's doodles
 * drifting on it, a yellow desktop across the bottom, stationery standing on
 * it, a dark front edge closing the frame. Checkout is that desk after you
 * have picked: the wall carries the heading, the crate and the bill lie on the
 * desktop, and the calculator and the mug stand along the front edge.
 *
 * The wall's doodles take the flavour of the first thing in the crate, so the
 * page is dressed in what you are buying.
 */

const D = '/assets/hero/desk'
const C = '/assets/hero/confetti'

// The doodles fall quiet where the copy sits, the way the hero's bold layer
// is loud round the packs and gone by the headline.
const QUIET = {
  left: 'linear-gradient(to right, rgb(0 0 0 / 0.18) 0, rgb(0 0 0 / 0.18) 30%, #000 62%)',
  center: 'radial-gradient(ellipse 34% 60% at 50% 55%, rgb(0 0 0 / 0.12) 55%, #000 100%)',
}

/** The wall: doodles, a little confetti, the clock. Children are the heading. */
export function DeskWall({ flavour = 'sweet-chilli-rush', quiet = 'left', children }) {
  const now = useMinute()
  return (
    <section className="ck-wall relative isolate">
      <div
        className="pointer-events-none absolute inset-0 -z-10 isolate"
        style={{ maskImage: QUIET[quiet], WebkitMaskImage: QUIET[quiet] }}
      >
        <DoodleField
          flavour={flavour}
          ground="#fbf6d0"
          intensity="medium"
          count={18}
          seed={307}
          fadeEdges={{ top: 20, bottom: 0 }}
        />
      </div>
      <img src={`${C}/line-c.webp`} alt="" aria-hidden="true" className="ck-confetti left-[46%] top-[42%] w-16 rotate-[8deg]" />
      <img src={`${C}/gold-a.webp`} alt="" aria-hidden="true" className="ck-confetti left-[58%] top-[64%] w-7 rotate-[20deg]" />
      <img src={`${C}/tri-${flavour}.webp`} alt="" aria-hidden="true" className="ck-confetti left-[70%] top-[36%] w-6" />
      <WallClock now={now} className="ck-clock" />
      {children}
    </section>
  )
}

/**
 * The desktop. Content lies on it; the front edge and the stationery are drawn
 * after the content so they close the page into the footer.
 */
export function DeskTop({ children }) {
  return (
    <section className="ck-desk jni-grain">
      <DeskSurface className="ck-desk-edge" />
      {/* Flat things lie in the margins on a wide screen, the way a real desk
          collects them round whatever you're working on -- so only when there
          is something on it. */}
      {children && (
        <>
          <img src={`${D}/peri-peri-punch--clips.webp`} alt="" aria-hidden="true" className="ck-flat left-[2.5%] top-[90px] w-[5.5vw] -rotate-12" />
          <img src={`${D}/sweet-chilli-rush--clips.webp`} alt="" aria-hidden="true" className="ck-flat right-[2%] top-[46%] w-[6vw] rotate-[18deg]" />
        </>
      )}
      <div className="ck-desk-body">{children}</div>

      <div className="ck-props" aria-hidden="true">
        <img src={`${D}/peri-peri-punch--mug.webp`} alt="" className="ck-prop ck-prop--mug" />
        <img src={`${D}/sweet-chilli-rush--pens.webp`} alt="" className="ck-prop ck-prop--pens" />
        <img src={`${D}/sweet-chilli-rush--calculator.webp`} alt="" className="ck-prop ck-prop--calc" />
      </div>
      <svg className="ck-lip" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 22 C 200 4 380 30 620 18 C 860 6 1080 34 1260 16 C 1340 8 1400 12 1440 18 L1440 80 L0 80 Z" />
      </svg>
    </section>
  )
}

/** The current time, refreshed on the minute, for the wall clock. */
function useMinute() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}
