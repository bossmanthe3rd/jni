import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { products, bundles } from '../data/products'
import { ProductCard, BundleCard } from '../components/product/ProductCard'
import { BrandHeading, Blob } from '../components/ui/Primitives'
import { TriangleCluster } from '../components/ui/TriangleCluster'
import DoodleField from '../components/ui/DoodleField'
import HeatMeter from '../components/product/HeatMeter'

/*
 * The flavour listing.
 *
 * /flavours used to render the entire homepage -- hero carousel and all --
 * despite being the target of "All Flavours" in the nav and "Nibble All Now" in
 * the copy. Anyone following either link landed back where they started. This
 * is the page those links were always promising: the three flavours, side by
 * side, with the heat ramp visible so they can actually be compared.
 */
export default function FlavoursPage() {
  useEffect(() => {
    document.title = 'All Flavours | Just Nibble It'
  }, [])

  return (
    <div className="min-w-0 flex-grow">
      <div className="bg-cream pt-[var(--site-header-offset)] text-ink">
        <section className="relative isolate overflow-hidden px-5 pb-14 pt-12 sm:px-8 sm:pt-16 lg:px-12">
          <DoodleField
            flavour="jalapeno-kick"
            ground="#fbf6d0"
            intensity="subtle"
            count={20}
            seed={5}
          />

          <div className="mx-auto max-w-6xl">
            {/* The same ornament pair the homepage's "Our flavours" carries --
                triangle scatter outside, teal blob inside -- rather than the
                lone sparkle this page had. The sparkle is the About page's
                mark; using it here made the two flavour headings look like they
                came from different sites. */}
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              <span className="relative hidden w-16 sm:block">
                <TriangleCluster className="absolute right-0 top-3 scale-x-[-1]" />
              </span>
              <Blob className="h-7 w-7 shrink-0 sm:h-9 sm:w-9" />
              <BrandHeading as="h1" fill="#F3C63B" className="text-5xl sm:text-6xl lg:text-7xl">
                All flavours
              </BrandHeading>
              <Blob className="h-7 w-7 shrink-0 sm:h-9 sm:w-9" />
              <span className="relative hidden w-16 sm:block">
                <TriangleCluster className="absolute left-0 top-3" />
              </span>
            </div>
            <p className="mx-auto mt-5 max-w-xl text-center text-sm font-bold leading-7 sm:text-base">
              Three ways to interrupt a spreadsheet. Sweet first, fresh in the middle, and one
              that does not negotiate.
            </p>

            {/* Heat is the thing people are actually choosing between, so the
                ramp goes up top rather than being buried on each product page.
                It is also where the page's opening ends: the header's badge
                watches for it, since the section around it runs the whole page. */}
            <div data-intro-end="" className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-[22px] border-[3px] border-ink bg-forest px-6 py-4 shadow-doodle">
              {products.map((product) => (
                <Link
                  key={product.slug}
                  to={`/flavours/${product.slug}`}
                  className="flex min-h-11 items-center gap-3 transition hover:-translate-y-0.5"
                >
                  <span className="text-sm font-black text-sunshine sm:text-base">
                    {product.shortName}
                  </span>
                  <HeatMeter product={product} flavour={product.slug} />
                </Link>
              ))}
            </div>

            {/* Three products in a two-column grid left the last card alone on
                its own row, which reads as a missing fourth flavour. Three
                across is also what the homepage grid does, so the two listings
                now look like the same shop. Phones stack them instead: three
                across a 375px screen is ~100px a card. */}
            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5">
              {products.map((product, i) => (
                <ProductCard key={product.slug} product={product} index={i} />
              ))}
            </div>

            <div className="mt-14">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                className="mb-6 flex flex-wrap items-end justify-between gap-3"
              >
                <BrandHeading as="h2" fill="#4DB8AE" className="text-3xl sm:text-4xl">
                  Or take the lot
                </BrandHeading>
                <Link
                  to="/combos"
                  className="-my-3 inline-flex items-center gap-2 py-3 text-sm font-black uppercase tracking-wide text-ink underline-offset-4 hover:underline"
                >
                  All combos <ArrowRight size={16} />
                </Link>
              </motion.div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
                {bundles.map((bundle, i) => (
                  <BundleCard key={bundle.slug} bundle={bundle} index={i + 3} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
