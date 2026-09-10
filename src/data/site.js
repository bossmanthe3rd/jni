// Site-wide content transcribed from the live bundle.
import { products } from './products'

/**
 * The live site hardcodes a fallback ticker and then overwrites it with
 * GET /api/v1/site/ticker. The values below are what the API actually returned
 * when this clone was captured (2026-09-08); the in-bundle fallback was:
 *   { text: "Launch drop: all 3 FLIPO'S flavours for Rs. 499",
 *     backgroundColor: '#E85D4C', textColor: '#FBF6D0' }
 */
export const ticker = {
  text: "Launch drop: all 3 FLIPO's flavours for Rs. 399",
  mobileText: "Launch Drop: FLIPO'S Pack of 6 for 299/-",
  backgroundColor: '#f8d43a',
  textColor: '#111111',
  link: '/combos',
  active: true,
}

/** Drawer nav opened by the wavy hamburger. */
export const navLinks = [
  { label: 'Shop flavours', to: '/', hash: 'products' },
  { label: 'About us', to: '/about' },
]

export const heroSlides = [
  {
    product: products[0],
    kicker: 'Sweet chilli',
    headline: 'Your Sweet Side Has A Spicy Side.',
    bg: '/assets/hero/hero-bg-sweet.jpg',
  },
  {
    product: products[2],
    kicker: 'Peri peri',
    headline: 'Spicy enough to wake you up',
    bg: '/assets/hero/hero-bg-peri.jpg',
  },
  {
    product: products[1],
    kicker: 'Jalapeño',
    headline: 'Your Desk Just Got Spicy',
    bg: '/assets/hero/hero-bg-jalapeno.jpg',
  },
]

export const HERO_INTERVAL = 5600

export const whyFeatures = [
  { id: 'flavour', lines: ['Bold', 'Flavour'], loopClass: 'why-icon-flame', overlay: null },
  { id: 'desk', lines: ['Desk', 'Crunch'], loopClass: 'why-icon-keys', overlay: 'keys' },
  { id: 'creative', lines: ['Creative', 'Sidekick'], loopClass: 'why-icon-pencils', overlay: null },
  { id: 'brain', lines: ['Brain', 'Break'], loopClass: 'why-icon-burst', overlay: 'burst' },
]

export const testimonials = [
  {
    name: 'Sakshi J.',
    location: 'Bilaspur',
    text: 'Peri Peri Punch has the right kind of heat. Loud flavour, proper crunch, empty bag.',
  },
  {
    name: 'Sohum J.',
    location: 'Bengaluru',
    text: 'Jalapeño Kick tastes fresh and punchy. It disappeared during one episode.',
  },
  {
    name: 'Anuj V.',
    location: 'Indore',
    text: 'The trio is the correct first order. Sweet Chilli Rush won our office vote.',
  },
  {
    name: 'Ritika M.',
    location: 'Pune',
    text: 'Ordered the party six for a house night — gone before the movie ended.',
  },
  {
    name: 'Devansh K.',
    location: 'Delhi',
    text: 'Desk drawer snack, finally one that does not smell up the whole cabin.',
  },
  {
    name: 'Meher S.',
    location: 'Kochi',
    text: 'Sweet Chilli Rush is the one my kids fight over. Ordering the trio next.',
  },
  {
    name: 'Farhan A.',
    location: 'Hyderabad',
    text: 'Crunch is genuinely loud. Peri Peri is now a standing monthly order.',
  },
  {
    name: 'Neha T.',
    location: 'Jaipur',
    text: 'Packs actually reseal properly, so half a bag survives till evening.',
  },
  {
    name: 'Kabir R.',
    location: 'Mumbai',
    text: 'Bought it for the packaging, stayed for the jalapeño. No notes.',
  },
]

export const TESTIMONIAL_INTERVAL = 5000
export const TESTIMONIAL_STAR_COLOR = '#1D4ED8'

export const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/justnibbleit/' },
  { label: 'Facebook', href: 'https://www.facebook.com/' },
]

export const footerStaticImage = {
  src: '/assets/products/flipos-collection.webp',
  alt: "The full FLIPO's range lined up",
}

export const footerRotatingImages = [
  {
    src: '/assets/products/peri-peri-punch-life-flatlay.webp',
    alt: "FLIPO's Peri Peri Punch on a work-desk flat-lay",
  },
  {
    src: '/assets/products/jalapeno-kick-life-creator.webp',
    alt: "FLIPO's Jalapeno Kick on a creator's desk",
  },
  {
    src: '/assets/products/sweet-chilli-rush-life-desk.webp',
    alt: "FLIPO's Sweet Chilli Rush on a late-night desk",
  },
]

export const FOOTER_IMAGE_INTERVAL = 3600

