/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          main: 'var(--bg-main)',
          sidebar: 'var(--bg-sidebar)',
          card: 'var(--bg-card)',
          subtle: 'var(--bg-subtle)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          label: 'var(--text-label)',
          muted: 'var(--text-muted)',
        },
        accent: {
          positive: 'var(--accent-positive)',
          negative: 'var(--accent-negative)',
          warning: 'var(--accent-warning)',
          primary: 'var(--accent-primary)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
        'section-sm': '2rem',
        'section-md': '3rem',
        'section-lg': '4rem',
      },
      fontSize: {
        'hero': ['4rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display': ['2.5rem', { lineHeight: '1.15', fontWeight: '700' }],
        'headline': ['1.75rem', { lineHeight: '1.25', fontWeight: '600' }],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        none: 'none',
      },
      letterSpacing: {
        widest: '0.15em',
      },
    },
  },
  plugins: [],
}
