import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BrandHeading, Blob, Sparkle } from '../components/ui/Primitives'
import { KeyboardIcon, StarDoodle } from '../components/icons/WhyIcons'

export default function AboutPage() {
  useEffect(() => {
    document.title = 'About Us | Just Nibble It'
  }, [])

  return (
    <div className="min-w-0 flex-grow">
      <main className="bg-cream pt-[var(--site-header-offset)] text-ink">
        {/* Intro */}
        <section className="relative overflow-hidden px-5 pb-14 pt-10 text-center sm:px-8 lg:px-12">
          <div className="relative mx-auto mb-7 inline-block">
            <Sparkle className="absolute -left-10 -top-2 h-7 w-7" />
            <BrandHeading as="h1" fill="#F3C63B" className="text-5xl sm:text-6xl lg:text-7xl">
              About Us
            </BrandHeading>
            <Sparkle className="absolute -right-10 -top-2 h-7 w-7" />
          </div>

          <BrandHeading
            as="p"
            fill="#F3C63B"
            className="mx-auto max-w-4xl text-2xl sm:text-3xl lg:text-4xl"
          >
            Your snack break should never be boring!
          </BrandHeading>

          <div className="mx-auto mt-8 max-w-3xl space-y-4 text-sm font-bold leading-7 sm:text-base">
            <p className="text-base font-black uppercase tracking-wide sm:text-lg">
              You spend long hours at your desk staring at that boring spreadsheet!
            </p>
            <p>
              We created Just Nibble It for one simple reason — to make your desk breaks more
              delicious and something you look forward to.
            </p>
            <p>
              Whether you&apos;re working, studying, gaming, creating or simply taking a break,
              we&apos;re here to be your companions with bold flavours, satisfying crunch and zero
              boring bites.
            </p>
          </div>

          <div className="mx-auto mt-9 max-w-2xl">
            <p className="font-display text-2xl sm:text-3xl">Taste first. Flavour always.</p>
            <p className="mt-3 text-sm font-bold leading-7 sm:text-base">
              No unnecessary rules. No loud claims.
              <br />
              Just damn good snacks made for your everyday mundane moments.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-[28px] border-[4px] border-ink bg-sunshine shadow-doodle-lg">
            <img
              src="/assets/brand/desk-snacks-hero.jpeg"
              alt="FLIPO's snack packs on a desk"
              width="1600"
              height="900"
              loading="lazy"
              decoding="async"
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        </section>

        {/* Why we created it */}
        <section className="relative overflow-hidden bg-[#071A16] px-5 py-14 text-center text-white sm:px-8 sm:py-16 lg:px-12">
          <KeyboardIcon className="absolute left-[3%] top-[38%] h-8 w-14 opacity-30" />
          <KeyboardIcon className="absolute right-[3%] top-[35%] h-8 w-14 opacity-30" />

          <BrandHeading
            as="h2"
            fill="#F3C63B"
            className="mx-auto max-w-4xl text-3xl sm:text-4xl lg:text-5xl"
          >
            Why we created Just Nibble It
          </BrandHeading>

          <div className="mx-auto mt-8 max-w-3xl space-y-4 text-sm font-bold leading-7 text-white/85 sm:text-base">
            <p>
              Our story began when we realised we had stopped enjoying snacks and started
              overthinking them.
            </p>
            <p>And, somehow, the small joy of opening a snack got trapped in rulebooks:</p>
            <p className="text-white">
              No gluten. No palm oil. Read the label twice. Think before you bite.
            </p>
          </div>

          <div className="mx-auto mt-9 max-w-2xl">
            <p className="font-display text-xl text-teal sm:text-2xl">And we started wondering:</p>
            <p className="mt-1 font-display text-xl text-teal sm:text-2xl">
              Why does treating yourself have to come with guilt?
            </p>
          </div>

          <div className="mx-auto mt-9 max-w-3xl space-y-4 text-sm font-bold leading-7 text-white/85 sm:text-base">
            <p>That question became our starting point.</p>
            <p>
              Nibble was born to debunk the rulebook, to make desk snacking easy again. Snacks that
              save you from thinking too hard.
            </p>
            <p>
              We believe most people don&apos;t want to decode labels, follow food rules, or feel
              judged for enjoying a snack. They just want something that tastes good, fits into
              their day, and doesn&apos;t demand attention.
            </p>
          </div>

          <svg
            className="absolute inset-x-0 -bottom-px h-12 w-full sm:h-16"
            viewBox="0 0 1440 90"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              fill="#F3C63B"
              d="M0 40 C 180 90 320 0 480 38 C 640 76 800 8 960 42 C 1120 76 1280 18 1440 48 L1440 90 L0 90 Z"
            />
          </svg>
        </section>

        {/* In-between moments */}
        <section className="relative overflow-hidden bg-cream px-5 pb-14 pt-16 text-center sm:px-8 sm:pt-20 lg:px-12">
          <span
            className="absolute left-6 top-[38%] block h-6 w-6 rounded-full bg-teal/70"
            aria-hidden="true"
          />
          <span
            className="absolute right-6 top-[34%] block h-9 w-9 rounded-full bg-teal/60"
            aria-hidden="true"
          />
          <Blob className="absolute left-[6%] bottom-24 h-6 w-6 opacity-60" />

          <BrandHeading
            as="h2"
            fill="#4DB8AE"
            className="mx-auto max-w-4xl text-2xl sm:text-3xl lg:text-4xl"
          >
            Just Nibble It are snacks made for the in-between moments during your day!
          </BrandHeading>

          <div className="mx-auto mt-8 max-w-3xl space-y-3 text-sm font-bold leading-7 sm:text-base">
            <p>Because your desk isn&apos;t just a desk.</p>
            <p>
              It&apos;s where you work, study, create, game, scroll, hustle and take those much
              needed breaks.
            </p>
            <p>And somewhere in between it all, there&apos;s always room for a nibble.</p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl rounded-[28px] border-[4px] border-ink bg-[#071A16] px-6 py-10 shadow-doodle-lg sm:px-10">
            <BrandHeading as="h3" fill="#4DB8AE" className="text-2xl sm:text-3xl">
              What we stand for ?
            </BrandHeading>
            <div className="mt-8 grid gap-8 sm:grid-cols-3">
              {[
                {
                  title: 'Taste First',
                  body: "Because if it doesn't taste amazing, what's the point?",
                },
                {
                  title: 'No Boring Bites. For Real!',
                  body: "Life has enough boring moments. Your snack shouldn't be one of them.",
                },
                {
                  title: 'Bold Flavours',
                  body: 'We like our flavours loud, exciting and impossible to ignore.',
                },
              ].map((pillar) => (
                <div key={pillar.title}>
                  <p className="text-sm font-black uppercase tracking-wide text-sunshine">
                    {pillar.title}
                  </p>
                  <p className="mt-3 text-sm font-bold leading-6 text-white/75">{pillar.body}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="mx-auto mt-12 max-w-3xl font-display text-2xl tracking-wide sm:text-3xl lg:text-4xl">
            Open it . Grab it . Nibble it . Repeat.
          </p>

          <div className="relative mx-auto mt-10 max-w-2xl">
            <StarDoodle className="absolute right-6 top-2 h-16 w-16 opacity-70" />
            <ul className="relative z-[1] space-y-2 text-left text-lg font-bold sm:text-2xl">
              <li>No overthinking.</li>
              <li>No snack lectures.</li>
              <li>No unnecessary rules.</li>
              <li>Just good times and great bites.</li>
            </ul>
          </div>

          <Link to="/flavours" className="jni-btn mt-12 text-base">
            Nibble All Now <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    </div>
  )
}
