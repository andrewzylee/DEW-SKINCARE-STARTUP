/** @type {import('tailwindcss').Config} */
// STACK design system (§6). Colors reference the CSS custom properties in
// src/styles/tokens.css so tokens stay the single source of truth.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          ink: 'rgb(var(--accent-ink) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
          bright: 'rgb(var(--accent-bright) / <alpha-value>)',
        },
        makeup: {
          DEFAULT: 'rgb(var(--makeup) / <alpha-value>)',
          ink: 'rgb(var(--makeup-ink) / <alpha-value>)',
          soft: 'rgb(var(--makeup-soft) / <alpha-value>)',
        },
        tier: {
          s: 'rgb(var(--tier-s) / <alpha-value>)',
          a: 'rgb(var(--tier-a) / <alpha-value>)',
          b: 'rgb(var(--tier-b) / <alpha-value>)',
          c: 'rgb(var(--tier-c) / <alpha-value>)',
          f: 'rgb(var(--tier-f) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Elegant high-contrast serif for the wordmark + display titles (premium skincare feel).
        display: ['"Cormorant Garamond"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '24px',
        xl2: '20px',
      },
      boxShadow: {
        // soft, warm, airy — cards read as gently lifted, not boxed (premium calm)
        card: '0 1px 2px rgba(46, 46, 46, 0.03), 0 10px 30px -14px rgba(46, 46, 46, 0.12)',
        pop: '0 18px 44px -14px rgba(46, 46, 46, 0.18)',
        tab: '0 -1px 0 0 rgb(var(--line))',
      },
      maxWidth: {
        app: '430px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
