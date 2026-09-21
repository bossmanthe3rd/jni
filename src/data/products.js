// Product catalogue transcribed verbatim from the live site's bundle.
// The live site fetches /api/v1/products from its Railway backend and falls back
// to this hardcoded array; the clone uses the array as the single source of truth.

const P = '/assets/products'

export const FREE_SHIPPING_THRESHOLD = 499

/** Flat delivery charge below the threshold. Was a bare 49 inside
 *  CheckoutPage; the probe now quotes a delivered total up front, so the two
 *  have to read from the same number or the price will change under the
 *  customer between the button and the bill. */
export const SHIPPING_FLAT = 49

/** What the order actually costs, delivered. */
export function deliveredTotal(subtotal) {
  return subtotal + (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT)
}

export const products = [
  {
    id: 1,
    slug: 'sweet-chilli-rush',
    name: "FLIPO's Sweet Chilli Rush",
    shortName: 'Sweet Chilli Rush',
    flavor: 'Sweet Heat',
    tagline: 'Sweet, Spicy, Irresistible.',
    description:
      'A glossy sweet-chilli crunch with a slow, playful heat built for movie nights and desk drawers.',
    price: 170,
    originalPrice: 190,
    stockQuantity: 180,
    badge: 'Crowd pleaser',
    category: "FLIPO's",
    theme: {
      ink: '#c2410c',
      accent: '#ef3f23',
      secondary: '#f8d43a',
      soft: '#fff3ed',
      badge: '#ef3f23',
    },
    images: {
      plp: `${P}/sweet-chilli-rush-plp.webp`,
      pdp: `${P}/sweet-chilli-rush-pdp.webp`,
      thumb: `${P}/sweet-chilli-rush-thumb.webp`,
      lifestyle: '/assets/brand/desk-snacks-hero.jpeg',
    },
    gallery: [
      {
        src: `${P}/sweet-chilli-rush-pack.webp`,
        thumb: `${P}/sweet-chilli-rush-pack-thumb.webp`,
        alt: "FLIPO's Sweet Chilli Rush pack on a green studio backdrop with red chillies",
      },
      {
        src: `${P}/sweet-chilli-rush-life-desk.webp`,
        thumb: `${P}/sweet-chilli-rush-life-desk-thumb.webp`,
        alt: 'Sweet Chilli Rush on a late-night desk with laptop, notes and headphones',
      },
      {
        src: `${P}/sweet-chilli-rush-life-creator.webp`,
        thumb: `${P}/sweet-chilli-rush-life-creator-thumb.webp`,
        alt: 'Sweet Chilli Rush on a content creator flat-lay with camera, mic and swatches',
      },
      {
        src: `${P}/sweet-chilli-rush-life-studio.webp`,
        thumb: `${P}/sweet-chilli-rush-life-studio-thumb.webp`,
        alt: 'Sweet Chilli Rush on a design studio desk with sketches and type specimens',
      },
    ],
    ingredients: ['Sweet chilli seasoning', 'Red chilli', 'Crisp baked base'],
    seoKeywords: 'spicy chips buy online, buy crisp potato chips, premium snacks India',
    weight: '100 gms',
    rating: { value: 4.7, count: 98 },
    subtitle: 'Sweet Chilli Slaps. Bold Heat. Crunch Never Stops.',
    flavourHeading: 'Sweet. Full of Character.',
    flavourDescription:
      'A glossy sweet-chilli crunch balanced with real heat, delivering craveable sweetness first, fire right after.',
  },
  {
    id: 2,
    slug: 'jalapeno-kick',
    name: "FLIPO's Jalapeño Kick",
    shortName: 'Jalapeño Kick',
    flavor: 'Fresh Heat',
    tagline: 'A spicy little kick.',
    description:
      'A crisp jalapeño-led bite with fresh pepper character and a clean finish that keeps the hand going back.',
    price: 170,
    originalPrice: 190,
    stockQuantity: 160,
    badge: 'Fresh drop',
    category: "FLIPO's",
    theme: {
      ink: '#0f6b3a',
      accent: '#77d21c',
      secondary: '#043f2d',
      soft: '#effbe6',
      badge: '#77d21c',
    },
    images: {
      plp: `${P}/jalapeno-kick-plp.webp`,
      pdp: `${P}/jalapeno-kick-pdp.webp`,
      thumb: `${P}/jalapeno-kick-thumb.webp`,
      lifestyle: '/assets/brand/desk-snack-jalapeno.jpeg',
    },
    gallery: [
      {
        src: `${P}/jalapeno-kick-pack.webp`,
        thumb: `${P}/jalapeno-kick-pack-thumb.webp`,
        alt: "FLIPO's Jalapeño Kick pack on a blue studio backdrop with fresh jalapeños",
      },
      {
        src: `${P}/jalapeno-kick-life-designer.webp`,
        thumb: `${P}/jalapeno-kick-life-designer-thumb.webp`,
        alt: 'Jalapeño Kick on a designer desk with type specimens and colour swatches',
      },
      {
        src: `${P}/jalapeno-kick-life-creator.webp`,
        thumb: `${P}/jalapeno-kick-life-creator-thumb.webp`,
        alt: 'Jalapeño Kick on a content creator setup with camera, mic and neon sign',
      },
      {
        src: `${P}/jalapeno-kick-life-founder.webp`,
        thumb: `${P}/jalapeno-kick-life-founder-thumb.webp`,
        alt: 'Jalapeño Kick on a founder desk with laptop, notebook and roadmap',
      },
      {
        src: `${P}/jalapeno-kick-life-trader.webp`,
        thumb: `${P}/jalapeno-kick-life-trader-thumb.webp`,
        alt: 'Jalapeño Kick on a trading desk with market charts on screen',
      },
    ],
    ingredients: ['Jalapeño seasoning', 'Green pepper', 'Crisp baked base'],
    seoKeywords: 'buy healthy snacks online, order gourmet snacks, premium snacks India',
    weight: '100 gms',
    rating: { value: 4.6, count: 143 },
    subtitle: 'Jalapeño Slaps. Fresh Heat. Crunch Goes Wild.',
    flavourHeading: 'Fresh. Full of Character.',
    flavourDescription:
      'A crisp jalapeño-led bite with fresh pepper character, delivering clean heat that keeps the hand going back.',
  },
  {
    id: 3,
    slug: 'peri-peri-punch',
    name: "FLIPO's Peri Peri Punch",
    shortName: 'Peri Peri Punch',
    flavor: 'Big Heat',
    tagline: 'Fire with every crunch.',
    description:
      'A deep peri-peri hit with chilli warmth, a savoury finish, and enough crunch to headline any snack break.',
    price: 170,
    originalPrice: 190,
    stockQuantity: 220,
    badge: 'Heat hero',
    category: "FLIPO's",
    theme: {
      ink: '#7a1028',
      accent: '#9d1636',
      secondary: '#f4bd1a',
      soft: '#fff0f1',
      badge: '#9d1636',
    },
    images: {
      plp: `${P}/peri-peri-punch-plp.webp`,
      pdp: `${P}/peri-peri-punch-pdp.webp`,
      thumb: `${P}/peri-peri-punch-thumb.webp`,
      lifestyle: '/lifestyle-snack.jpg',
    },
    gallery: [
      {
        src: `${P}/peri-peri-punch-pack.webp`,
        thumb: `${P}/peri-peri-punch-pack-thumb.webp`,
        alt: "FLIPO's Peri Peri Punch pack on a yellow studio backdrop with red chillies",
      },
      {
        src: `${P}/peri-peri-punch-life-flatlay.webp`,
        thumb: `${P}/peri-peri-punch-life-flatlay-thumb.webp`,
        alt: 'Peri Peri Punch flat-lay on a work desk with laptop, notes and headphones',
      },
      {
        src: `${P}/peri-peri-punch-life-office.webp`,
        thumb: `${P}/peri-peri-punch-life-office-thumb.webp`,
        alt: 'Peri Peri Punch on an office desk beside a laptop, coffee and sticky notes',
      },
      {
        src: `${P}/peri-peri-punch-life-creator.webp`,
        thumb: `${P}/peri-peri-punch-life-creator-thumb.webp`,
        alt: 'Peri Peri Punch on a content creator desk with camera, mic and neon sign',
      },
    ],
    ingredients: ['Peri peri seasoning', 'Red chilli', 'Crisp baked base'],
    seoKeywords: 'peri peri snack packs, spicy chips buy online, premium snacks India',
    weight: '100 gms',
    rating: { value: 4.8, count: 125 },
    subtitle: 'Peri Peri Slaps. Fiery Heat. Crunch Goes Crazy.',
    flavourHeading: 'Spicy. Full of Character.',
    flavourDescription:
      'A lively kick balanced with savoury depth, delivering flavour first, heat second.',
  },
]

