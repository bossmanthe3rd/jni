import { useSyncExternalStore } from 'react'

/*
 * Which flavour the header badge is wearing.
 *
 * The badge is the pouch's own badge, and on the pouch it comes in the
 * flavour's colour. On the homepage it follows whichever flavour the hero is
 * showing; everywhere else the header turns it on its own clock.
 */

/** The badge's three colours, taken from the brand's nav artwork. */
export const BADGE_FILLS = {
  'peri-peri-punch': '#741213',
  'jalapeno-kick': '#023933',
  'sweet-chilli-rush': '#471121',
}

let current = 'sweet-chilli-rush'
const listeners = new Set()

export const getBadgeFlavour = () => current

export function setBadgeFlavour(slug) {
  if (slug === current || !BADGE_FILLS[slug]) return
  current = slug
  listeners.forEach((fn) => fn())
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useBadgeFlavour() {
  return useSyncExternalStore(subscribe, getBadgeFlavour)
}
