import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/*
 * Next-day delivery by PIN code.
 *
 * The list is India Post's "24 Speed Post Parcel" pincodes, built into
 * src/data/oneDayPincodes.json by tools/build-pincodes.py. It is loaded on
 * demand -- the first time anyone focuses a PIN field -- so no page pays for it
 * up front, and every PIN field on the site shares the one copy.
 *
 * This is information, not a gate: the address and its PIN are taken for real
 * at the GoKwik hand-off, and every PIN in India still gets delivered.
 */

/** A six-digit Indian PIN code; the first digit is never 0. */
export const PIN_PATTERN = /^[1-9]\d{5}$/

/** Digits only, at most six: what the PIN field keeps of whatever is typed or pasted. */
export const cleanPin = (raw) => String(raw ?? '').replace(/\D/g, '').slice(0, 6)

let listPromise = null

/** Starts the list loading (idempotent). Call it on focus, so a check is instant. */
export function preloadPincodes() {
  if (!listPromise) {
    listPromise = import('../data/oneDayPincodes.json')
      .then((m) => m.default ?? m)
      .catch((err) => {
        // Let the next attempt try again rather than caching the failure.
        listPromise = null
        throw err
      })
  }
  return listPromise
}

/**
 * What a PIN gets.
 *   { status: 'invalid' }                     not a PIN code
 *   { status: 'next-day', pin, city }         on the next-day list
 *   { status: 'standard', pin }               delivered, 2-4 days
 * Rejects only if the list itself could not be loaded.
 */
export async function checkPincode(raw) {
  const pin = cleanPin(raw)
  if (!PIN_PATTERN.test(pin)) return { status: 'invalid' }
  const list = await preloadPincodes()
  const index = list.pins[pin]
  return index === undefined ? { status: 'standard', pin } : { status: 'next-day', pin, city: list.cities[index] }
}

/**
 * The reader's last checked PIN and its answer, shared by every PIN field and
 * kept across visits: checked once on a product page, it is already answered
 * in the crate and at checkout.
 */
export const usePincode = create(
  persist(
    (set) => ({
      result: null,
      setResult: (result) => set({ result }),
      clear: () => set({ result: null }),
    }),
    { name: 'jni-pincode', version: 1 }
  )
)
