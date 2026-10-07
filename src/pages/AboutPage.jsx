import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BrandHeading } from '../components/ui/Primitives'
import { Rosette } from '../components/icons/WhyIcons'
import DoodleField from '../components/ui/DoodleField'
import BlobPanel from '../components/ui/BlobPanel'
import { TriangleCluster } from '../components/ui/TriangleCluster'
import FlipSpot from '../components/mascot/FlipSpot'
import LaunchBanner from '../components/promo/LaunchBanner'
import { pouchCutout } from '../components/product/PouchStage'
import { responsiveImage } from '../lib/responsiveImage'
import '../styles/about.css'

/*
 * About us, laid out the way the owner's About artboard is: a desk, the story
 * told across a dark band, then the in-between moments the snacks are for.
 *
 * The desk is literal. The intro is written to someone at a desk, so the copy
 * sits above a sunshine desktop with the site's own stationery standing on
 * its back edge, and the brand photo is pinned to it like a print. The story
 * section crosses out the rulebook it is written against, and the closing
 * list sits beside the three pouches the page has been talking about.
 *
 * Every word is the brand's own copy; only how it is set has changed.
 */

const DESK = (name) => `/assets/hero/desk/${name}.webp`

const PILLARS = [
  { title: 'Taste First', body: "Because if it doesn't taste amazing, what's the point?" },
  {
    title: 'No Boring Bites. For Real!',
    body: "Life has enough boring moments. Your snack shouldn't be one of them.",
  },
  { title: 'Bold Flavours', body: 'We like our flavours loud, exciting and impossible to ignore.' },
]

const RULES = ['No gluten.', 'No palm oil.', 'Read the label twice.', 'Think before you bite.']

const STEPS = ['Open it', 'Grab it', 'Nibble it', 'Repeat.']

const NOS = [
  'No overthinking.',
  'No snack lectures.',
  'No unnecessary rules.',
  'Just good times and great bites.',
]

const POUCHES = ['jalapeno-kick', 'peri-peri-punch', 'sweet-chilli-rush']

