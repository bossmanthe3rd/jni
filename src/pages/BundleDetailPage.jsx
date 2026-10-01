import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { bundles, deliveredTotal, getBundleBySlug, products } from '../data/products'
import { useCart } from '../store/cartStore'
import { rupee, useCrateSubtotal } from '../components/checkout/cartTotals'
import StickyAtcBar from '../components/product/StickyAtcBar'
import SectionEdge from '../components/product/SectionEdge'
import TypeBands from '../components/product/TypeBands'
import FlavourReviews from '../components/product/FlavourReviews'
import BundleDossier from '../components/bundle/BundleDossier'
import BoxFacts from '../components/bundle/BoxFacts'
import BoxCompare from '../components/bundle/BoxCompare'
import BundleFaq from '../components/bundle/BundleFaq'
import { boxFlavours, toCartBundle } from '../components/bundle/boxContents'

const CREAM = '#fbf6d0'
const SUNSHINE = '#f3c63b'
const TEAL = '#4db8ae'
const FOREST = '#071a16'

/* The word a review uses for each box, so the reviews section can lead with
   quotes about this box and not pick up ones about the other. */
const REVIEW_WORD = {
  'flipos-flavour-trio': 'trio',
  'flipos-party-six': 'party six',
}

/*
 * A combo's page, top to bottom:
 *
 *   dossier        the three flavours on one stage, and the buy block
 *   box facts      weight, price a pack, shelf life, ingredients per pouch
 *   type bands     the box's facts, crossing into the reviews
 *   reviews        quotes about this box, beside its rating
 *   compare        this box against the other one, and the three singles
 *   faq            the three questions people ask about a combo
 *
 * It is built from the flavour pages' parts -- the same stickers, seams,
 * bands, buy block and chat -- but not their sections: those are each about
 * one flavour, and a box is three. Where a flavour page takes its colour from
 * one pouch, this one takes all three, side by side, and otherwise stays on
 * the house green.
 */
export default function BundleDetailPage() {
  const { slug } = useParams()
  const bundle = getBundleBySlug(slug)
  const ctaRef = useRef(null)
  const navigate = useNavigate()
  const { addItem } = useCart()
  const crateSubtotal = useCrateSubtotal()
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (!bundle) return
    document.title = `${bundle.name} | Just Nibble It`
    const tag = document.createElement('script')
    tag.type = 'application/ld+json'
    tag.dataset.productSchema = bundle.slug
    tag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: bundle.name,
      image: bundle.gallery?.map((g) => g.src) || [bundle.imageUrl],
      description: bundle.description,
      brand: { '@type': 'Brand', name: 'Just Nibble It' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: bundle.price,
        availability: 'https://schema.org/InStock',
      },
    })
    document.head.appendChild(tag)
    return () => tag.remove()
  }, [bundle])

  if (!bundle) return <Navigate to="/combos" replace />

  const flavours = boxFlavours(bundle)
  const word = REVIEW_WORD[bundle.slug]
  const exclude = [
    ...bundles.filter((b) => b.slug !== bundle.slug).map((b) => REVIEW_WORD[b.slug]),
    ...products.map((p) => (p.shortName || p.name).split(' ')[0].toLowerCase()),
  ].filter(Boolean)

  const bands = [
    [
      `${bundle.packetCount} POUCHES`,
      `${flavours.length} FLAVOURS`,
      'MILDEST FIRST',
      'EVERY POUCH RESEALS',
      bundle.weight?.replace(/\s*gms?$/i, ' G').toUpperCase(),
    ].filter(Boolean),
    ['FRIED, NOT BAKED', 'DISPATCHED IN 24H', 'FREE SHIPPING OVER ₹499', 'UPI · CARDS · COD'],
  ]

  const handleBuy = () => {
    addItem(toCartBundle(bundle), qty)
    navigate('/checkout')
  }

  return (
    <div className="min-w-0 flex-grow bg-cream">
      <SectionEdge variant="wave" layer={6}>
        <BundleDossier bundle={bundle} ctaRef={ctaRef} onQtyChange={setQty} />
      </SectionEdge>
      <BoxFacts bundle={bundle} />
      <TypeBands
        from={CREAM}
        to={SUNSHINE}
        words={bands}
        fill={TEAL}
        fillB={FOREST}
        inkB={SUNSHINE}
        slugs={flavours.map((f) => f.product.slug)}
      />
      <SectionEdge variant="wave" layer={4}>
        <FlavourReviews product={bundle} word={word} exclude={exclude} label={bundle.name} />
      </SectionEdge>
      <SectionEdge variant="torn" layer={3}>
        <BoxCompare bundle={bundle} />
      </SectionEdge>
      <SectionEdge variant="wave" layer={2} className="jni-edge-last">
        <BundleFaq bundle={bundle} />
      </SectionEdge>

      <StickyAtcBar
        name={bundle.name}
        price={Number(bundle.price) * qty}
        originalPrice={Number(bundle.originalPrice) * qty}
        image={bundle.gallery?.[0]?.thumb || bundle.imageUrl}
        unit={qty === 1 ? '1 box' : `${qty} boxes`}
        ctaLabel={`Buy · ${rupee(deliveredTotal(crateSubtotal + Number(bundle.price) * qty))}`}
        onAdd={handleBuy}
        watchRef={ctaRef}
      />
    </div>
  )
}
