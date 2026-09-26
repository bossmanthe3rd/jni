import { products } from '../../data/products'
import { heatLevel } from '../product/HeatMeter'

/**
 * What is in a box, in the order to eat it.
 *
 * A bundle only lists slugs and quantities. Every combo section wants the
 * products behind them, and wants them mildest first -- Sweet, Fresh, Big --
 * because that is the order the heat ramp runs, and the hero stage stands
 * them left to right in it. Sorting here keeps every section in step.
 */
export function boxFlavours(bundle) {
  return (bundle?.lineItems || [])
    .map((line) => ({
      product: products.find((p) => p.slug === line.productSlug),
      quantity: line.quantity || 1,
    }))
    .filter((f) => f.product)
    .sort((a, b) => heatLevel(a.product) - heatLevel(b.product))
}

/** Every pouch in the box, one entry each: the Party Six gives six. */
export function boxPouches(bundle) {
  return boxFlavours(bundle).flatMap(({ product, quantity }) =>
    Array.from({ length: quantity }, (_, copy) => ({ product, copy }))
  )
}

/** The cut-out pouch, background removed, that the combo pages stand up. */
export const pouchCutout = (slug) => `/assets/hero/pouch-${slug}.webp`

/** The cart line a bundle becomes, the same shape the combos index adds. */
export const toCartBundle = (bundle) => ({ ...bundle, selectedWeight: bundle.includes.join(', ') })
