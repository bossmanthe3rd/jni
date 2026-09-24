import { useEffect, useRef } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { deliveredTotal, getProductBySlug, toCartProduct } from '../data/products'
import { useCart } from '../store/cartStore'
import StickyAtcBar from '../components/product/StickyAtcBar'
import FlavourDossier from '../components/product/FlavourDossier'
import HeatClimb from '../components/product/HeatClimb'
import PouchFacts from '../components/product/PouchFacts'
import DeskMoments from '../components/product/DeskMoments'
import FlavourReviews from '../components/product/FlavourReviews'
import FlavourFlight from '../components/product/FlavourFlight'
import PdpFaq from '../components/product/PdpFaq'
import SectionSeam from '../components/product/SectionSeam'
import TypeBands from '../components/product/TypeBands'
import { packPalettes } from '../components/icons/PackDoodles'

const CREAM = '#fbf6d0'
const FOREST = '#071a16'
const SUNSHINE = '#f3c63b'

/*
 * The product page, top to bottom:
 *
 *   dossier       the pouch, the flavour switcher and the buy block
 *   heat climb    "flavour first, heat second", five bites deep
 *   pouch facts   weight, shelf life, zip, ingredients -- all on show
 *   desk moments  the flavour's lifestyle shots, captioned
 *   reviews       quotes about this flavour, beside its own rating
 *   flight        this pack plus the other two, then the bundles
 *   faq           the three questions people ask
 *
 * Every section after the hero takes its colour or its words from the
 * flavour, so no two product pages read as the same template with a new
 * photo in it.
 *
 * No two sections meet on a straight line: each boundary is a wave, a torn
 * edge, or a pair of type bands crossing it.
 */
export default function ProductDetailPage() {
  const { slug } = useParams()
  const product = getProductBySlug(slug)
  const ctaRef = useRef(null)
  const navigate = useNavigate()
  const { addItem } = useCart()

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

  const ground = packPalettes[product.slug]?.ground || product.theme?.ink

  /* The sticky mobile bar's own buy: it is outside the dossier, so it has no
     access to the chip the reader chose, and one pack is the honest default
     for a bar that shows a single-pack price. */
  const handleBuy = () => {
    addItem(toCartProduct(product), 1)
    navigate('/checkout')
  }

  return (
    <div className="min-w-0 flex-grow bg-cream pb-24 md:pb-0">
      <FlavourDossier product={product} ctaRef={ctaRef} />
      <SectionSeam fill={ground} hang />
      <HeatClimb product={product} />
      <SectionSeam fill={CREAM} variant="torn" />
      <PouchFacts product={product} />
      <TypeBands product={product} from={CREAM} to={FOREST} />
      <DeskMoments product={product} />
      <SectionSeam fill={SUNSHINE} />
      <FlavourReviews product={product} />
      <TypeBands product={product} from={SUNSHINE} to={ground} />
      <FlavourFlight product={product} />
      <SectionSeam fill={CREAM} variant="torn" />
      <PdpFaq product={product} />

      <StickyAtcBar
        name={product.shortName || product.name}
        price={product.price}
        originalPrice={product.originalPrice}
        image={product.gallery?.[0]?.thumb || product.images.thumb}
        ctaLabel={`Buy · ₹${deliveredTotal(Number(product.price))}`}
        onAdd={handleBuy}
        watchRef={ctaRef}
      />
    </div>
  )
}
