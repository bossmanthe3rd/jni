import { useEffect, useRef, useState } from 'react'

// Resolved from the live bundle's minified constants
const INK = '#071A16'
const TEAL = '#4DB8AE'
export const CORAL = '#E85D4C'

/**
 * The outlined display heading used for every section title.
 * Matches the live site's `bubble-title` + inline `--bubble-stroke` pattern.
 */
export function BrandHeading({
  as: Tag = 'h2',
  children,
  fill = TEAL,
  stroke = INK,
  className = '',
}) {
  return (
    <Tag className={`bubble-title ${className}`} style={{ color: fill, '--bubble-stroke': stroke }}>
      {children}
    </Tag>
  )
}

/** 8-point star used either side of section headings. Star colour by default. */
export function Sparkle({ className = '', color = 'var(--color-star)' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      style={{ fill: color, stroke: 'var(--color-star-line)' }}
      strokeWidth="2.4"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M24 2l3.2 12.4L38 8.5 30.4 18 46 22 30.4 26 38 35.5 27.2 29.6 24 46 20.8 29.6 10 35.5 17.6 26 2 22 17.6 18 10 8.5 20.8 14.4Z" />
    </svg>
  )
}

/** The organic wavy divider between cream and dark sections. */
export function WaveDivider({ fill = INK, className = '', flip = false }) {
  return (
    <svg className={className} viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
      <path
        fill={fill}
        transform={flip ? 'scale(1,-1) translate(0,-90)' : undefined}
        d="M0 40 C 180 90 320 0 480 38 C 640 76 800 8 960 42 C 1120 76 1280 18 1440 48 L1440 90 L0 90 Z"
      />
    </svg>
  )
}

/** Blob doodle used as a scattered background accent. */
export function Blob({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill={TEAL}
      stroke={INK}
      strokeWidth="3"
      aria-hidden="true"
    >
      <path d="M18 12c8-8 28-6 34 8 6 14-2 30-16 36-14 6-28-2-32-16-3-12 6-22 14-28Z" />
    </svg>
  )
}

/**
 * Image with the shimmering skeleton placeholder the live site uses.
 *
 * The image starts at opacity 0 and is revealed by `onLoad`, which silently
 * loses a race: an image served from cache can finish decoding before React has
 * attached the handler, so `load` fires with nothing listening and the picture
 * stays invisible behind the skeleton forever. That is not a rare edge -- it is
 * the second page view, and it is what a reviewer sees when they refresh. The
 * `complete` check below closes it: on mount and on every `src` change the
 * element is asked directly whether it already has pixels, instead of waiting
 * for an event that may already have gone.
 */
export function SmartImage({ src, alt, className = '', wrapperClassName = '', ...rest }) {
  const imgRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = imgRef.current
    // naturalWidth guards the broken-image case, where `complete` is also true.
    setLoaded(Boolean(el && el.complete && el.naturalWidth > 0))
  }, [src])

  return (
    <span className={`relative block h-full w-full ${wrapperClassName}`}>
      {!loaded && <span className="img-skeleton absolute inset-0 block" aria-hidden="true" />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        {...rest}
      />
    </span>
  )
}

/*
 * The ::after pad takes each button's tap area to 44px without making the pill
 * any bigger -- in the cart drawer the old 20px buttons sat right next to
 * Remove, and a thumb aimed at "−" could land on either.
 */
const stepBtn =
  'relative grid place-items-center rounded-full font-black leading-none text-ink transition after:absolute after:content-[""] hover:bg-ink/10'

/** Bordered −/+ quantity stepper. */
export function QtyStepper({ qty, onChange, className = '', size = 'md' }) {
  const small = size === 'sm'
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-pill border-[2px] border-ink bg-cream ${
        small ? 'p-0.5' : 'p-1'
      } ${className}`}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, qty - 1))}
        className={`${stepBtn} ${small ? 'h-8 w-8 text-sm after:-inset-1.5' : 'h-9 w-9 text-base after:-inset-1'}`}
      >
        &#8722;
      </button>
      <span
        className={`min-w-[1.5rem] text-center font-black text-ink ${small ? 'text-sm' : 'text-base'}`}
        aria-live="polite"
      >
        {qty}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(qty + 1)}
        className={`${stepBtn} ${small ? 'h-8 w-8 text-sm after:-inset-1.5' : 'h-9 w-9 text-base after:-inset-1'}`}
      >
        +
      </button>
    </div>
  )
}

/**
 * Star rating row: the one rating star on the site. Filled stars take the star
 * colour, and every star -- filled or not -- carries the ink keyline, so the
 * row reads on the cream wall and on a flavour's red alike. Colour goes in as
 * style, not as attributes: SVG presentation attributes do not resolve var().
 */
export function Stars({ value = 5, className = '', size = 12 }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          style={{
            fill: i < Math.round(value) ? 'var(--color-star)' : 'none',
            stroke: 'var(--color-star-line)',
          }}
          strokeWidth="1.8"
          strokeLinejoin="round"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  )
}

/** Matches the live site's `useMediaQuery` hook. */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}
