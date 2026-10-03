import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useMotionValue, useMotionValueEvent, useScroll } from 'framer-motion'
import { useMediaQuery } from '../ui/Primitives'
import HeroCarousel from './HeroCarousel'
import WhyFlipos from './WhyFlipos'
import { HeroZoomContext } from './heroZoomContext'

/*
 * The hero and Why Flipo's as one camera move.
 *
 * There is a monitor on the hero's desk, and Why Flipo's is that monitor from
 * a step away. On laptops the two share one pinned screen: Why Flipo's
 * underneath, the hero on top. Scrolling walks the camera up to the hero's
 * monitor -- the whole hero scales about a point chosen so the monitor lands
 * exactly on Why Flipo's own monitor -- while the copy, packs and lamp fade
 * out of the way. When the monitors coincide the hero fades out, leaving the
 * real section, and the sticky notes go up round the bezel. Then the pin lets
 * go and the page scrolls on.
 *
 * The monitor starts on the left and ends in the middle, but the room can
 * only slide so far before its edge comes into frame. So the room scales and
 * slides as far as it can while still filling the frame, and the monitor
 * makes up the rest itself -- the near thing moving further than the far
 * wall, which is how a camera pan reads anyway. (A backdrop of more wall and
 * desk sits behind the hero as a last resort.) Why Flipo's desk is set to
 * wherever the hero's desk lands once the camera arrives, so the two meet on
 * the same line.
 *
 * Scroll drives all of it, so scrolling back up plays it backwards. Each
 * frame writes one transform; nothing re-renders but the two flags that flip
 * at the ends of the move.
 *
 * Phones and reduced motion get the two sections one after the other, as
 * before.
 */

// How far past the hero the pin holds, in screen heights.
const RUN_VH = 160
// Where on that run each phase sits, 0..1.
const ZOOM_FROM = 0.04
const ZOOM_TO = 0.72
const FADE_TO = 0.84
const FORE_FADE = 0.2

// Why Flipo's monitor, in its artboard's units: 680 wide, its foot at 536.
const MONITOR_W = 680
const MONITOR_BOTTOM = 536
// Where the hero desk's drawn back edge sits in its box, as a share of its height.
const DESK_EDGE = 0.027

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

export default function HeroWhyZoom() {
  const wide = useMediaQuery('(min-width: 1024px)')
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  if (!wide || reduceMotion) {
    return (
      <>
        <HeroCarousel />
        <WhyFlipos />
      </>
    )
  }
  return <CameraMove />
}

