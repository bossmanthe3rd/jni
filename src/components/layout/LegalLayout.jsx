import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { legalBusinessDetails } from '../../data/site'
import { BrandHeading, Blob, Sparkle } from '../ui/Primitives'

/** Shared chrome for every policy page. */
export default function LegalLayout({ title, lastUpdated, children }) {
  useEffect(() => {
    document.title = `${title} | Just Nibble It`
  }, [title])

  return (
    <div className="min-w-0 flex-grow">
      <div className="relative overflow-hidden bg-cream pt-[var(--site-header-offset)] text-ink">
        <Blob className="absolute -left-4 top-40 h-16 w-16 opacity-20" />
        <Sparkle className="absolute right-6 top-64 h-10 w-10 opacity-25" />

        <div className="relative mx-auto max-w-4xl px-5 pb-16 pt-8 sm:px-8">
          <Link
            to="/"
            className="group mb-8 inline-flex h-12 items-center gap-2 rounded-pill border-[3px] border-ink bg-sunshine px-5 text-sm font-black text-ink shadow-doodle transition hover:-translate-y-0.5 hover:shadow-doodle-lg"
          >
            <ArrowLeft size={16} /> Back home
          </Link>

          <div className="relative mb-3 inline-block">
            <Sparkle className="absolute -left-9 -top-3 h-6 w-6" />
            <BrandHeading as="h1" fill="#F3C63B" className="text-4xl sm:text-5xl lg:text-6xl">
              {title}
            </BrandHeading>
          </div>
          <p className="mt-2 text-xs font-black uppercase tracking-wide text-ink/45">
            Last updated: {lastUpdated}
          </p>

          <div className="jni-card mt-8 space-y-5 p-6 text-sm font-medium leading-7 text-ink/80 shadow-doodle sm:p-8 sm:text-base">
            {children}
          </div>

          <div className="mt-8 rounded-[28px] border-[4px] border-ink bg-[#071A16] p-6 text-sm text-white/75 shadow-doodle-lg sm:p-8">
            <p className="font-display text-xl text-sunshine">Legal business details</p>
            <p className="mt-3 font-black text-white">{legalBusinessDetails.brand}</p>
            <p>{legalBusinessDetails.entity}</p>
            <p>Business category: {legalBusinessDetails.category}</p>
            <p className="mt-3">{legalBusinessDetails.address}</p>
            <p className="mt-3">
              Email:{' '}
              <a
                className="font-black text-teal hover:underline"
                href={`mailto:${legalBusinessDetails.email}`}
              >
                {legalBusinessDetails.email}
              </a>
            </p>
            <p>Phone: {legalBusinessDetails.phone}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Section heading used inside policy bodies. */
export function LegalHeading({ children }) {
  return <h2 className="pt-2 text-2xl font-bold text-black">{children}</h2>
}

export function LegalList({ items }) {
  return (
    <ul className="list-disc space-y-2 pl-6">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}
