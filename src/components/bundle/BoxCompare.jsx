import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bundles, deliveredTotal, perPacketPrice, products } from '../../data/products'
import { useCart } from '../../store/cartStore'
import { pouchCutout, toCartBundle } from './boxContents'
import { responsiveImage } from '../../lib/responsiveImage'

/**
 * The flavour page's "Make it a flight", turned round.
 *
 * On a flavour page the upsell is up, to a box. On a box page the question
 * is sideways -- this box or the other one -- and down, to a single pouch for
 * someone who already knows their flavour. So the two boxes sit side by side
 * with the numbers that separate them, the one on this page tagged, and the
 * three single pouches stand underneath.
 */

const rupee = (n) => `₹${Number(n).toLocaleString('en-IN')}`

export default function BoxCompare({ bundle }) {
  const navigate = useNavigate()
  const { addItem, openCart } = useCart()
  const [justAdded, setJustAdded] = useState(null)
  // Kept mounted from one box's page to the other's: clear the mark on the way.
  useEffect(() => setJustAdded(null), [bundle.slug])

  const buy = (b) => {
    addItem(toCartBundle(b), 1)
    navigate('/checkout')
  }
  const backToTop = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })
  }
  const add = (b) => {
    addItem(toCartBundle(b), 1)
    setJustAdded(b.slug)
    openCart()
  }

  return (
    <section className="jni-compare jni-grain" aria-labelledby="jni-compare-title">
      <div className="jni-compare-head">
        <p className="jni-flight-k">Compare the boxes</p>
        <h2 id="jni-compare-title">Two boxes. Or one pack.</h2>
      </div>

      <div className="jni-compare-boxes">
        {bundles.map((b, i) => {
          const here = b.slug === bundle.slug
          const shipping = deliveredTotal(Number(b.price)) - Number(b.price)
          return (
            <article
              key={b.slug}
              className="jni-sticker jni-compare-box"
              data-here={here ? '' : undefined}
              style={{ '--turn': `${i % 2 ? 1.2 : -1.2}deg` }}
            >
              {here && (
                <span className="jni-flight-here jni-compare-tag" aria-hidden="true">
                  You’re here
                </span>
              )}
              {/* The photo opens that box's page. On the box already on
                  screen the route does not change, so the router's scroll
                  reset never fires; the click takes the reader back up to
                  the hero instead. */}
              <Link
                to={`/combos/${b.slug}`}
                className="jni-compare-photo"
                aria-label={here ? `${b.name}, back to the top of this page` : `See ${b.name}`}
                onClick={here ? backToTop : undefined}
              >
                <img src={b.imageUrl} alt="" loading="lazy" decoding="async" />
              </Link>
              <div className="jni-compare-body">
                <h3>{b.name.replace(/^FLIPO['’]s\s+/i, '')}</h3>
                <p>{b.shortName}</p>
                <dl>
                  <div>
                    <dt>In the box</dt>
                    <dd>{b.includes.join(', ')}</dd>
                  </div>
                  <div>
                    <dt>A pack</dt>
                    <dd>{rupee(perPacketPrice(b))}</dd>
                  </div>
                  <div>
                    <dt>Delivery</dt>
                    <dd>{shipping ? `${rupee(shipping)} shipping` : 'Free shipping'}</dd>
                  </div>
                </dl>
                <div className="jni-compare-buy">
                  <span className="jni-flight-price">
                    <b>{rupee(b.price)}</b>
                    {b.originalPrice > b.price && <s>{rupee(b.originalPrice)}</s>}
                  </span>
                  {here ? (
                    <button type="button" className="jni-btn jni-compare-cta" onClick={() => buy(b)}>
                      Buy now · {rupee(deliveredTotal(Number(b.price)))}
                    </button>
                  ) : (
                    <>
                      <Link to={`/combos/${b.slug}`} className="jni-compare-see">
                        See the box
                      </Link>
                      <button type="button" className="jni-flight-add" onClick={() => add(b)}>
                        {justAdded === b.slug ? 'Added' : 'Add'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <div className="jni-compare-singles">
        <p className="jni-compare-singles-k">Already know your flavour?</p>
        <ul>
          {products.map((p, i) => (
            <li key={p.slug} style={{ '--turn': `${[-6, 2, 7][i % 3]}deg` }}>
              <Link to={`/flavours/${p.slug}`}>
                <img {...responsiveImage(pouchCutout(p.slug), '(min-width: 1024px) 200px, 140px')} alt="" loading="lazy" decoding="async" />
                <b>{p.shortName}</b>
                <small>{rupee(p.price)} · one pack</small>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