export default function AboutPage() {
  useEffect(() => {
    document.title = 'About Us | Just Nibble It'
  }, [])

  return (
    <div className="min-w-0 flex-grow">
      <div className="bg-cream pt-[var(--site-header-offset)] text-ink">
        {/* ---- the desk ---- */}
        <section className="about-intro relative overflow-hidden px-5 pt-20 text-center sm:px-8 lg:px-12">
          <div className="relative mx-auto mb-6 inline-block">
            <Rosette className="absolute -left-12 -top-1 h-8 w-8" fill="#F3C63B" />
            <BrandHeading as="h1" fill="#4DB8AE" className="text-5xl sm:text-6xl lg:text-7xl">
              About Us
            </BrandHeading>
            <Rosette className="absolute -right-12 -top-1 h-8 w-8" fill="#F3C63B" />
          </div>

          <BrandHeading as="p" fill="#F3C63B" className="mx-auto max-w-4xl text-2xl sm:text-3xl lg:text-4xl">
            Your snack break should never be boring!
          </BrandHeading>

          <div className="mx-auto mt-8 max-w-3xl space-y-4 text-base font-bold leading-8 sm:text-lg">
            <p className="text-lg font-black uppercase tracking-wide sm:text-xl">
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

          <div className="about-motto mx-auto mt-9 max-w-3xl">
            <p className="text-xl font-black uppercase tracking-wide sm:text-2xl">
              Taste first. Flavour always.
            </p>
            <p className="mt-3 text-base font-bold leading-8 sm:text-lg">
              No unnecessary rules. No loud claims.
              <br />
              Just damn good snacks made for your everyday mundane moments.
            </p>
          </div>

          {/* The desktop: stationery on its back edge, the photo pinned to it. */}
          <div className="about-desk relative mx-auto mt-16 max-w-5xl">
            <img
              {...responsiveImage(DESK('jalapeno-kick--pens'), '(min-width: 768px) 96px, 64px')}
              alt=""
              className="about-desk-prop about-desk-prop--pens"
              loading="lazy"
              decoding="async"
            />
            <img
              {...responsiveImage(DESK('peri-peri-punch--mug'), '(min-width: 768px) 150px, 96px')}
              alt=""
              className="about-desk-prop about-desk-prop--mug"
              loading="lazy"
              decoding="async"
            />
            <div className="about-desk-top jni-grain">
              <figure className="about-print">
                <img
                  {...responsiveImage(
                    '/assets/brand/desk-snacks-hero.jpeg',
                    '(min-width: 1024px) 760px, calc(100vw - 96px)'
                  )}
                  alt="FLIPO's snack packs on a desk"
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/9] w-full object-cover"
                />
              </figure>
            </div>
          </div>
        </section>

        {/* ---- why we made it ---- */}
        <section className="about-why relative isolate overflow-hidden bg-[#071A16] px-5 pb-24 pt-16 text-center text-white sm:px-8 sm:pb-28 sm:pt-20 lg:px-12">
          {/* Mostly body copy, so the field stays subtle. */}
          <DoodleField flavour="peri-peri-punch" ground="#071A16" intensity="subtle" count={22} seed={31} />
          <img
            {...responsiveImage(DESK('jalapeno-kick--mouse'), '160px')}
            alt=""
            aria-hidden="true"
            className="about-why-prop about-why-prop--mouse"
            loading="lazy"
            decoding="async"
          />
          <img
            {...responsiveImage(DESK('sweet-chilli-rush--calculator'), '160px')}
            alt=""
            aria-hidden="true"
            className="about-why-prop about-why-prop--calc"
            loading="lazy"
            decoding="async"
          />
          <TriangleCluster className="absolute left-[8%] top-[26%] hidden opacity-80 sm:block" />
          <TriangleCluster className="absolute right-[9%] top-[58%] hidden scale-x-[-1] opacity-80 sm:block" />

          <BrandHeading as="h2" fill="#F3C63B" className="mx-auto max-w-4xl text-3xl sm:text-4xl lg:text-5xl">
            Why we created Just Nibble It
          </BrandHeading>

          <div className="mx-auto mt-8 max-w-2xl space-y-4 text-sm font-bold leading-7 text-white/85 sm:text-base">
            <p>
              Our story began when we realised we had stopped enjoying snacks and started
              overthinking them.
            </p>
            <p>And, somehow, the small joy of opening a snack got trapped in rulebooks:</p>
          </div>

          {/* The rulebook, crossed out -- the thing the brand is written against. */}
          <ul className="about-rules mx-auto mt-6" aria-label="The rulebook">
            {RULES.map((rule) => (
              <li key={rule}>
                <s>{rule}</s>
              </li>
            ))}
          </ul>

          <blockquote className="mx-auto mt-12 max-w-2xl">
            <p className="text-lg font-black text-teal sm:text-xl">And we started wondering:</p>
            <p className="about-why-question mt-2">Why does treating yourself have to come with guilt?</p>
          </blockquote>

          <div className="mx-auto mt-10 max-w-2xl space-y-4 text-sm font-bold leading-7 text-white/85 sm:text-base">
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

        {/* ---- the in-between moments ---- */}
        <section className="about-moments relative overflow-x-clip bg-cream px-5 pb-20 pt-16 text-center sm:px-8 sm:pt-20 lg:px-12">
          <BrandHeading as="h2" fill="#4DB8AE" className="mx-auto max-w-4xl text-2xl sm:text-3xl lg:text-4xl">
            Just Nibble It are snacks made for the in-between moments during your day!
          </BrandHeading>

          <div className="mx-auto mt-8 max-w-2xl space-y-3 text-sm font-bold leading-7 sm:text-base">
            <p>Because your desk isn&apos;t just a desk.</p>
            <p>
              It&apos;s where you work, study, create, game, scroll, hustle and take those much
              needed breaks.
            </p>
            <p>And somewhere in between it all, there&apos;s always room for a nibble.</p>
          </div>

          <div className="relative mx-auto mt-20 max-w-5xl">
            <FlipSpot
              mode="peek"
              width="clamp(96px, 13vw, 180px)"
              style={{ left: '14%', top: 4 }}
            />
            <div className="about-stand relative isolate rounded-[28px] border-[4px] border-ink bg-[#071A16] px-6 pb-12 pt-10 shadow-doodle-lg sm:px-10">
              <BrandHeading as="h3" fill="#4DB8AE" className="text-2xl sm:text-3xl">
                What we stand for ?
              </BrandHeading>
              <ul className="mt-9 grid gap-6 sm:grid-cols-3 sm:gap-5">
                {PILLARS.map((pillar, i) => (
                  <li key={pillar.title} className="about-pillar" style={{ '--turn': `${[-2, 1.5, -1][i]}deg` }}>
                    <p className="text-base font-black uppercase tracking-wide">{pillar.title}</p>
                    <p className="mt-3 text-sm font-bold leading-6 text-ink/75">{pillar.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The ritual, in order: a real sequence, so it reads as one. */}
          <ol className="about-steps mx-auto mt-16 max-w-4xl" aria-label="Open it. Grab it. Nibble it. Repeat.">
            {STEPS.map((step, i) => (
              <li key={step}>
                <span>{step}</span>
                {i < STEPS.length - 1 && (
                  <img
                    src={`/assets/doodles/pack/${POUCHES[i]}-chilli-whole.svg`}
                    alt=""
                    className="about-steps-chilli"
                  />
                )}
              </li>
            ))}
          </ol>

          <div className="mx-auto mt-14 grid max-w-5xl items-center gap-10 text-left md:grid-cols-[1fr_1.1fr]">
            <ul className="about-nos space-y-3 text-xl font-black sm:text-2xl">
              {NOS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <BlobPanel shape="wide1" bg="#4DB8AE" pad="none" className="about-pouches" aria-hidden="true">
              {POUCHES.map((slug, i) => (
                <img
                  key={slug}
                  {...responsiveImage(pouchCutout(slug), '(min-width: 768px) 180px, 30vw')}
                  alt=""
                  className={`about-pouch about-pouch--${i}`}
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </BlobPanel>
          </div>

          <Link to="/flavours" className="jni-btn mt-14 text-base">
            Nibble All Now <ArrowRight size={16} />
          </Link>
        </section>

        {/* ---- the box: the owner's artboard closes on the bundle ---- */}
        <div className="about-end bg-forest">
          <LaunchBanner />
        </div>
      </div>
    </div>
  )
}
