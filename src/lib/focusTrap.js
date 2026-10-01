const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Keeps Tab inside `root` while a modal is open: from the last control it
 * wraps to the first, and Shift+Tab from the first wraps to the last.
 * Call from a keydown handler on Tab.
 */
export function trapTab(e, root) {
  if (!root) return
  const items = [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) {
    e.preventDefault()
    first.focus()
  }
}
