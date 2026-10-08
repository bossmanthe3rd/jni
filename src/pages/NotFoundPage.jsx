import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Home } from 'lucide-react'
import { BrandHeading } from '../components/ui/Primitives'
import { Crumbs } from '../components/icons/Wordmark'
import DoodleField from '../components/ui/DoodleField'
import { SHOP_HREF } from '../data/site'

/*
 * The page that was missing.
 *
 * Every unmatched URL used to render the FAQ page with a 200 -- so a typo like
 * /flavors looked like a real page to both readers and crawlers, and nothing
 * ever told anyone they were lost.
 *
 * A static SPA cannot send a real 404 status from the client, so this at least
 * marks itself noindex; a proper status needs a rule at the host (a 404.html
 * fallback on Netlify/Vercel, or try_files on nginx).
 *
 * The joke writes itself for this brand: the page got eaten. The crumbs are the
 * real ones from the logo.
 */
export default function NotFoundPage() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = 'Page not found | Just Nibble It'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  return (
    <div className="min-w-0 flex-grow">
      <div className="relative isolate grid min-h-[70vh] place-items-center overflow-hidden bg-cream px-5 pb-20 pt-[calc(var(--site-header-offset)+3rem)] text-ink">
        <DoodleField
          flavour="peri-peri-punch"
          ground="#fbf6d0"
          intensity="subtle"
          count={18}
          seed={404}
        />

        <div className="mx-auto max-w-xl text-center">
          <div className="relative mx-auto w-fit">
            <BrandHeading as="p" fill="#E85D4C" className="text-[5.5rem] leading-none sm:text-[8rem]">
              404
            </BrandHeading>
            {/* The logo's own crumbs, tumbling off the number. */}
            <Crumbs
              fill="#071A16"
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-4 h-16 w-auto -rotate-12 opacity-80 sm:-right-16 sm:h-24"
            />
          </div>

          <h1 className="mt-4 font-brand text-2xl leading-tight sm:text-3xl">
            This page got nibbled.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-7 sm:text-base">
            There is nothing at{' '}
            <span className="rounded bg-ink/10 px-1.5 py-0.5 font-mono text-[0.85em]">
              {pathname}
            </span>
            . It may have moved, or it may never have existed. Either way, the snacks are still
            where you left them.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to={SHOP_HREF} className="jni-btn">
              See all flavours <ArrowRight size={16} />
            </Link>
            <Link
              to="/"
              className="inline-flex h-12 items-center gap-2 rounded-pill border-[3px] border-ink bg-cream px-5 text-sm font-black text-ink shadow-doodle transition hover:-translate-y-0.5 hover:shadow-doodle-lg"
            >
              <Home size={16} /> Back home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
