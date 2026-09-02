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
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '24px',
        xl2: '20px',
      },
      boxShadow: {
        // clean, cool, low-opacity — cards read as lifted, not boxed
        card: '0 1px 2px rgba(16, 18, 24, 0.04), 0 6px 20px -10px rgba(16, 18, 24, 0.10)',
        pop: '0 10px 34px -8px rgba(16, 18, 24, 0.16)',
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
