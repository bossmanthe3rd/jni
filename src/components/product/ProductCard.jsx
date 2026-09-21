import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { useCart } from '../../store/cartStore'
import { savingsPercent, toCartProduct } from '../../data/products'
import { packPalettes } from '../icons/PackDoodles'
import { SmartImage } from '../ui/Primitives'
import HeatMeter from './HeatMeter'

/** Single-flavour card used in the homepage "Our flavours" grid.
 *
 * The three cards used to be identical but for the photo -- same ink border,
 * same black price, nothing said which one was the hot one. Each now carries
 * its own pack palette: a flavour badge over the image, the card's own ink
 * border colour, and the price in the pack's own dark ink. */
/**
 * `onLive` is opt-in and unused everywhere but the homepage grid, where holding
 * the pointer on a pack photo takes the section over. It is reported from the
 * photo rather than from the card because the photo is what the gesture is
 * about -- pointing at the price is not asking to read the pouch. The card is
 * otherwise untouched: same price, same stepper, same add-to-cart.
 */
export function ProductCard({ product, index = 0, onLive }) {
  const { addItem, openCart } = useCart()
  const [qty, setQty] = useState(1)
  const price = Number(product.price)
  const original = Number(product.originalPrice || price)
  const soldOut = product.stockQuantity === 0
  const image = product.images?.plp || product.imageUrl
  const to = product.isBundle ? `/combos/${product.slug}` : `/flavours/${product.slug}`
  const palette = packPalettes[product.slug]

  const handleAdd = () => {
    if (soldOut) return
    const payload = product.isBundle
      ? { ...product, selectedWeight: product.includes?.join(', ') || product.weight }
      : toCartProduct(product)
    addItem(payload, qty)
    openCart()
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border-[3px] bg-cream sm:rounded-[22px]"
      style={{ borderColor: palette?.line || 'var(--color-border)' }}
      data-slug={product.slug}
    >
      {/* The photo sits in the card as its own tile rather than filling the
          top edge: inset on all four sides and cut with the same uneven radius
          the packs and buttons use, so the corners look torn rather than
          machined. The inset is the padding the image already carried, moved
          from inside the box to outside it, so the pouch does not change size. */}
      <Link
        to={to}
        aria-label={`View ${product.name}`}
        onFocus={onLive ? () => onLive(product.slug) : undefined}
        onBlur={onLive ? () => onLive(null) : undefined}
        onPointerEnter={onLive ? () => onLive(product.slug) : undefined}
        onPointerLeave={onLive ? () => onLive(null) : undefined}
        className={`jni-probe-media relative mx-2 mt-2 block shrink-0 overflow-hidden border-2 bg-[#F7F1C8] text-left sm:mx-6 sm:mt-6 ${
          product.isBundle ? 'aspect-[16/10] min-h-[180px]' : 'aspect-square'
        }`}
        style={{ borderColor: palette?.line || 'var(--color-border)' }}
      >
        <SmartImage
          src={image}
          alt={`${product.name} pack`}
          width="1200"
          height="1200"
          className="h-full w-full object-contain"
        />
        {palette && product.flavor && (
          <span
            className="absolute left-2 top-2 rounded-pill border-[2px] px-2 py-1 text-[9px] font-black uppercase text-ink sm:left-3 sm:top-3 sm:border-[3px] sm:px-3 sm:py-1.5 sm:text-[10px]"
            style={{ backgroundColor: palette.fill, borderColor: palette.line }}
          >
            {product.flavor}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-2 pb-2.5 pt-2 text-ink sm:px-6 sm:pb-6 sm:pt-4">
        <h3 className="text-[13px] font-black leading-tight sm:text-2xl">
          {product.shortName || product.name}
        </h3>
        {(product.tagline || product.subtitle) && (
          <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-ink/70 sm:mt-1.5 sm:text-base">
            {product.tagline || product.subtitle}
          </p>
        )}
        {palette && (
          <HeatMeter
            product={product}
            flavour={product.slug}
            labelClassName="text-ink/60"
            className="mt-1.5 sm:mt-2"
          />
        )}

        <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pt-4">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span
              className="text-lg font-black sm:text-2xl"
              style={{ color: palette?.stem || 'var(--color-text-dark)' }}
            >
              ₹{price}
            </span>
            {original > price && (
              <span className="text-[11px] font-semibold text-ink/40 line-through sm:text-sm">
                ₹{original}
              </span>
            )}
          </div>

          <div className="hidden h-10 items-center rounded-xl border-[2.5px] border-ink bg-cream sm:flex">
            <button
              type="button"
              aria-label="Decrease quantity"
              className="grid h-10 w-9 place-items-center"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus size={14} />
            </button>
            <span className="min-w-5 text-center text-sm font-black">{qty}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              className="grid h-10 w-9 place-items-center"
              onClick={() => setQty((q) => q + 1)}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          className="jni-btn mt-3 h-9 min-h-0 self-center px-6 text-[11px] sm:mt-5 sm:h-[3.25rem] sm:px-14 sm:text-base"
        >
          {soldOut ? 'Sold out' : 'Nibble Now'}
        </button>
      </div>
    </motion.article>
  )
}

/** Dark bundle card used in the homepage grid. */
export function BundleCard({ bundle, index = 0 }) {
  const { addItem, openCart } = useCart()
  const save = savingsPercent(bundle.price, bundle.originalPrice)

  const handleAdd = () => {
    addItem({ ...bundle, selectedWeight: bundle.includes.join(', ') })
    openCart()
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border-[3px] border-ink bg-cream sm:rounded-[22px]"
    >
      <Link
        to={`/combos/${bundle.slug}`}
        aria-label={`View ${bundle.name}`}
        className="relative block aspect-[16/10] shrink-0 overflow-hidden bg-[#F7F1C8] sm:aspect-[16/9]"
      >
        <SmartImage
          src={bundle.imageUrl}
          alt={`${bundle.name} party snack combo`}
          width="1200"
          height="675"
          className="h-full w-full object-cover"
        />
        <span className="absolute left-2 top-2 rounded-pill border-[2px] border-ink bg-sunshine px-2 py-1 text-[9px] font-black uppercase text-ink sm:left-3 sm:top-3 sm:border-[3px] sm:px-3 sm:py-1.5 sm:text-[10px]">
          {bundle.badge}
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2 text-ink sm:px-4 sm:pb-4 sm:pt-3">
        <Link
          to={`/combos/${bundle.slug}`}
          className="font-brand text-base leading-tight text-ink hover:underline sm:text-2xl"
        >
          {bundle.shortName || bundle.name}
        </Link>
        <p className="mt-1.5 line-clamp-2 text-[11px] font-medium leading-4 text-ink/70 sm:min-h-10 sm:text-base sm:leading-6">
          {bundle.description}
        </p>

        <div className="mt-auto flex flex-col gap-1.5 pt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pt-4">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="font-brand text-xl text-ink sm:text-3xl">₹{bundle.price}</span>
            <span className="text-[11px] font-semibold text-ink/40 line-through sm:text-sm">
              ₹{bundle.originalPrice}
            </span>
          </div>
          <span className="w-fit rounded-pill border-[2px] border-ink bg-teal px-2 py-0.5 text-[9px] font-black uppercase text-ink sm:px-2.5 sm:py-1 sm:text-[10px]">
            Save {save}%
          </span>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="jni-btn mt-3 h-9 min-h-0 self-center px-6 text-[11px] sm:mt-5 sm:h-[3.25rem] sm:px-14 sm:text-base"
        >
          Nibble Now
        </button>
      </div>
    </motion.article>
  )
}
