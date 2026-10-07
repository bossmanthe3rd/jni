import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { launchOffer } from '../../data/site'
import { bundles, savingsPercent } from '../../data/products'
import { responsiveImage } from '../../lib/responsiveImage'

/**
 * The launch-offer banner.
 *
 * The artwork carries its own headline, its own price and its own timer, so it
 * is shown unscrimmed -- the combos hero used to lay a forest gradient over its
 * banner to make room for an overlaid headline, and doing that here would bury
 * the thing the banner exists to say. The offer is restated underneath instead,
 * in HTML, which is the only copy of it a screen reader, a crawler or a
 * price change can reach: everything in the image is pixels.
 *
 * Two crops rather than one squeezed frame. The art runs content to all four
 * edges, so at phone width the 2:1 cut would put the price at about forty
 * pixels tall. See tools/build-launch-banner.py.
 *
 * `endsAt` in the offer data is what makes the artwork's "ONLY FOR 24 HOURS"
 * true. Set it and the banner counts down and then takes itself off the site;
 * leave it null and the countdown is simply not claimed in the HTML -- though
 * the words stay painted into the image, which is the one part of this that
 * cannot be fixed from code.
 */

function remainingMs(endsAt) {
  return endsAt ? new Date(endsAt).getTime() - Date.now() : null
}

function format(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function LaunchBanner({ tone = 'light', className = '' }) {
  const [left, setLeft] = useState(() => remainingMs(launchOffer.endsAt))

  useEffect(() => {
    if (!launchOffer.endsAt) return
    const id = window.setInterval(() => setLeft(remainingMs(launchOffer.endsAt)), 1000)
    return () => window.clearInterval(id)
  }, [])

  // Expired means gone, not greyed out: a launch price still on the page after
  // its window is a promise the checkout will not keep.
  if (left !== null && left <= 0) return null

  const bundle = bundles.find((b) => b.slug === launchOffer.slug)
  if (!bundle) return null
  const saved = savingsPercent(bundle.price, bundle.originalPrice)
  const dark = tone === 'dark'

  return (
    <section className={`relative ${className}`} aria-labelledby="launch-offer-heading">
      <Link to={`/combos/${bundle.slug}`} className="block">
        <picture>
          <source
            media="(min-width: 768px)"
            srcSet={responsiveImage('/assets/promo/launch-offer-wide.webp', '100vw').srcSet}
            sizes="100vw"
          />
          <img
            {...responsiveImage('/assets/promo/launch-offer.webp', '100vw')}
            alt={launchOffer.alt}
            loading="eager"
            decoding="async"
            className="aspect-[4/3] w-full object-cover md:aspect-[2/1]"
          />
        </picture>
      </Link>

      {/* The offer again, in text. Price and saving come from the catalogue, so
          the two can never drift apart without the number on screen changing. */}
      <div
        className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-3 px-5 py-5 text-center sm:px-8 ${
          dark ? 'text-ink' : 'text-foam'
        }`}
      >
        <h2 id="launch-offer-heading" className="text-2xl font-black sm:text-3xl">
          <span className={dark ? 'text-ink' : 'text-teal'}>Launch offer</span>{' '}
          <span className="whitespace-nowrap">
            ₹{bundle.price}
            <span className={`ml-2 text-base line-through ${dark ? 'opacity-50' : 'opacity-60'}`}>
              ₹{bundle.originalPrice}
            </span>
          </span>
        </h2>
        <p className="text-sm font-black uppercase tracking-[0.14em]">
          {bundle.packetCount} packets · save {saved}%
          {left !== null && (
            <>
              {' · '}
              <span className="tabular-nums">{format(left)}</span> left
            </>
          )}
        </p>
        <Link to={`/combos/${bundle.slug}`} className="jni-btn">
          Grab the six-pack <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  )
}
