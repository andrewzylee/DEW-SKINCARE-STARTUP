import type { TextStyle } from 'react-native';

// Brand typefaces, bundled from @expo-google-fonts (SIL Open Font License 1.1 — the license texts
// sit next to the files in assets/fonts). Each key is the fontFamily name expo-font registers, so a
// name only resolves once useFonts(FONT_FILES) in app/_layout.tsx has finished loading.
//
// Only the faces the UI actually uses are bundled: Inter 400/500/600/700 + 400 italic for body copy,
// and Cormorant Garamond 600 for display titles (the web reference sets every display title in its
// semibold). Add a file here before styling text with a new weight — heavier weights snap to 700.
export const FONT_FILES = {
  Inter_400Regular: require('../../assets/fonts/Inter_400Regular.ttf'),
  Inter_400Regular_Italic: require('../../assets/fonts/Inter_400Regular_Italic.ttf'),
  Inter_500Medium: require('../../assets/fonts/Inter_500Medium.ttf'),
  Inter_600SemiBold: require('../../assets/fonts/Inter_600SemiBold.ttf'),
  Inter_700Bold: require('../../assets/fonts/Inter_700Bold.ttf'),
  CormorantGaramond_600SemiBold: require('../../assets/fonts/CormorantGaramond_600SemiBold.ttf'),
} as const;

export type FontFamilyRole = 'body' | 'display';

const NAMED_WEIGHTS: Record<string, number> = {
  normal: 400,
  regular: 400,
  bold: 700,
  ultralight: 100,
  thin: 100,
  light: 300,
  medium: 500,
  semibold: 600,
  condensed: 400,
  condensedBold: 700,
  heavy: 800,
  black: 900,
};

export function numericWeight(weight: TextStyle['fontWeight']): number {
  if (weight == null) return 400;
  if (typeof weight === 'number') return weight;
  const n = Number(weight);
  return Number.isFinite(n) ? n : NAMED_WEIGHTS[weight] ?? 400;
}

const INTER: Record<number, keyof typeof FONT_FILES> = {
  400: 'Inter_400Regular',
  500: 'Inter_500Medium',
  600: 'Inter_600SemiBold',
  700: 'Inter_700Bold',
};

/**
 * The bundled face for a role + weight. expo-font registers every file as its own family, so a
 * fontWeight/fontStyle on top of one can't pick a different face (iOS ignores it; Android falls back
 * to the system font for bold/italic) — each weight has to be named explicitly. Weights snap to the
 * nearest bundled face; any italic body text uses Inter 400 Italic, the only italic shipped.
 */
export function brandFontFor(role: FontFamilyRole, weight: TextStyle['fontWeight'], italic: boolean): keyof typeof FONT_FILES {
  if (role === 'display') return 'CormorantGaramond_600SemiBold';
  if (italic) return 'Inter_400Regular_Italic';
  const w = numericWeight(weight);
  const snapped = w <= 400 ? 400 : w >= 700 ? 700 : Math.round(w / 100) * 100;
  return INTER[snapped];
}