export const bundles = [
  {
    id: 'bundle-flipos-trio',
    slug: 'flipos-flavour-trio',
    name: "FLIPO's Flavour Trio",
    shortName: 'The full flavour flight',
    description:
      'Sweet Chilli Rush, Jalapeño Kick, and Peri Peri Punch in one first-date-with-the-brand box.',
    price: 499,
    // Three singles at list price. Derived, not quoted: the brand folder shows
    // the trio at 499 without a strike-through.
    originalPrice: 570,
    packetCount: 3,
    badge: 'Launch favourite',
    imageUrl: '/assets/pick/flipos-flavour-trio-1.webp',
    gallery: [
      {
        src: '/assets/pick/flipos-flavour-trio-1.webp',
        thumb: '/assets/pick/flipos-flavour-trio-1-thumb.webp',
        alt: "All three FLIPO's packs stood together on a studio plinth",
      },
      {
        src: '/assets/pick/flipos-flavour-trio-2.webp',
        thumb: '/assets/pick/flipos-flavour-trio-2-thumb.webp',
        alt: "The trio with loose chips and fresh chillies scattered around them",
      },
      {
        src: '/assets/pick/flipos-flavour-trio-3.webp',
        thumb: '/assets/pick/flipos-flavour-trio-3-thumb.webp',
        alt: "The three flavours laid out side by side, front facing",
      },
    ],
    includes: products.map((p) => p.shortName),
    lineItems: products.map((p) => ({ productId: p.id, productSlug: p.slug, quantity: 1 })),
    isBundle: true,
    weight: '3 x 100 gms',
    rating: { value: 4.9, count: 87 },
    subtitle: 'Three Flavours. One Box. Zero Regrets.',
    flavourHeading: 'All Three. No Compromise.',
    flavourDescription:
      'Sweet, fresh and fiery in a single box — the fastest way to find your flavour without committing to just one.',
    theme: { ink: '#0C1B17', accent: '#F3C63B' },
  },
  {
    id: 'bundle-flipos-party-six',
    slug: 'flipos-party-six',
    name: "FLIPO's Party Six",
    shortName: 'Two of every mood',
    description:
      'A six-pack flavour stack made for house parties, office tables, and people who do not share nicely.',
    price: 299,
    // The launch banner in the brand folder strikes 949, not the sum of six
    // singles at list price.
    originalPrice: 949,
    packetCount: 6,
    badge: 'Launch price',
    imageUrl: '/assets/pick/flipos-party-six-1.webp',
    gallery: [
      {
        src: '/assets/pick/flipos-party-six-1.webp',
        thumb: '/assets/pick/flipos-party-six-1-thumb.webp',
        alt: "Six FLIPO's packs lined up, two of each flavour",
      },
      {
        src: '/assets/pick/flipos-party-six-2.webp',
        thumb: '/assets/pick/flipos-party-six-2-thumb.webp',
        alt: 'The six-pack stack with chillies and loose chips around it',
      },
      {
        src: '/assets/pick/flipos-party-six-3.webp',
        thumb: '/assets/pick/flipos-party-six-3-thumb.webp',
        alt: 'The party six spread across a table, ready to share',
      },
    ],
    includes: products.map((p) => `2x ${p.shortName}`),
    lineItems: products.map((p) => ({ productId: p.id, productSlug: p.slug, quantity: 2 })),
    isBundle: true,
    weight: '6 x 100 gms',
    rating: { value: 4.8, count: 64 },
    subtitle: 'Six Packs. Every Mood. Built To Share.',
    flavourHeading: 'Double Of Everything.',
    flavourDescription:
      'Two of each flavour so nobody has to negotiate over the last packet — sized for parties, office tables and serious stashing.',
    theme: { ink: '#0C1B17', accent: '#F3C63B' },
  },
]

