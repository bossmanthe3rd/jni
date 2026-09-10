import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingCart, User, X } from 'lucide-react'
import { useCart } from '../../store/cartStore'
import { ticker, navLinks } from '../../data/site'
import { Wordmark } from '../icons/Wordmark'

/** The wavy three-line hamburger mark. */
function WavyMenuIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 32 24" fill="none" aria-hidden="true">
      {[5, 12, 19].map((y) => (
        <path
          key={y}
          d={`M2 ${y}c6-4 10 4 16 0s8 4 12 0`}
          stroke="#4DB8AE"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

export default function SiteHeader() {
  const [navOpen, setNavOpen] = useState(false)
  const navigate = useNavigate()
  const { toggleCart, getTotalQty } = useCart()
  const qty = getTotalQty()

  // The live site measures the header and publishes its height as
  // --site-header-offset, which every page uses for its top padding.
  useEffect(() => {
    const el = document.querySelector('[data-site-header]')
    if (!el) return
    const sync = () => {
      const h = Math.ceil(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--site-header-offset', `${h}px`)
    }
    sync()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null
    ro?.observe(el)
    window.addEventListener('resize', sync)
    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', sync)
    }
  }, [navOpen])

  return (
    <header data-site-header="true" className="fixed inset-x-0 top-0 z-50">
      {ticker.active !== false && (
        <Link
          to={ticker.link || '/combos'}
          className="flex h-7 items-center justify-center px-4 text-center text-[10px] font-black uppercase sm:text-xs"
          style={{ backgroundColor: ticker.backgroundColor, color: ticker.textColor }}
        >
          <span className="sm:hidden">{ticker.mobileText || ticker.text}</span>
          <span className="hidden sm:inline">{ticker.text}</span>
        </Link>
      )}

      <div
        data-intro-bar=""
        className="grid h-[4.5rem] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center bg-[#071A16] px-3 sm:h-[5rem] sm:px-6 lg:h-[5.5rem] lg:px-10"
      >
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center"
            aria-label="Toggle navigation"
            aria-expanded={navOpen}
          >
            {navOpen ? <X size={22} className="text-teal" /> : <WavyMenuIcon className="h-6 w-8" />}
          </button>
        </div>

        <Link aria-label="Just Nibble It home" className="justify-self-center" to="/">
          {/* The traced wordmark rather than the PNG: sharper, a third of the
              weight, and it lets the intro's hand-off land on exact geometry.
              data-intro-logo marks it as that landing target. */}
          <Wordmark
            data-intro-logo=""
            fill="var(--color-text-light, #fbf6d0)"
            className="h-12 w-auto shrink-0 sm:h-14 lg:h-16"
          />
        </Link>

        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            aria-label="Log in"
            title="Log in / Sign up"
            onClick={() => navigate('/account')}
            className="relative grid h-11 w-11 place-items-center text-teal transition hover:text-sunshine"
          >
            <User size={22} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="Open cart"
            title="Your cart"
            data-cart-icon="true"
            onClick={toggleCart}
            className="relative grid h-11 w-11 place-items-center text-teal transition hover:text-sunshine"
          >
            <ShoppingCart size={22} strokeWidth={1.8} />
            {qty > 0 && (
              <span className="absolute right-0.5 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-sunshine px-1 text-[10px] font-black text-ink">
                {qty}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {navOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="border-t-[3px] border-teal/30 bg-[#071A16] px-5 pb-6 pt-4 sm:px-8 lg:px-10"
          >
            <ul className="mx-auto flex max-w-6xl flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.hash ? `${link.to}#${link.hash}` : link.to}
                    onClick={() => setNavOpen(false)}
                    className="block py-2 font-brand text-2xl text-cream transition hover:text-sunshine"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
