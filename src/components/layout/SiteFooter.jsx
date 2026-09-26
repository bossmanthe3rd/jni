import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown, Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import {
  FOOTER_IMAGE_INTERVAL,
  footerColumns,
  footerRotatingImages,
  footerStaticImage,
  legalBusinessDetails,
} from '../../data/site'
import { bundles } from '../../data/products'
import { Blob, BrandHeading, Sparkle } from '../ui/Primitives'
import DoodleField from '../ui/DoodleField'

const socialIcons = { Instagram, Facebook }
const SOCIAL_BG = { Instagram: 'bg-[#E1306C]', Facebook: 'bg-[#1877F2]' }
const SOCIAL_FG = { Instagram: 'text-[#E1306C]', Facebook: 'text-[#1877F2]' }

/** Wobbly starburst badge on the launch-drop card. */
function BurstBadge({ className = '', children }) {
  return (
    <div className={`relative grid place-items-center ${className}`}>
      <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
        <path
          fill="#4DB8AE"
          stroke="#071A16"
          strokeWidth="4"
          d="M80 8c8 0 12 8 20 8s12-8 20 0 0 12 8 20 8 12 0 20 8 12 0 20-8 12-8 20-12 8-20 8-12 8-20 0-12-8-20-8-12 8-20 0-8-12-8-20-8-12 0-20-8-12 0-20 8-12 8-20 12-8 20-8 12-8 20 0Z"
        />
      </svg>
      {/* The label sits in the blob's inner area, not its bounding box. As a
          two-row grid over inset-0 the number was pushed past the lower lobe and
          landed on the dark card behind -- near-black on near-black, so the "3"
          in "Bundle of 3" was effectively invisible. */}
      <div className="absolute inset-[20%] flex flex-col items-center justify-center gap-0.5 text-center font-black uppercase leading-none text-[#05222a]">
        {children}
      </div>
    </div>
  )
}

/** Scattered decorative marks behind the CTA block, positioned as on the live site. */
function CtaDecor() {
  return (
    <>
      {/* Cream wave lip along the top edge of the footer. A page whose last
          section cuts its own edge into the footer hides this (pdp.css). */}
      <svg
        className="jni-footer-lip absolute inset-x-0 top-0 h-10 w-full sm:h-12"
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="#FBF6D0"
          d="M0 40 C 180 90 320 0 480 38 C 640 76 800 8 960 42 C 1120 76 1280 18 1440 48 L1440 90 L0 90 Z"
        />
      </svg>

      <Blob className="pointer-events-none absolute left-[3%] top-[30%] h-16 w-16 opacity-60" />
      <Blob className="pointer-events-none absolute bottom-[12%] right-[6%] h-24 w-24 opacity-40" />

      {/* Chilli outline */}
      <svg
        className="pointer-events-none absolute -bottom-4 left-[38%] hidden h-28 w-16 rotate-12 opacity-25 lg:block"
        viewBox="0 0 40 64"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M20 8c2 6 12 10 12 24 0 14-5.5 24-12 30C13.5 56 8 46 8 32 8 18 18 14 20 8Z"
          stroke="#4DB8AE"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M20 8c0 5-2 8-5 10" stroke="#4DB8AE" strokeWidth="3" strokeLinecap="round" />
      </svg>

      {/* Jalapeño slice outline */}
      <svg
        className="pointer-events-none absolute right-[26%] top-[22%] hidden h-12 w-16 opacity-30 lg:block"
        viewBox="0 0 56 40"
        fill="none"
        aria-hidden="true"
      >
        <ellipse cx="28" cy="20" rx="18" ry="12" stroke="#77d21c" strokeWidth="3.2" />
        <ellipse cx="28" cy="20" rx="8" ry="5.5" stroke="#77d21c" strokeWidth="2.6" />
        <path d="M28 8v-4" stroke="#77d21c" strokeWidth="3" strokeLinecap="round" />
      </svg>

      {/* 8-point burst */}
      <svg
        className="pointer-events-none absolute left-[22%] top-[18%] hidden h-9 w-9 opacity-40 lg:block"
        viewBox="0 0 64 64"
        fill="#F3C63B"
        aria-hidden="true"
      >
        <path d="M32 2 36 22 54 14 42 28 62 32 42 36 54 50 36 42 32 62 28 42 14 50 26 36 2 32 22 28 14 14 28 22Z" />
      </svg>

      <Sparkle className="pointer-events-none absolute bottom-[28%] right-[14%] hidden h-8 w-8 opacity-50 lg:block" />
    </>
  )
}

