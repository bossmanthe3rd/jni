import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown, Facebook, Instagram } from 'lucide-react'
import {
  FOOTER_IMAGE_INTERVAL,
  footerColumns,
  footerRotatingImages,
  footerStaticImage,
} from '../../data/site'
import { bundles } from '../../data/products'
import { Blob, BrandHeading, Sparkle } from '../ui/Primitives'

const socialIcons = { Instagram, Facebook }

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
      <div className="absolute inset-0 grid place-items-center px-4 text-center font-black uppercase leading-none text-[#05222a]">
        {children}
      </div>
    </div>
  )
}

/** Scattered decorative marks behind the CTA block, positioned as on the live site. */
function CtaDecor() {
  return (
    <>
      {/* Cream wave lip along the top edge of the footer */}
      <svg
        className="absolute inset-x-0 top-0 h-10 w-full sm:h-12"
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
            <span className="text-3xl leading-none">{trio.packetCount}</span>
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
          <Link to="/combos" className="jni-btn mt-6 w-full">
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
      <div className="flex items-center gap-3">
        {column.socials.map(({ label, href }) => {
          const Icon = socialIcons[label]
          return (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="grid h-11 w-11 place-items-center rounded-full border-[3px] border-teal text-teal transition hover:-translate-y-0.5 hover:bg-teal hover:text-[#050D0B]"
            >
              <Icon size={18} />
            </a>
          )
        })}
      </div>
    )
  }
  return (
    <ul className="space-y-2.5">
      {column.links.map((link) => (
        <li key={link.label}>
          <Link
            to={link.to}
            className="inline-block text-sm font-bold text-white/85 transition hover:translate-x-1 hover:text-sunshine"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function SiteFooter() {
  const [openColumn, setOpenColumn] = useState(null)

  return (
    <footer className="bg-[#050D0B] text-white">
      <FooterCta />
      <FooterGallery />

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-12 lg:py-12">
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
                <h4 className="mb-4 text-xs font-black uppercase tracking-[0.14em] text-teal">
                  {column.title}
                </h4>
                <ColumnBody column={column} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-sunshine px-5 py-3 text-center text-xs font-black text-ink">
        © 2026 Just Nibble It. All Rights Reserved.
      </div>
    </footer>
  )
}
