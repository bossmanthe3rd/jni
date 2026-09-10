import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { useCart } from '../../store/cartStore'
import { savingsPercent, toCartProduct } from '../../data/products'
import { SmartImage } from '../ui/Primitives'

/** Single-flavour card used in the homepage "Our flavours" grid. */
export function ProductCard({ product, index = 0 }) {
  const { addItem, openCart } = useCart()
  const [qty, setQty] = useState(1)
  const price = Number(product.price)
  const original = Number(product.originalPrice || price)
  const soldOut = product.stockQuantity === 0
  const image = product.images?.plp || product.imageUrl
  const to = product.isBundle ? `/combos/${product.slug}` : `/flavours/${product.slug}`

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
      className="flex h-full flex-col overflow-hidden rounded-2xl border-[3px] border-ink bg-cream sm:rounded-[22px]"
    >
      <Link
        to={to}
        aria-label={`View ${product.name}`}
        className={`relative block shrink-0 overflow-hidden bg-[#F7F1C8] text-left ${
          product.isBundle ? 'aspect-[16/10] min-h-[180px]' : 'aspect-[5/4]'
        }`}
      >
        <SmartImage
          src={image}
          alt={`${product.name} pack`}
          width="1200"
          height="1200"
          className="h-full w-full object-contain p-1.5 sm:p-3"
        />
      </Link>

      <div className="flex flex-1 flex-col px-2 pb-2.5 pt-2 text-ink sm:px-4 sm:pb-4 sm:pt-3">
        <h3 className="text-[13px] font-black leading-tight sm:text-lg">
          {product.shortName || product.name}
        </h3>
        {(product.tagline || product.subtitle) && (
          <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-ink/70 sm:mt-1 sm:text-sm">
            {product.tagline || product.subtitle}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pt-4">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-base font-black sm:text-xl">₹{price}</span>
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
          className="jni-btn mt-2 h-9 min-h-0 w-full px-2 text-[11px] sm:mt-3 sm:h-12 sm:px-5 sm:text-sm"
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
      className="flex h-full flex-col overflow-hidden rounded-2xl border-[3px] border-ink sm:rounded-[22px]"
      style={{ backgroundColor: '#0C1B17' }}
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

      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2 text-white sm:px-4 sm:pb-4 sm:pt-3">
        <Link
          to={`/combos/${bundle.slug}`}
          className="font-brand text-base leading-tight text-sunshine hover:underline sm:text-xl"
        >
          {bundle.shortName || bundle.name}
        </Link>
        <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-4 text-white/60 sm:min-h-10 sm:text-sm sm:leading-5">
          {bundle.description}
        </p>

        <div className="mt-auto flex flex-col gap-1.5 pt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3 sm:pt-4">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="font-brand text-xl text-sunshine sm:text-2xl">₹{bundle.price}</span>
            <span className="text-[11px] font-semibold text-white/40 line-through sm:text-sm">
              ₹{bundle.originalPrice}
            </span>
          </div>
          <span className="w-fit rounded-pill border-[2px] border-teal px-2 py-0.5 text-[9px] font-black uppercase text-teal sm:px-2.5 sm:py-1 sm:text-[10px]">
            Save {save}%
          </span>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="jni-btn mt-2 h-9 min-h-0 w-full px-2 text-[11px] sm:mt-3 sm:h-12 sm:px-5 sm:text-sm"
        >
          Nibble Now
        </button>
      </div>
    </motion.article>
  )
}
