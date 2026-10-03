import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import { footerColumns, legalBusinessDetails } from '../../data/site'
import DoodleField from '../ui/DoodleField'
import { responsiveImage } from '../../lib/responsiveImage'

const socialIcons = { Instagram, Facebook }
const SOCIAL_BG = { Instagram: 'bg-[#E1306C]', Facebook: 'bg-[#1877F2]' }
const SOCIAL_FG = { Instagram: 'text-[#E1306C]', Facebook: 'text-[#1877F2]' }

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
              <p className="text-xs font-black uppercase tracking-[0.14em] text-teal">
                {label}
              </p>
              {items.map((item) => (
                <p key={item.text} className="text-sm font-bold leading-6 text-white/75">
                  {item.href ? (
                    // 44px tall rows: these are the tap-to-call and tap-to-mail
                    // links, and they were 19px lines stacked 4px apart.
                    <a href={item.href} className="inline-flex min-h-[44px] items-center transition hover:text-sunshine">
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
      <div className="relative isolate">
        {/* The flattest surface on the site: six columns of links on near-black.
            Subtle, because everything on top of it is something to read. */}
        <DoodleField
          flavour="jalapeno-kick"
          ground="#050D0B"
          intensity="subtle"
          count={20}
          seed={41}
        />
        {/* Cream wave lip along the top edge of the footer: the page's cream
            runs on into it and ends in the curve. A page whose last section
            cuts its own edge into the footer hides this (pdp.css). */}
        <svg
          className="jni-footer-lip absolute inset-x-0 top-0 h-10 w-full sm:h-12"
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="#FBF6D0"
            d="M0 0 L1440 0 L1440 48 C 1280 18 1120 76 960 42 C 800 8 640 76 480 38 C 320 0 180 90 0 40 Z"
          />
        </svg>
        <div className="relative mx-auto max-w-6xl px-5 pb-6 pt-16 sm:px-8 sm:pt-20 lg:px-12 lg:pb-12 lg:pt-24">
          {/* The arched lockup, from the brand folder's `curvee logo`. The
              header wears the stacked one; this is the wide cut, and the
              footer is the only place on the site with the width to carry it. */}
          <img
            {...responsiveImage('/assets/brand/wordmark-arched.webp', '(min-width: 1024px) 576px, min(448px, calc(100vw - 40px))')}
            alt="Just Nibble It"
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
