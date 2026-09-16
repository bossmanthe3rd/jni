/**
 * A palette entry that honours Tailwind's opacity modifier.
 * `<alpha-value>` is substituted by Tailwind: the modifier when one is given,
 * otherwise 1.
 */
const withAlpha = (varName) =>
  `color-mix(in srgb, var(${varName}) calc(<alpha-value> * 100%), transparent)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      // Everything below `xs` is a narrow phone, where the section headings
      // already fill the width and their flanking confetti has nowhere to go.
      xs: '420px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      // Wrapped in color-mix so the opacity modifier works.
      //
      // These were plain `var(--x)`. Tailwind cannot decompose a bare var into
      // channels, so it silently emitted NO RULE for every `/nn` variant -- 51
      // of them across the app. The visible symptom was the /combos hero, whose
      // three scrims were all fully transparent, leaving the headline sitting
      // unreadable on the pack photography.
      //
      // color-mix keeps the hex custom properties as the single source of truth
      // (so `var(--color-bg-dark)` used directly in index.css still works) while
      // giving Tailwind something it can apply <alpha-value> to. With no
      // modifier the alpha resolves to 1 and the colour is unchanged.
      colors: {
        cream: withAlpha('--color-bg-cream'),
        ink: withAlpha('--color-text-dark'),
        teal: withAlpha('--color-accent-teal'),
        sunshine: withAlpha('--color-accent-yellow'),
        jalapeno: withAlpha('--color-flavor-jalapeno'),
        sweetchilli: withAlpha('--color-flavor-sweetchilli'),
        peripiri: withAlpha('--color-flavor-peripiri'),
        forest: withAlpha('--color-bg-dark'),
        foam: withAlpha('--color-text-light'),
      },
      borderRadius: {
        pill: '999px',
        card: 'var(--border-radius-card)',
      },
      boxShadow: {
        doodle: '4px 4px 0 var(--color-border)',
        'doodle-lg': '6px 6px 0 var(--color-border)',
      },
      borderWidth: {
        thick: 'var(--border-width-thick)',
      },
      borderColor: {
        outline: 'var(--color-border)',
      },
      // Driven by the same custom properties the live site uses, so the stacks
      // cannot drift apart. `sans` is the body face -- the live site sets it to
      // ComicSansMS3, not Inter.
      fontFamily: {
        brand: 'var(--font-brand)',
        display: 'var(--font-brand)',
        sans: 'var(--font-body)',
      },
    },
  },
  plugins: [],
}
