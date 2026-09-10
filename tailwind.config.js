/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: 'var(--color-bg-cream)',
        ink: 'var(--color-text-dark)',
        teal: 'var(--color-accent-teal)',
        sunshine: 'var(--color-accent-yellow)',
        jalapeno: 'var(--color-flavor-jalapeno)',
        sweetchilli: 'var(--color-flavor-sweetchilli)',
        peripiri: 'var(--color-flavor-peripiri)',
        forest: 'var(--color-bg-dark)',
        foam: 'var(--color-text-light)',
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
      fontFamily: {
        brand: ['Lilita One', 'Fredoka', 'system-ui', 'sans-serif'],
        display: ['Milkyway', 'Lilita One', 'Fredoka', 'Nunito', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