function CameraMove() {
  const runwayRef = useRef(null)
  const stageRef = useRef(null)
  const heroLayerRef = useRef(null)
  const heroMonitorRef = useRef(null)
  const whyMonitorRef = useRef(null)
  const fore = useMotionValue(1)
  const camera = useMotionValue(1)
  const [revealed, setRevealed] = useState(false)
  const [heroLive, setHeroLive] = useState(true)
  // Until the hero starts to fade, Why Flipo's underneath cannot be seen.
  const [covered, setCovered] = useState(true)
  // The two monitors' rects in the stage's own coordinates, the hero's with
  // the camera taken back out.
  const geo = useRef(null)
  const cam = useRef({ s: 1, tx: 0, ty: 0, rx: 0, ry: 0 })
  const { scrollYProgress } = useScroll({ target: runwayRef, offset: ['start start', 'end end'] })

  const apply = useCallback(
    (q) => {
      const layer = heroLayerRef.current
      const g = geo.current
      if (!layer || !g) return
      const { H, W } = g
      const S = W.w / H.w
      const p = easeInOut(clamp01((q - ZOOM_FROM) / (ZOOM_TO - ZOOM_FROM)))
      // Scale geometrically, so the approach feels even; move the monitor's
      // centre in step with the scale, as it would toward a fixed point.
      const s = S ** p
      const k = Math.abs(S - 1) < 1e-3 ? p : (s - 1) / (S - 1)
      const hx = H.x + H.w / 2
      const hy = H.y + H.h / 2
      const cx = hx + (W.x + W.w / 2 - hx) * k
      const cy = hy + (W.y + W.h / 2 - hy) * k
      // Where the room would have to go to carry the monitor all the way...
      const tx = cx - hx * s
      const ty = cy - hy * s
      // ...how far it can go and still fill the frame...
      const rtx = s >= 1 ? Math.min(0, Math.max(g.vw * (1 - s), tx)) : tx
      const rty = s >= 1 ? Math.min(0, Math.max(g.vh * (1 - s), ty)) : ty
      layer.style.transform = `translate(${rtx}px, ${rty}px) scale(${s})`
      // ...and the monitor covers the difference.
      const rx = tx - rtx
      const ry = ty - rty
      const box = heroMonitorRef.current?.parentElement
      if (box) box.style.transform = rx || ry ? `translate(${rx / s}px, ${ry / s}px)` : ''
      cam.current = { s, tx: rtx, ty: rty, rx, ry }
      camera.set(s)

      fore.set(1 - clamp01((q - ZOOM_FROM) / FORE_FADE))
      const fade = clamp01((q - ZOOM_TO) / (FADE_TO - ZOOM_TO))
      layer.style.opacity = String(1 - fade)
      layer.style.visibility = fade >= 1 ? 'hidden' : ''
      setRevealed(q >= FADE_TO - 0.005)
      setHeroLive(q < ZOOM_FROM + 0.01)
      setCovered(fade <= 0)
    },
    [camera, fore],
  )

  const measure = useCallback(() => {
    const stage = stageRef.current
    const hm = heroMonitorRef.current
    const wm = whyMonitorRef.current
    if (!stage || !hm || !wm) return
    const st = stage.getBoundingClientRect()
    const h = hm.getBoundingClientRect()
    const w = wm.getBoundingClientRect()
    if (!h.width || !w.width) return
    // Take the camera, and the monitor's own share of the move, back out.
    const { s, tx, ty, rx, ry } = cam.current
    const H = {
      x: (h.left - st.left - tx - rx) / s,
      y: (h.top - st.top - ty - ry) / s,
      w: h.width / s,
      h: h.height / s,
    }
    const W = { x: w.left - st.left, y: w.top - st.top, w: w.width, h: w.height }
    geo.current = { H, W, vw: st.width, vh: st.height }

    // Put Why Flipo's desk where the hero's lands: the hero's gap from the
    // monitor's foot back to the desk's edge, scaled by the camera's arrival,
    // in the section's own artboard units. (The drawn edge sits a hair below
    // the top of its box.)
    const desk = heroLayerRef.current?.querySelector('[data-hero-desk]')
    const rig = wm.closest('.wf-rig')
    if (desk && rig) {
      const d = desk.getBoundingClientRect()
      const edge = (d.top - st.top - ty) / s + (d.height / s) * DESK_EDGE
      const S = W.w / H.w
      const zoom = W.w / MONITOR_W
      const drop = (S * (H.y + H.h - edge)) / zoom
      rig.style.setProperty('--wf-desk-top', `${Math.round(MONITOR_BOTTOM - drop)}px`)
    }
    apply(scrollYProgress.get())
  }, [apply, scrollYProgress])

  useMotionValueEvent(scrollYProgress, 'change', apply)

  // Measure once everything has laid out, again as late images and fonts
  // settle, and on every resize -- a frame late, after Why Flipo's has
  // re-fitted its artboard.
  useLayoutEffect(() => {
    measure()
    let frame = 0
    const later = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    const timers = [150, 600, 1500].map((ms) => setTimeout(measure, ms))
    window.addEventListener('resize', later)
    document.fonts?.ready.then(measure)
    return () => {
      timers.forEach(clearTimeout)
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', later)
    }
  }, [measure])

  useEffect(() => {
    const ro = new ResizeObserver(() => measure())
    if (heroMonitorRef.current) ro.observe(heroMonitorRef.current)
    if (whyMonitorRef.current) ro.observe(whyMonitorRef.current)
    return () => ro.disconnect()
  }, [measure])

  const zoom = useMemo(() => ({ staged: true, fore, camera, monitorRef: heroMonitorRef }), [fore, camera])

  return (
    <div ref={runwayRef} className="relative" style={{ height: `calc(100vh + ${RUN_VH}vh)` }}>
      {/* Where the header counts the opening as over, so its badge retracts
          before the monitor grows up under it: a third of the way in. */}
      <div
        data-intro-end
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 h-0"
        style={{ top: `calc(${0.3 * RUN_VH}vh + var(--site-header-offset))` }}
      />
      {/* The section's anchor, where the camera has arrived. */}
      <div
        id="why-flipos"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 h-px"
        style={{ top: `${FADE_TO * RUN_VH}vh` }}
      />
      <div ref={stageRef} className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0">
          <WhyFlipos staged revealed={revealed} covered={covered} monitorRef={whyMonitorRef} />
        </div>
        <div
          ref={heroLayerRef}
          className="hero-zoom-layer absolute inset-0 z-10 origin-top-left"
          style={{ pointerEvents: heroLive ? undefined : 'none' }}
        >
          {/* More of the room, off every side of the hero, for the camera's
              slide to uncover. */}
          <div className="hero-zoom-bleed" aria-hidden="true" />
          <HeroZoomContext.Provider value={zoom}>
            <HeroCarousel />
          </HeroZoomContext.Provider>
        </div>
      </div>
    </div>
  )
}
