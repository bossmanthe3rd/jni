import { useEffect } from 'react'

/*
 * Page scroll lock for overlays (cart drawer, nav menu, receipt sheet).
 *
 * `overflow: hidden` on body alone is ignored by iOS Safari before 16, so the
 * page kept sliding around under the drawer. Pinning body with
 * `position: fixed` at the current offset works everywhere; the offset is put
 * back on release so the reader lands where they left off.
 *
 * Only on touch screens, though. Pinning body resets scrollY to 0, and the
 * scroll-driven scenes (the hero zoom, the flavour stage) would jump behind a
 * desktop drawer that leaves them in view. Desktop browsers honour plain
 * overflow: hidden, so they keep it.
 *
 * Counted, so two overlays open at once (the menu, then the cart from inside
 * it) do not release each other's lock.
 */
let locks = 0
let savedY = 0
let saved = null
let pinned = false
let savedPath = ''

function lock() {
  if (locks++ > 0) return
  const { style } = document.body
  pinned = window.matchMedia('(pointer: coarse)').matches
  if (!pinned) {
    saved = { overflow: style.overflow }
    style.overflow = 'hidden'
    return
  }
  savedY = window.scrollY
  savedPath = window.location.pathname
  saved = {
    position: style.position,
    top: style.top,
    width: style.width,
    overflow: style.overflow,
  }
  style.position = 'fixed'
  style.top = `-${savedY}px`
  style.width = '100%'
  style.overflow = 'hidden'
}

function unlock() {
  if (locks === 0 || --locks > 0) return
  Object.assign(document.body.style, saved)
  if (!pinned) return
  // A link inside the overlay (Checkout, Shop flavours) has already moved to a
  // new page, which should start from its own top, not the old offset.
  if (window.location.pathname !== savedPath) return
  // Instant, or html's smooth scroll-behavior animates the page back from 0.
  window.scrollTo({ top: savedY, left: 0, behavior: 'instant' })
}

/** Locks page scroll while `active` is true. */
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return
    lock()
    return unlock
  }, [active])
}
