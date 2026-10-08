import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { deliveredTotal, getProductBySlug, toCartProduct } from '../data/products'
import { useCart } from '../store/cartStore'
import { rupee, useCrateSubtotal } from '../components/checkout/cartTotals'
import StickyAtcBar from '../components/product/StickyAtcBar'
import FlavourDossier from '../components/product/FlavourDossier'
import HeatClimb from '../components/product/HeatClimb'
import PouchFacts from '../components/product/PouchFacts'
import DeskMoments from '../components/product/DeskMoments'
import FlavourReviews from '../components/product/FlavourReviews'
import FlavourFlight from '../components/product/FlavourFlight'
import PdpFaq from '../components/product/PdpFaq'
import SectionEdge from '../components/product/SectionEdge'
import TypeBands from '../components/product/TypeBands'
import { packPalettes } from '../components/icons/PackDoodles'
import '../styles/pdp.css'
import { SHOP_HREF } from '../data/site'

const CREAM = '#fbf6d0'
const FOREST = '#071a16'
const SUNSHINE = '#f3c63b'

/*
 * The product page, top to bottom:
 *
 *   dossier       the pouch, the flavour switcher and the buy block
 *   heat climb    "flavour first, heat second", five bites deep
 *   pouch facts   weight, shelf life, zip, ingredients -- all on show
 *   faq           the three questions people ask
 *   desk moments  the two combos, each print linking to its pack page
 *   reviews       quotes about this flavour, beside its own rating
 *   flight        this pack plus the other two, then the bundles
 *
 * Every section after the hero takes its colour or its words from the
 * flavour, so no two product pages read as the same template with a new
 * photo in it.
 *
 * No two sections meet on a straight line: each boundary is a wave or a
 * torn edge cut into the section above (SectionEdge), or a pair of type
 * bands crossing it.
 */
export default function ProductDetailPage() {
  const { slug } = useParams()
  const product = getProductBySlug(slug)
  const ctaRef = useRef(null)
  const navigate = useNavigate()
  const { addItem } = useCart()
  const crateSubtotal = useCrateSubtotal()
  const [qty, setQty] = useState(1)

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

  if (!product) return <Navigate to={SHOP_HREF} replace />

  const ground = packPalettes[product.slug]?.ground || product.theme?.ink

  /* The sticky mobile bar's own buy: the dossier reports the pack chip the
     reader lit, so "3 packs" chosen up top is still 3 packs down here. */
  const handleBuy = () => {
    addItem(toCartProduct(product), qty)
    navigate('/checkout')
  }

  return (
    /* No bottom padding for the mobile buy bar: the footer follows this page,
       so padding here only ever pushed a cream strip in between the last
       section's cut edge and the footer. */
    <div className="min-w-0 flex-grow bg-cream">
      <SectionEdge variant="wave" layer={6}>
        <FlavourDossier product={product} ctaRef={ctaRef} onQtyChange={setQty} />
      </SectionEdge>
      <SectionEdge variant="torn" layer={5}>
        <HeatClimb product={product} />
      </SectionEdge>
      <PouchFacts product={product} />
      {/* Straight on from the pouch facts: the two share the dotted board, so
          the questions read as more of the same wall. */}
      <PdpFaq product={product} />
      <TypeBands product={product} from={CREAM} to={FOREST} />
      <SectionEdge variant="wave" layer={4}>
        <DeskMoments product={product} />
      </SectionEdge>
      <FlavourReviews product={product} />
      <TypeBands product={product} from={SUNSHINE} to={ground} />
      {/* The last section cuts its own edge into the site footer, which then
          drops its painted lip (see .jni-edge-last in pdp.css). */}
      <SectionEdge variant="torn" layer={3} className="jni-edge-last">
        <FlavourFlight product={product} />
      </SectionEdge>

      <StickyAtcBar
        name={product.shortName || product.name}
        price={Number(product.price) * qty}
        originalPrice={Number(product.originalPrice) * qty}
        image={product.gallery?.[0]?.thumb || product.images.thumb}
        unit={qty === 1 ? '1 pack' : `${qty} packs`}
        ctaLabel={`Buy · ${rupee(deliveredTotal(crateSubtotal + Number(product.price) * qty))}`}
        onAdd={handleBuy}
        watchRef={ctaRef}
      />
    </div>
  )
}
