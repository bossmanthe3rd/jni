# Just Nibble It — frontend clone

A faithful reproduction of [justnibbleit.in](https://www.justnibbleit.in/), rebuilt on the
same stack so it can serve as the "before" baseline for redesign work.

Captured 8 September 2026. See [`reference/CLONE-NOTES.md`](reference/CLONE-NOTES.md) for
how it was reconstructed, what differs on purpose, and a list of issues spotted in the
original.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the build
```

## Stack

React 18 · Vite 5 · Tailwind CSS 3 · framer-motion · react-router-dom · zustand ·
lucide-react — matching the original's dependencies.

## Layout

```
public/assets/          51 images copied from the live site
  brand/ doodles/ hero/ products/
  doodles/pack/         the pack doodles as flat SVG, 3 flavours x 6 shapes
src/
  data/
    products.js         3 flavours + 2 bundles, transcribed from the live bundle
    site.js             hero slides, ticker, testimonials, footer, legal details
  store/cartStore.js    zustand + persist, same `jni-cart-storage` key
  components/
    layout/             SiteHeader, SiteFooter, CartDrawer, LegalLayout,
                        RecentPurchaseToast
    home/               HeroCarousel, WhyFlipos, FlavourScrollStage,
                        FlavourGrid, Testimonials
    product/            ProductCard, BundleCard, ProductAccordion
    ui/Primitives.jsx   BrandHeading, Sparkle, WaveDivider, Blob, SmartImage, …
    icons/WhyIcons.jsx  the four hand-drawn feature icons
    icons/PackDoodles.jsx  the six pouch doodles, recoloured per flavour
  pages/                one per route
  index.css             design tokens, jni-* classes, all 14 keyframes
tools/
  build-doodles.py      regenerates PackDoodles.jsx + the pack doodle SVGs
reference/
  CLONE-NOTES.md        capture notes + redesign observations
  original-bundle.css   the live site's production CSS, for reference
  captures/             rendered DOM of every live route
```

## Routes

| Path | Page |
|---|---|
| `/`, `/flavours` | homepage (hero carousel, why, flavour grid, testimonials) |
| `/flavours/:slug`, `/snacks/:slug` | product detail |
| `/combos` | combo landing |
| `/combos/:slug` | bundle detail |
| `/about`, `/story` | about (the live site renders the same page for both) |
| `/privacy`, `/privacy-policy` | privacy policy |
| `/shipping`, `/shipping-and-return-policy`, `/returns` | shipping & return policy |
| `/refunds`, `/refund-policy` | refund policy |
| `/auth`, `/account`, `/my-crates` | auth / account (UI only) |
| `/checkout` | cart summary (stops before payment hand-off) |
| `*` | content page — `/contact`, `/terms`, `/faq`, `/ingredients`, `/sustainability`, `/press`, plus any unmatched path |

## Design tokens

Copied verbatim from the live site's `:root`:

| Token | Value |
|---|---|
| cream | `#fbf6d0` |
| dark / forest | `#071a16` |
| ink | `#0d2818` |
| teal | `#4db8ae` |
| sunshine | `#f3c63b` |
| coral | `#e85d4c` |
| jalapeño | `#77d21c` |
| sweet chilli | `#ef3f23` |
| peri peri | `#9d1636` |

Type: **Lilita One** for display (`font-display` / `.bubble-title`), **Inter** for body.

## Fidelity

Rendered text content was diffed against the live site with headless Chromium. `/`,
`/combos`, `/about`, `/flavours/:slug`, `/combos/:slug` and the legal pages come back
**text-identical**, with full-page heights within 4 px of the original.

The cart, carousels, accordions, quantity steppers, scroll-reveal animations, the
pointer-tracking googly eyes and the icon animations are all functional. Auth, checkout
payment and analytics are deliberately not wired — see the clone notes.