function FooterCta() {
  const trio = bundles[0]
  return (
    <section className="relative overflow-hidden px-5 pb-14 pt-20 sm:px-8 sm:pt-24 lg:px-12">
      <CtaDecor />
      <div className="relative z-[1] mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr,0.85fr] lg:gap-14">
        <div>
          <BrandHeading
            as="p"
            fill="#FBF6D0"
            className="text-5xl leading-[0.95] sm:text-6xl lg:text-7xl"
          >
            JUST
            <br />
            NIBBLE IT
          </BrandHeading>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-teal sm:text-sm">
            Bold flavours, irresistible crunch
          </p>
        </div>

        <div className="relative rounded-[28px] border-[3px] border-teal bg-[#0C1B17] p-6 sm:p-8">
          <BurstBadge className="absolute -right-3 -top-6 h-24 w-24 sm:-right-5 sm:-top-8 sm:h-28 sm:w-28">
            <span className="text-[9px] leading-none">
              Bundle
              <br />
              of
            </span>
            <span className="text-2xl leading-none">{trio.packetCount}</span>
          </BurstBadge>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-teal">Launch drop</p>
          <p className="mt-2 max-w-[16ch] font-display text-2xl text-sunshine sm:text-3xl">
            All three flavours. One box.
          </p>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-4xl text-sunshine">₹{trio.price}</span>
            <span className="text-base font-bold text-white/40 line-through">
              ₹{trio.originalPrice}
            </span>
          </div>
          <Link to="/combos" className="jni-btn mt-6 w-fit px-8">
            Shop the bundles <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}

function FooterGallery() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % footerRotatingImages.length),
      FOOTER_IMAGE_INTERVAL
    )
    return () => window.clearInterval(id)
  }, [])
  const active = footerRotatingImages[index]

  return (
    <div className="border-t border-white/10 px-5 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] border-[3px] border-teal/60 bg-[#0C1B17]">
          <img
            src={footerStaticImage.src}
            alt={footerStaticImage.alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] border-[3px] border-teal/60 bg-[#0C1B17]">
          <motion.img
            key={active.src}
            src={active.src}
            alt={active.alt}
            loading="lazy"
            decoding="async"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {footerRotatingImages.map((img, i) => (
              <button
                key={img.src}
                type="button"
                aria-label={`Show footer image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full border border-[#050D0B]/40 transition-all ${
                  i === index ? 'w-6 bg-sunshine' : 'w-2 bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ColumnBody({ column }) {
  if (column.socials) {
    return (
      /* Labelled pills in each network's own colour, the way the live footer
         has them. Two bare teal circles read as generic UI chrome next to five
         columns of text, and gave no clue which was which until hover. */
      <div className="flex flex-col items-start gap-3">
        {column.socials.map(({ label, href }) => {
          const Icon = socialIcons[label]
          return (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center gap-2.5 rounded-pill border-[3px] border-ink px-3.5 py-2 font-brand text-sm text-white shadow-doodle transition hover:-translate-y-0.5 ${SOCIAL_BG[label] ?? 'bg-teal'}`}
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/95">
                <Icon size={14} className={SOCIAL_FG[label] ?? 'text-ink'} />
              </span>
              {label}
            </a>
          )
        })}
      </div>
    )
  }
  return (
    <ul className="space-y-3">
      {column.links.map((link) => (
        <li key={link.label}>
          <Link
            to={link.to}
            className="inline-block text-base font-bold text-white/85 transition hover:translate-x-1 hover:text-sunshine"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** The zigzag a pouch gets where it is heat-sealed. Stretches to any width. */
function CrimpEdge({ className = '', fill = '#F3C63B' }) {
  const teeth = 24
  const step = 120 / teeth
  const d =
    'M0,10' +
    Array.from({ length: teeth }, (_, i) => ` L${(i * step + step / 2).toFixed(2)},0 L${((i + 1) * step).toFixed(2)},10`).join('') +
    ' Z'
  return (
    <svg
      viewBox="0 0 120 10"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path d={d} fill={fill} />
    </svg>
  )
}

/**
 * Who you are actually buying from.
 *
 * The registered entity, address, phone and support mailbox were already in
 * `legalBusinessDetails` but appeared nowhere a visitor would look -- the
 * footer offered five columns of links and no way to reach a human. For a
 * packaged-foods brand this is also the detail a retailer or distributor scans
 * for first, so it sits with the columns rather than buried on /contact.
 */
function FooterContact() {
  const { entity, address, email, supportEmail, phone } = legalBusinessDetails
  const rows = [
    {
      Icon: Mail,
      label: 'Write to us',
      items: [
        { text: email, href: `mailto:${email}` },
        { text: supportEmail, href: `mailto:${supportEmail}` },
      ],
    },
    {
      Icon: Phone,
      label: 'Call us',
      items: [{ text: phone, href: `tel:${phone.replace(/\s+/g, '')}` }],
    },
    { Icon: MapPin, label: 'Find us', items: [{ text: address }] },
  ]

  return (
    <div className="mt-8 border-t border-white/10 pt-8 lg:mt-12">
      <div className="grid gap-6 sm:grid-cols-3">
        {rows.map(({ Icon, label, items }) => (
          <div key={label} className="flex gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-teal/50 text-teal">
              <Icon size={15} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-teal">
                {label}
              </p>
              {items.map((item) => (
                <p key={item.text} className="mt-1 text-sm font-bold leading-6 text-white/75">
                  {item.href ? (
                    <a href={item.href} className="transition hover:text-sunshine">
                      {item.text}
                    </a>
                  ) : (
                    item.text
                  )}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs font-bold text-white/40">
        {entity} &middot; FSSAI-compliant packaged foods
      </p>
    </div>
  )
}

export default function SiteFooter() {
  const [openColumn, setOpenColumn] = useState(null)

  return (
    <footer className="on-dark bg-[#050D0B] text-white">
      <FooterCta />
      <FooterGallery />

      <div className="relative isolate border-t border-white/10">
        {/* The flattest surface on the site: six columns of links on near-black.
            Subtle, because everything on top of it is something to read. */}
        <DoodleField
          flavour="jalapeno-kick"
          ground="#050D0B"
          intensity="subtle"
          count={20}
          seed={41}
        />
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-12 lg:py-12">
          {/* The arched lockup, from the brand folder's `curvee logo`. The
              header wears the stacked one; this is the wide cut, and the
              footer is the only place on the site with the width to carry it. */}
          <img
            src="/assets/brand/wordmark-arched.webp"
            alt="Just Nibble It"
            width="1600"
            height="207"
            loading="lazy"
            decoding="async"
            className="mx-auto mb-8 w-full max-w-md opacity-90 lg:mb-12 lg:max-w-xl"
          />

          {/* Mobile / tablet: accordion */}
          <div className="lg:hidden">
            {footerColumns.map((column) => {
              const open = openColumn === column.title
              return (
                <div key={column.title} className="border-b border-white/10">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenColumn(open ? null : column.title)}
                    className="flex w-full items-center justify-between py-4 text-left text-sm font-black uppercase tracking-[0.12em] text-teal"
                  >
                    {column.title}
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div className={`overflow-hidden pb-4 ${open ? '' : 'hidden'}`}>
                    <ColumnBody column={column} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop: six columns */}
          <div className="hidden gap-8 lg:grid lg:grid-cols-6">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h4 className="mb-5 text-sm font-black uppercase leading-none tracking-[0.12em] text-teal">
                  {column.title}
                </h4>
                <ColumnBody column={column} />
              </div>
            ))}
          </div>

          <FooterContact />
        </div>
      </div>

      {/* Every pouch is closed with a zigzag heat-seal crimp. The site ends on
          the same edge, so the last thing you see is a sealed packet. */}
      <div className="relative">
        <CrimpEdge className="absolute inset-x-0 -top-[11px] h-3 w-full" />
        <div className="bg-sunshine px-5 py-3 text-center text-xs font-black text-ink">
          {/* Hardcoding the year guarantees a stale footer on 1 January. */}
          © {new Date().getFullYear()} Just Nibble It. All Rights Reserved.
        </div>
      </div>
    </footer>
  )
}
