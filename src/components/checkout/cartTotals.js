import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT } from '../../data/products'

/**
 * Every figure the drawer and the checkout bill show, worked out in one place
 * so the two can never disagree about what the crate costs.
 */
export function cartTotals(items) {
  const subtotal = items.reduce((n, i) => n + Number(i.price) * i.qty, 0)
  const savings = items.reduce(
    (n, i) => n + Math.max(0, Number(i.originalPrice || i.price) - Number(i.price)) * i.qty,
    0
  )
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT
  const packs = items.reduce((n, i) => n + i.qty, 0)
  return { subtotal, savings, shipping, total: subtotal + shipping, packs }
}

/** "1 item" / "3 items". */
export const itemCount = (n) => `${n} ${n === 1 ? 'item' : 'items'}`
