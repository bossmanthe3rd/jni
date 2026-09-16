import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'

/** Dark accordion under the PDP hero. First panel starts open. */
export default function ProductAccordion({ items, accent = '#F3C63B' }) {
  const [open, setOpen] = useState(0)

  return (
    /* Separate stickers rather than one box of hairline rows. Six identical
       thin dividers read as a spec sheet; giving each panel its own keyline and
       air makes them things you press, and matches the sticker treatment the
       testimonial and combo cards use. */
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const isOpen = i === open
        return (
          <div
            key={item.title}
            className="overflow-hidden rounded-[18px] border-[3px] transition-colors sm:rounded-[22px]"
            style={{
              borderColor: isOpen ? accent : 'rgba(255,255,255,0.16)',
              backgroundColor: isOpen ? '#11251E' : '#0C1B17',
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5 sm:px-7 sm:py-5"
            >
              <span
                className="font-brand text-base leading-none tracking-wide transition-colors sm:text-lg"
                style={{ color: isOpen ? accent : 'rgba(255,255,255,0.9)' }}
              >
                {item.title}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2"
                style={{ borderColor: accent, color: accent }}
              >
                <Plus size={15} strokeWidth={3} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-sm font-medium leading-6 text-white/75 sm:px-7 sm:pb-6">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

/** Builds the six accordion panels from a product, as the live site does. */
export function buildAccordionItems(product) {
  return [
    {
      title: 'Product Description',
      content: <p>{product.description}</p>,
    },
    {
      title: 'Product Specifications',
      content: (
        <ul className="space-y-1.5">
          <li>
            <strong className="text-sunshine">Net weight:</strong> {product.weight}
          </li>
          <li>
            <strong className="text-sunshine">Flavour profile:</strong> {product.flavor}
          </li>
          <li>
            <strong className="text-sunshine">Shelf life:</strong> 6 months from packaging
          </li>
          <li>
            <strong className="text-sunshine">Packaging:</strong> Resealable stand-up pouch
          </li>
        </ul>
      ),
    },
    {
      title: 'Ingredients Details',
      content: (
        <>
          <p>{product.ingredients.join(', ')}.</p>
          <p className="mt-2 text-xs text-white/45">
            May contain traces of milk, soy and nuts. Manufactured in a facility that also processes
            wheat.
          </p>
        </>
      ),
    },
    {
      title: 'How To Use',
      content: (
        <p>
          Tear along the notch, pour into a bowl (or don&apos;t), and nibble. Reseal the zip-lock for
          later — if there&apos;s any left.
        </p>
      ),
    },
    {
      title: 'FAQ',
      content: (
        <div className="space-y-3">
          <div>
            <p className="font-bold text-sunshine">Is it baked or fried?</p>
            <p>Baked, not fried — crisp without the greasy aftertaste.</p>
          </div>
          <div>
            <p className="font-bold text-sunshine">How spicy is it really?</p>
            <p>{product.flavor} — flavour comes first, heat builds after a few bites.</p>
          </div>
          <div>
            <p className="font-bold text-sunshine">How long does delivery take?</p>
            <p>2-4 days across most metro and regional zones.</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Customer Reviews',
      content: (
        <p>
          Rated {product.rating.value}/5 from {product.rating.count} nibblers so far. Reviews are on
          the way — be the first to leave one after your order.
        </p>
      ),
    },
  ]
}