export function perPacketPrice(bundle) {
  const packs = Number(bundle?.packetCount) || 0
  const price = Number(bundle?.price) || 0
  return packs <= 0 ? null : Math.round(price / packs)
}

export function getProductBySlug(slug) {
  return products.find((p) => p.slug === slug)
}

export function getBundleBySlug(slug) {
  return bundles.find((b) => b.slug === slug)
}

/** Normalises a product into the shape the cart expects. */
export function toCartProduct(product) {
  return {
    ...product,
    imageUrl: product.images?.plp || product.imageUrl,
    selectedWeight: product.selectedWeight || 'Single pack',
  }
}

/** Re-syncs a persisted cart line against current catalogue pricing. */
export function reconcilePrice(item) {
  const match = [...products, ...bundles].find(
    (p) => String(p.id) === String(item.id) || p.slug === item.slug
  )
  return match ? { ...item, price: match.price, originalPrice: match.originalPrice } : item
}

export function savingsPercent(price, originalPrice) {
  const p = Number(price)
  const o = Number(originalPrice || p)
  if (!o || o <= p) return 0
  return Math.round(((o - p) / o) * 100)
}

/* ---------------------------------------------------------------------------
   Readable accent on a themed panel

   The PDP paints its info panel in `theme.ink` and then sets the flavour
   heading (and the heat flame beside the title) in `theme.accent`. For two of
   the three flavours those are the same hue a shade apart:

     Sweet Chilli  #ef3f23 on #c2410c -> 1.35:1
     Peri Peri     #9d1636 on #7a1028 -> 1.34:1
     Jalapeño      #77d21c on #0f6b3a -> 3.46:1

   So on two of three product pages the flavour heading was effectively
   invisible and the flame read as a smudge. Rather than repaint the brand
   palette, this picks the first colour in the flavour's own theme that clears
   3:1 against the panel -- which leaves Jalapeño's green exactly as it was and
   promotes the other two to the yellow already sitting in `theme.secondary`.
   --------------------------------------------------------------------------- */
const CONTRAST_FLOOR = 3

function relativeLuminance(hex) {
  const v = hex.replace('#', '')
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(a, b) {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** The flavour's accent where it is legible on its own panel, else a fallback. */
export function panelAccent(theme) {
  if (!theme?.ink) return theme?.accent || '#F3C63B'
  const candidates = [theme.accent, theme.secondary, '#F3C63B', '#FBF6D0']
  return (
    candidates.find((c) => c && contrastRatio(c, theme.ink) >= CONTRAST_FLOOR) || '#FBF6D0'
  )
}
