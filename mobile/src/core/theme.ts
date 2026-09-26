// Dew design tokens. Started as a port of the web reference (src/styles/tokens.css); the text
// colors have since been darkened so every text pairing clears WCAG AA (4.5:1) on the cream
// canvas, white cards and the grey pill tints. Ratios are noted beside each value — re-check
// them (https://webaim.org/resources/contrastchecker/) before changing a color.
// Kept as a plain typed object (no NativeWind) for maximum reliability on the current Expo SDK.
export const palette = {
  bg: '#F7F6F2', // warm cream canvas
  surface: '#FFFFFF', // soft-white cards
  ink: '#2E2E2E', // muted charcoal (primary text) — 12.6:1 on cream
  muted: '#676C5F', // sage-gray secondary text — 5.0:1 cream, 5.4:1 white, ≥4.5:1 on grey pills (was #8C9184, 3.0:1)
  line: '#E9E7DF', // warm hairline borders — decorative dividers only, never text

  accent: '#627153', // deep moss — primary actions; white on it 5.2:1, as text on cream 4.9:1 (was #6E7D5F, 4.4:1)
  accentInk: '#55634A', // moss text on accentSoft — 5.5:1
  accentSoft: '#E7EFE6', // pale sage — tints / pills
  accentBright: '#A8B89C', // soft moss highlight — fills and progress bars only, never text

  makeup: '#C27C60', // muted terracotta / clay — icons and fills; too light for text or white-on (3.3:1)
  makeupInk: '#955841', // clay text, or a clay background under white text — 4.7:1 on makeupSoft, 5.6:1 white-on
  makeupSoft: '#F4E9E2',

  danger: '#A8432F', // errors + destructive actions — 5.5:1 on cream, 6.0:1 white-on

  // Tier colors are for rings, fills and icons. Tier-colored TEXT uses the *Ink variant (≥4.6:1 on
  // cream and white) — the base tier colors only reach 2.3–3.3:1 on light backgrounds.
  tierS: '#C1A05C', // soft ochre gold
  tierSInk: '#816B3E',
  tierA: '#7E9A6E', // sage green
  tierAInk: '#607554',
  tierB: '#7C93B0', // muted slate blue
  tierBInk: '#5E7086',
  tierC: '#B79C7E', // muted tan (no --tier-c token in the reference)
  tierCInk: '#7E6C57',
  tierF: '#C27B63', // muted terracotta
  tierFInk: '#99614E',
  white: '#FFFFFF',
} as const;

export type ColorName = keyof typeof palette;

// 4px spacing rhythm (space(5) = 20 = the reference's screen padding).
export const space = (n: number): number => n * 4;

export const radius = { sm: 12, md: 16, lg: 20, xl: 22, pill: 999 } as const;

// Type scale — the only font sizes the app uses. Body copy is Inter (xs–xl). The three large steps
// are for the Cormorant Garamond display face (`fontFamily: font.display`): its small x-height
// needs the extra size to read at the same visual weight as Inter.
//   xs 12  captions, timestamps, tags, badges      lg 17  card titles, buttons, nav titles
//   sm 13  metadata, secondary lines, eyebrows     xl 20  stats, sans headings
//   base 15 body, list rows, inputs                title 26 / hero 32 / display 44  (display face)
// components/Text resolves `font.body` to the Inter file for each weight and `font.display` to
// Cormorant Garamond SemiBold (the only display face bundled), so always import Text/TextInput
// from there, not from react-native.
export const font = {
  body: 'body',
  display: 'display',
  size: { xs: 12, sm: 13, base: 15, lg: 17, xl: 20, title: 26, hero: 32, display: 44 },
} as const;

export type FontSize = keyof typeof font.size;

// Emoji are artwork, not text, so they sit outside the type scale (sized like an icon).
export const EMOJI_SIZE = 24;

// Minimum touch target (Apple HIG 44pt / Material 48dp). For a small icon button, pass its icon size:
// hitSlopFor(20) → 12 on every side → a 44×44 target without changing the layout.
export const MIN_TOUCH = 44;
export const hitSlopFor = (visibleSize: number): number => Math.max(0, Math.ceil((MIN_TOUCH - visibleSize) / 2));

// Text color for an arbitrary fill (data colors like the skin-rating scale): ink or white, whichever
// contrasts more with that background.
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
export function readableOn(background: string): string {
  const bg = luminance(background);
  return contrast(bg, luminance(palette.ink)) >= contrast(bg, 1) ? palette.ink : palette.white;
}

export const theme = { color: palette, space, radius, font } as const;
