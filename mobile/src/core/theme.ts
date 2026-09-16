// Dew design tokens — ported verbatim from the reference web app (src/styles/tokens.css) so the
// native app matches the canonical look. Kept as a plain typed object (no NativeWind) for maximum
// reliability on the current Expo SDK.
export const palette = {
  bg: '#F7F6F2', // warm cream canvas
  surface: '#FFFFFF', // soft-white cards
  ink: '#2E2E2E', // muted charcoal (primary text)
  muted: '#8C9184', // soft sage-gray (metadata — the ONE muted gray)
  line: '#E9E7DF', // warm hairline borders

  accent: '#6E7D5F', // deep moss — primary actions (white text ok)
  accentInk: '#55634A', // moss text on light
  accentSoft: '#E7EFE6', // pale sage — tints / pills
  accentBright: '#A8B89C', // soft moss highlight

  makeup: '#C27C60', // muted terracotta / clay
  makeupInk: '#A66248',
  makeupSoft: '#F4E9E2',

  tierS: '#C1A05C', // soft ochre gold
  tierA: '#7E9A6E', // sage green
  tierB: '#7C93B0', // muted slate blue
  tierF: '#C27B63', // muted terracotta
  white: '#FFFFFF',
} as const;

export type ColorName = keyof typeof palette;

// 4px spacing rhythm (space(5) = 20 = the reference's screen padding).
export const space = (n: number): number => n * 4;

export const radius = { sm: 12, md: 16, lg: 20, xl: 22, pill: 999 } as const;

export const font = {
  // System stack for now; the reference's Cormorant/Inter get wired via expo-font in a later step.
  display: undefined as string | undefined,
  size: { xs: 11.5, sm: 12.5, base: 15, lg: 17, xl: 20, hero: 30, display: 40 },
} as const;

export const theme = { color: palette, space, radius, font } as const;
