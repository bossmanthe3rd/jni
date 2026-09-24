import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * The three questions people actually ask, kept as an accordion because they
 * are questions -- the facts that used to share the accordion with them are
 * on the sticker board now.
 */
export default function PdpFaq({ product }) {
  const [open, setOpen] = useState(0)
  const items = [
    {
      q: 'How spicy is it really?',
      a: `${product.flavor} — flavour comes first, heat builds after a few bites.`,
    },
    { q: 'Is it baked or fried?', a: 'Fried. That is where the crunch comes from.' },
    { q: 'How long does delivery take?', a: '2-4 days across most metro and regional zones.' },
  ]

  return (
    <section className="jni-faq" aria-labelledby="jni-faq-title">
      <h2 id="jni-faq-title">Asked a lot</h2>
      <div className="jni-faq-list">
        {items.map((it, i) => {
          const isOpen = i === open
          return (
            <div key={it.q} className="jni-sticker jni-faq-item" data-open={isOpen ? '' : undefined}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`jni-faq-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                {it.q}
                <span aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`jni-faq-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p>{it.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </section>
  )
}
