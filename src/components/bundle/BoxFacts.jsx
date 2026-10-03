import { perPacketPrice } from '../../data/products'
import { Slap } from '../product/PouchFacts'
import { boxFlavours } from './boxContents'

/**
 * What's in the box, as stickers on the same board the flavour pages use.
 *
 * The old combo page folded this into an accordion and ran the three
 * flavours' ingredients together into one sentence, so nobody could tell
 * which seasoning was in which pouch. Here each flavour gets its own row,
 * with its own doodle, and the allergen line is kept word for word.
 */

/* One doodle per ingredient, in the order products.js lists them. */
const ING_SHAPES = ['chilli-whole', 'pepper-section', 'seed']

export default function BoxFacts({ bundle }) {
  const flavours = boxFlavours(bundle)
  const perPack = perPacketPrice(bundle)
  const facts = [
    {
      // No-break space before the unit: in the narrow phone card the "g" was
      // wrapping onto a line of its own.
      big: bundle.weight?.replace(/\s*gms?$/i, ' g') || `${bundle.packetCount} × 100 g`,
      small: `${bundle.packetCount} stand-up pouches, ${flavours.length} flavours.`,
      bg: '#ffffff',
      turn: -2,
    },
    perPack && {
      big: `₹${perPack}`,
      small: 'A pack, bought in this box.',
      bg: 'var(--color-accent-yellow)',
      turn: 1.5,
    },
    { big: '6 months', small: 'Shelf life from packaging.', bg: 'var(--color-accent-teal)', turn: -1 },
    {
      big: 'Zip-lock',
      small: 'On every pouch, so opening one never means finishing all of them.',
      bg: '#ffffff',
      turn: 2.2,
    },
  ].filter(Boolean)

  return (
    <section className="jni-facts" aria-labelledby="jni-box-facts-title">
      <div className="jni-facts-inner">
        <h2 id="jni-box-facts-title">What’s in the box</h2>
        <p className="jni-facts-lede">{bundle.description}</p>

        <div className="jni-facts-grid">
          {facts.map((f, i) => (
            <Slap key={f.big} i={i} turn={f.turn} style={{ backgroundColor: f.bg }}>
              <b>{f.big}</b>
              <p>{f.small}</p>
            </Slap>
          ))}

          <Slap i={4} turn={0.8} className="jni-facts-wide jni-box-ings-card" style={{ backgroundColor: '#ffffff' }}>
            <b className="jni-facts-h">Ingredients, pouch by pouch</b>
            <dl className="jni-box-ings">
              {flavours.map(({ product }) => (
                <div key={product.slug}>
                  <dt>{product.shortName || product.name}</dt>
                  <dd>
                    <ul className="jni-facts-ings">
                      {product.ingredients?.map((ing, i) => (
                        <li key={ing}>
                          <img
                            src={`/assets/doodles/pack/${product.slug}-${ING_SHAPES[i] || 'seed'}.svg`}
                            alt=""
                          />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="jni-facts-note">
              May contain traces of milk, soy and nuts. Manufactured in a facility that also
              processes wheat.
            </p>
          </Slap>

          <Slap i={5} turn={-1.4} className="jni-facts-wide jni-facts-dark jni-box-how">
            <b className="jni-facts-h">How to work through it</b>
            <p>
              Open the mildest first and finish on the hottest. Zip each pouch shut before you
              move on to the next. The box is fixed for launch, so you can&apos;t swap flavours
              yet, but you can add single packs to the same order.
            </p>
          </Slap>
        </div>
      </div>
    </section>
  )
}
