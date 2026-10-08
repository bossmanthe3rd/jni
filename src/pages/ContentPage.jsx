import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Mail, Sparkles } from 'lucide-react'
import { BrandHeading, Blob, Sparkle } from '../components/ui/Primitives'
import { SHOP_HREF } from '../data/site'

/**
 * Generic content page. On the live site this is the catch-all route element,
 * so any unmatched path renders it — falling back to the /faq entry.
 */
const CONTENT = {
  '/ingredients': {
    eyebrow: 'What goes in',
    title: 'Readable ingredients. Unreasonably good crunch.',
    intro:
      "Each FLIPO's flavour starts with a crisp base and a deliberately short flavour story. No vague snack-speak.",
    points: ['Flavour-led seasoning', 'Vegetarian launch range', 'Transparent pack information'],
  },
  '/sustainability': {
    eyebrow: 'Better by iteration',
    title: 'Less waste starts with decisions we can measure.',
    intro:
      'We are building practical improvements across packaging, production planning, and shipment consolidation as the range scales.',
    points: [
      'Demand-led production',
      'Right-sized shipping cartons',
      'Supplier accountability roadmap',
    ],
  },
  '/press': {
    eyebrow: 'Press room',
    title: 'The crunch is making noise.',
    intro:
      'For product samples, founder notes, launch imagery, or collaboration enquiries, contact our brand desk.',
    points: [
      'High-resolution product imagery',
      'Founder and brand notes',
      'Launch and retail information',
    ],
  },
  '/contact': {
    eyebrow: 'Talk to us',
    title: 'Questions, feedback, collabs, cravings.',
    intro:
      'Our team at Meenakshi Craft Foods Private Limited handles order support, retail enquiries, creator collaborations, and product feedback.',
    points: ['Order support', 'Retail and distribution', 'Creator and brand partnerships'],
  },
  '/terms': {
    eyebrow: 'Terms',
    title: 'Clear rules for a clean checkout.',
    intro:
      'Just Nibble It is a packaged foods / premium snacks (FMCG) brand operated by Meenakshi Craft Foods Private Limited. Prices, availability, promotions, delivery estimates, and refund eligibility are confirmed during checkout and order processing.',
    points: [
      'Indian Rupee pricing',
      'Inventory subject to confirmation',
      'Promotions cannot be duplicated unless stated',
    ],
  },
  '/faq': {
    eyebrow: 'FAQ',
    title: 'The questions people ask before opening a bag.',
    intro:
      'Find quick answers about flavours, combos, delivery, payments, and order support.',
    points: [
      'All launch products are vegetarian',
      'Pincode delivery is checked at checkout',
      'UPI, card and supported fast-checkout methods',
    ],
  },
}

const POINT_COLORS = [
  'var(--color-accent-yellow)',
  'var(--color-flavor-jalapeno)',
  'var(--color-accent-teal)',
]

export default function ContentPage() {
  const { pathname } = useLocation()
  const content = CONTENT[pathname] || CONTENT['/faq']

  useEffect(() => {
    document.title = `${content.title} | Just Nibble It`
  }, [content])

  return (
    <div className="relative overflow-hidden bg-cream pb-12 pt-[var(--site-header-offset)] text-ink">
      <Blob className="pointer-events-none absolute left-[3%] top-[22%] hidden h-16 w-16 opacity-50 lg:block" />
      <Blob className="pointer-events-none absolute right-[5%] top-[38%] hidden h-24 w-24 opacity-40 lg:block" />

      <section className="relative mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-12">
        <Link
          to="/"
          className="group mb-8 inline-flex h-12 items-center gap-2 rounded-pill border-[3px] border-ink bg-sunshine px-5 text-sm font-black text-ink shadow-doodle transition hover:-translate-y-0.5 hover:shadow-doodle-lg"
        >
          <ArrowLeft size={18} className="transition group-hover:-translate-x-1" /> Back home
        </Link>

        <p className="text-xs font-black uppercase tracking-[0.14em] text-teal">
          {content.eyebrow}
        </p>

        <div className="relative mt-2 inline-block">
          <Sparkle className="absolute -left-11 -top-3 h-8 w-8" />
          <BrandHeading as="h1" fill="#F3C63B" className="max-w-3xl text-3xl sm:text-4xl lg:text-5xl">
            {content.title}
          </BrandHeading>
        </div>

        <p className="mt-6 max-w-2xl text-sm font-bold leading-7 text-ink/75 sm:text-base">
          {content.intro}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {content.points.map((point, i) => (
            <div
              key={point}
              className="flex min-h-24 items-center gap-3 rounded-[22px] border-[3px] border-ink px-5 py-4 shadow-doodle"
              style={{ backgroundColor: POINT_COLORS[i % POINT_COLORS.length] }}
            >
              <Sparkles size={20} className="shrink-0 text-ink" />
              <span className="text-sm font-black text-ink">{point}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 rounded-[28px] border-[4px] border-ink bg-[#071A16] p-6 shadow-doodle-lg sm:grid-cols-[1fr,auto] sm:items-center sm:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-sunshine">
              Still need a human?
            </p>
            <p className="mt-1 font-display text-2xl text-teal">The snack desk is listening.</p>
          </div>
          <a href="mailto:nibble@justnibbleit.in" className="jni-btn w-fit">
            <Mail size={16} /> nibble@justnibbleit.in
          </a>
        </div>

        <Link to={SHOP_HREF} className="jni-btn jni-btn-dark mt-8">
          Back to the snacks <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  )
}
