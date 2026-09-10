# Clone notes — justnibbleit.in

Captured **8 September 2026** from `https://www.justnibbleit.in/`.

This repo is a frontend reproduction of the live site, built as a baseline for redesign
work. Everything visual and structural is reproduced; the third-party commerce and
tracking integrations are deliberately not.

---

## How the original was reverse-engineered

The live site is a client-rendered SPA, so `curl` returns a 2.7 KB shell. The clone was
reconstructed from three sources:

1. **The production JS bundles** (`/assets/index-*.js` + 13 lazy route chunks) — minified
   but unmangled enough to recover the full product catalogue, all copy strings, every
   Tailwind class string, the SVG path data, and the animation timings.
2. **The production CSS bundle** — gave the `:root` token block, the `jni-*` component
   classes, `bubble-title`, and all 14 `@keyframes` verbatim. Kept at
   `reference/original-bundle.css` for reference.
3. **Headless Chromium renders** of every route, scrolled to the bottom to trigger the
   `whileInView` reveals, then dumped as DOM + full-page screenshots. Kept at
   `reference/captures/*.html`.

## Original stack

| Concern | Live site | This clone |
|---|---|---|
| Framework | React 18 + Vite | same |
| Routing | react-router-dom | same |
| Animation | framer-motion | same |
| Icons | lucide-react | same |
| State | zustand + `persist` (`jni-cart-storage`) | same |
| HTTP | axios → Railway API | none (static data) |
| Products API | `GET /api/v1/products` with in-bundle fallback | the fallback array, as source of truth |
| Ticker API | `GET /api/v1/site/ticker` | captured response, hardcoded |
| Auth | JWT from `/auth/login`, `/auth/register` | UI only |
| Checkout | Shiprocket / GoKwik "fastrr" widget + Razorpay | summary page, stops at hand-off |
| Analytics | Meta Pixel, GA4, Wigzo, Firebase, Cloudflare RUM | omitted (see below) |

## Verification

Rendered text content was diffed against the live site route by route. `/combos`,
`/about`, `/shipping` and the legal pages are **character-identical**. Full-page heights
at 1440 px:

| Route | Live | Clone |
|---|---|---|
| `/combos` | 3097 px | 3093 px |
| `/about` | 4226 px | 4222 px |
| `/flavours/peri-peri-punch` | 4042 px | 4038 px |
| `/shipping` | 3223 px | 3225 px |
| `/` | 4815 px | 4763 px |

## What is intentionally different

- **No tracking scripts.** The live `index.html` loads Meta Pixel `2022133325079975`,
  GA4 `G-VN0WE6J114`, Wigzo, Firebase and the Shiprocket checkout script. Running those
  locally would fire fake pageviews, `ViewContent` and `AddToCart` events into the real
  brand's analytics and ad audiences. They are commented out in `index.html` with the IDs
  recorded, so they can be restored deliberately.
- **No backend.** Products, bundles and the ticker are static in `src/data/`. The cart is
  fully functional (same zustand store and localStorage key); auth, account and checkout
  are UI-only and say so on screen.
- **Fonts.** `--font-brand` lists `Milkyway` first, but the live site never ships a
  `@font-face` for it, so it always falls back to Lilita One. Reproduced as-is.

## Assets

All 51 images are copied bit-for-bit from the live site into `public/assets/`
(products ×35, brand ×4, doodles ×5, hero ×3, plus the logo and two root images).

## Observations for the redesign

Things noticed while cloning that look like real problems on the live site — recorded
here, not "fixed", so the clone stays faithful:

1. **`/about` and `/story` render byte-identical pages.** Both are linked from the footer
   as "Our Story" and "The Brand". Duplicate content, and the nav promises two things.
2. **`/combos` hero has overlapping text.** The kicker "More packs. Better maths." and the
   `h1` "Build the loudest snack table." sit on top of the product photography with only a
   partial scrim, so both collide with the packs at 1440 px. The same headline then repeats
   immediately below as "More bags. Better maths."
3. **Homepage hero headlines are baked into the JPGs.** `hero-bg-*.jpg` contain the
   typography, so the `h1` is `sr-only`. That costs SEO, blocks translation and
   responsive type, and the 3 heroes total ~460 KB.
4. **Every unmatched URL renders a real-looking page.** `ContentPage` is the catch-all,
   so a typo like `/flavors` or `/prodcuts` silently renders the FAQ page with a 200 and
   no "not found" signal — bad for users and for search indexing. There is no 404 state
   at all. (`/contact`, `/terms` and `/faq` are legitimate entries in the same component;
   they render fine.)
5. **Party Six pricing looks like an error.** ₹299 against a ₹1014 "original" is a 71%
   discount on a 6-pack, while the 3-pack Trio is ₹499 — the bigger box is cheaper than
   the smaller one, which undercuts the trio entirely.
6. **`/flavours` renders the full homepage**, hero carousel included, rather than a
   product listing page — but it's the target of "All Flavours" and "Nibble All Now".
7. **Above-the-fold content is all decoration.** At 1440 px the fold is one banner image;
   the first product and price appear ~1500 px down.
8. **Product images are heavy.** Several PDP images are 300–420 KB `.webp` with no
   `srcset`, served at display sizes far smaller than their intrinsic dimensions.
9. **Social-proof toast is fabricated** ("Aarav from Kolkata just bought…") and cycles
   from a hardcoded list — a compliance risk in India under the CCPA 2019 dark-pattern
   guidelines.
10. **The testimonial star rating is always 5**, hardcoded, regardless of the 4.6–4.9
    product ratings shown elsewhere.