export const footerColumns = [
  {
    title: 'Customer Care',
    links: [
      { label: 'Contact Us', to: '/contact' },
      { label: 'Shipping & Delivery', to: '/shipping' },
      { label: 'Cancellation & Refunds', to: '/refunds' },
      { label: 'Returns & Replacements', to: '/returns' },
    ],
  },
  {
    title: 'About Us',
    links: [
      { label: 'Our Story', to: '/about' },
      { label: 'The Brand', to: '/story' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Terms & Conditions', to: '/terms' },
      { label: 'Cookie Policy', to: '/privacy-policy' },
    ],
  },
  {
    title: 'Shop',
    links: [
      { label: 'All Flavours', to: '/#products' },
      { label: 'Combos', to: '/combos' },
    ],
  },
  {
    title: "FAQ's",
    links: [{ label: 'Help centre', to: '/faq' }],
  },
  { title: 'Socials', socials: socialLinks },
]

/** Rotating social-proof toast copy seen bottom-left on the live site. */
export const recentPurchases = [
  { name: 'Aarav', city: 'Kolkata', product: "FLIPO's Jalapeño Kick" },
  { name: 'Sakshi', city: 'Delhi', product: "FLIPO's Peri Peri Punch" },
  { name: 'Rohan', city: 'Kolkata', product: "FLIPO's Peri Peri Punch" },
  { name: 'Meera', city: 'Pune', product: "FLIPO's Sweet Chilli Rush" },
  { name: 'Vikram', city: 'Bengaluru', product: "FLIPO's Flavour Trio" },
]

export const legalBusinessDetails = {
  brand: 'Just Nibble It',
  entity: 'Meenakshi Craft Foods Private Limited',
  category: 'Packaged Foods / Premium Snacks (FMCG)',
  address:
    '296, Lake Point Tower Ave, Block C, AECS Layout, Begur, Bangalore South, Bangalore – 560068, Karnataka, India',
  email: 'nibble@justnibbleit.in',
  supportEmail: 'cravings@justnibbleit.in',
  phone: '+91 9652336777',
}

/**
 * The scroll-driven flavour stage on the homepage.
 *
 * Ordered by how the heat builds — sweet, then fresh, then big — so the rail's
 * rising bar carries real information instead of decorating the section. Each
 * entry names a pack doodle for every scatter slot, in slot order (see SLOTS in
 * components/home/FlavourScrollStage.jsx); the shape order differs per flavour
 * so a flavour change reads as the bag being re-shuffled, not recoloured. The
 * large slots take the shapes with internal structure - halves, slices,
 * sections - because a plain lobe flattens into a blob once it is drawn big.
 *
 * `ground` is the stage backdrop - a deeper tone than the pouch's own print
 * colour, so the doodles (which use that print colour) stay readable on it.
 */
export const flavourStages = [
  {
    slug: 'sweet-chilli-rush',
    heat: 'Sweet heat',
    ground: '#7d1206',
    note: 'Sweet lands first. The heat catches up about three chips later.',
    pack: '/assets/products/sweet-chilli-rush-pack.webp',
    packAlt: "FLIPO's Sweet Chilli Rush pack, propped upright",
    shapes: [
      'chilli-half',
      'seed',
      'chilli-slice',
      'jalapeno',
      'chilli-half',
      'pepper-section',
      'pepper-section',
      'chilli-half',
      'seed',
      'chilli-whole',
      'chilli-slice',
      'chilli-whole',
    ],
  },
  {
    slug: 'jalapeno-kick',
    heat: 'Fresh heat',
    ground: '#073d1f',
    note: 'Green, grassy, sharp. Clean finish, so the hand keeps going back.',
    pack: '/assets/products/jalapeno-kick-pack.webp',
    packAlt: "FLIPO's Jalapeño Kick pack, propped upright",
    shapes: [
      'chilli-slice',
      'seed',
      'chilli-half',
      'chilli-whole',
      'pepper-section',
      'chilli-half',
      'chilli-slice',
      'pepper-section',
      'seed',
      'jalapeno',
      'chilli-half',
      'jalapeno',
    ],
  },
  {
    slug: 'peri-peri-punch',
    heat: 'Big heat',
    ground: '#3a060e',
    note: 'Loud from the first bite. Keep something cold within reach.',
    pack: '/assets/products/peri-peri-punch-pack.webp',
    packAlt: "FLIPO's Peri Peri Punch pack, propped upright",
    shapes: [
      'chilli-half',
      'seed',
      'pepper-section',
      'jalapeno',
      'chilli-slice',
      'chilli-half',
      'pepper-section',
      'chilli-half',
      'seed',
      'chilli-whole',
      'chilli-slice',
      'chilli-whole',
    ],
  },
]
