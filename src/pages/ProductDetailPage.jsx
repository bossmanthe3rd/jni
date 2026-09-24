import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { bundles, getProductBySlug, toCartProduct } from '../data/products'
import { useCart } from '../store/cartStore'
import Testimonials from '../components/home/Testimonials'
import { ProductCard } from '../components/product/ProductCard'
import ProductAccordion, { buildAccordionItems } from '../components/product/ProductAccordion'
import DoodleField from '../components/ui/DoodleField'
import StickyAtcBar from '../components/product/StickyAtcBar'
import FlavourDossier from '../components/product/FlavourDossier'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const product = getProductBySlug(slug)
  const ctaRef = useRef(null)
  const { addItem, openCart } = useCart()

  // The live site injects Product JSON-LD per PDP.
  useEffect(() => {
    if (!product) return
    document.title = `${product.name} | Just Nibble It`
    const tag = document.createElement('script')
    tag.type = 'application/ld+json'
    tag.dataset.productSchema = product.slug
    tag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: [product.images.pdp],
      description: product.description,
      brand: { '@type': 'Brand', name: 'Just Nibble It' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: product.price,
        availability: 'https://schema.org/InStock',
      },
    })
    document.head.appendChild(tag)
    return () => tag.remove()
  }, [product])

  if (!product) return <Navigate to="/flavours" replace />

  /* The sticky mobile bar's own add: it is outside the dossier, so it has no
     access to the chip the reader chose, and one pack is the honest default
     for a bar that shows a single-pack price. */
  const handleAdd = () => {
    addItem(toCartProduct(product), 1)
    openCart()
  }

  return (
    <div className="min-w-0 flex-grow">
      <div className="bg-cream pb-20 md:pb-0">
        {/* The flavour dossier is the hero now -- the annotated pouch and the
            buy block that used to be a hold-to-open overlay on the homepage.
            It brings its own ground, so it sits outside the cream wrapper's
            padding and runs full width. */}
        <FlavourDossier product={product} ctaRef={ctaRef} />

        <section className="px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <Link
              to="/"
              className="group mb-5 inline-flex h-12 items-center gap-2 rounded-pill border-[3px] border-ink bg-sunshine px-5 text-sm font-black text-ink shadow-doodle transition hover:-translate-y-0.5 hover:shadow-doodle-lg"
            >
              <ArrowLeft size={16} /> Back home
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
          >
            <ProductAccordion items={buildAccordionItems(product)} />
          </motion.div>
        </section>

        {/* Bundle upsell */}
        <section
          className="jni-section-dark relative isolate overflow-hidden px-5 py-10 sm:px-8 sm:py-12 lg:px-12"
        >
          {/* Tinted to the flavour being viewed, so the band belongs to this
              product rather than being the same dark slab on every PDP. */}
          <DoodleField
            flavour={product.slug}
            ground="#071A16"
            intensity="medium"
            count={26}
            seed={product.id * 13 + 3}
          />
          <div className="relative z-10">
          <p className="text-xs font-black uppercase text-sunshine">Do not stop now</p>
          <h2 className="mb-7 mt-1 font-display text-3xl text-teal sm:text-4xl">
            Go for the pack of 3 or the pack of 6.
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {bundles.map((bundle, i) => (
              <ProductCard key={bundle.slug} product={bundle} index={i} />
            ))}
          </div>
        </div>
        </section>
      </div>

      <Testimonials />

      <StickyAtcBar
        name={product.shortName || product.name}
        price={product.price}
        originalPrice={product.originalPrice}
        onAdd={handleAdd}
        watchRef={ctaRef}
      />
    </div>
  )
}
