import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bundles, panelAccent, products } from '../../data/products'
import { packPalettes } from '../icons/PackDoodles'
import { useCart } from '../../store/cartStore'

/**
 * "Make it a flight": the bundle upsell, told from this pack's point of view.
 *
 * The old band was two catalogue cards, the same on every product page. This
 * fans the three pouches out with the one you are looking at lifted to the
 * front and tagged, so the trio reads as "this, plus the other two" -- then
 * the two bundles at their real prices, on this flavour's own ground.
 */

const rupee = (n) => `₹${Number(n).toLocaleString('en-IN')}`

export default function FlavourFlight({ product }) {
  const { addItem, openCart } = useCart()
  const [justAdded, setJustAdded] = useState(null)
  // The router keeps this page mounted from one flavour to the next, so the
  // "added" mark is cleared by hand rather than following you to the next pack.
  useEffect(() => setJustAdded(null), [product.slug])
  const ground = packPalettes[product.slug]?.ground || product.theme?.ink
  const accent = panelAccent({ ...product.theme, ink: ground })

  const others = products.filter((p) => p.slug !== product.slug)
  const fan = [others[0], product, others[1]].filter(Boolean)

  const add = (bundle) => {
    addItem({ ...bundle, selectedWeight: bundle.includes.join(', ') })
    setJustAdded(bundle.slug)
    openCart()
  }

  return (
    <section className="jni-flight jni-grain" style={{ backgroundColor: ground }} aria-labelledby="jni-flight-title">
      <div className="jni-flight-fan">
        {fan.map((p, i) => {
          const here = p.slug === product.slug
          return (
            <Link
              key={p.slug}
              to={`/flavours/${p.slug}`}
              className="jni-flight-pouch"
              data-here={here ? '' : undefined}
              style={{ '--i': i }}
              aria-label={here ? `${p.shortName}, this page` : `See ${p.shortName}`}
              aria-current={here ? 'page' : undefined}
            >
              <img src={p.gallery?.[0]?.src || p.images.pdp} alt="" loading="lazy" decoding="async" />
            </Link>
          )
        })}
        <span className="jni-flight-here" aria-hidden="true">
          You’re here
        </span>
      </div>

      <div className="jni-flight-copy">
        <p className="jni-flight-k">Don&apos;t stop at one</p>
        <h2 id="jni-flight-title" style={{ color: accent }}>
          Make it a flight.
        </h2>
        {bundles.map((b) => (
          <div key={b.slug} className="jni-sticker jni-flight-row">
            <Link to={`/combos/${b.slug}`} className="jni-flight-link">
              <img src={b.imageUrl} alt="" loading="lazy" decoding="async" />
              <span>
                <b>{b.shortName}</b>
                <small>{b.subtitle}</small>
              </span>
            </Link>
            <span className="jni-flight-price">
              <b>{rupee(b.price)}</b>
              {b.originalPrice > b.price && <s>{rupee(b.originalPrice)}</s>}
            </span>
            <button type="button" className="jni-flight-add" onClick={() => add(b)}>
              {justAdded === b.slug ? 'Added' : 'Add'}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
