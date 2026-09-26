import { createContext, useContext, type ReactNode } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { brandFontFor, type FontFamilyRole } from '@/core/fonts';
import { font } from '@/core/theme';

// Drop-in replacements for React Native's Text and TextInput that apply Dew's typefaces.
//
// Styles keep using fontWeight / fontStyle as usual; set `fontFamily: font.display` for display
// titles. Because every weight is a separate font file, these components translate the weight into
// the right family — and pass what they resolved down through context, so a nested
// <Text style={{ color }}> inside a bold <Text> stays bold the way plain RN text inheritance would.
// Until the fonts have loaded (or if they fail to), text renders in the system font.

const BrandFontsContext = createContext(false);

export function BrandFontsProvider({ ready, children }: { ready: boolean; children: ReactNode }) {
  return <BrandFontsContext.Provider value={ready}>{children}</BrandFontsContext.Provider>;
}

interface Inherited {
  role: FontFamilyRole;
  weight: TextStyle['fontWeight'];
  italic: boolean;
  // A real font family set explicitly by an ancestor; descendants inherit it natively, untouched.
  customFamily?: string;
}
const InheritedTextContext = createContext<Inherited>({ role: 'body', weight: '400', italic: false });

const roleOf = (family: TextStyle['fontFamily']): FontFamilyRole | null =>
  family === font.display ? 'display' : family === font.body ? 'body' : null;

// The resolved face, plus the overrides that stop the platform from second-guessing it: expo-font
// registers each file as its own family, so a fontWeight/fontStyle on top can't select another face
// (iOS ignores it; Android falls back to the system font for bold/italic).
function faceStyle(role: FontFamilyRole, weight: TextStyle['fontWeight'], italic: boolean): TextStyle {
  return { fontFamily: brandFontFor(role, weight, italic), fontWeight: 'normal', fontStyle: 'normal' };
}

function withoutRoleName(flat: TextStyle): TextStyle {
  const systemStyle: TextStyle = { ...flat };
  delete systemStyle.fontFamily;
  return systemStyle;
}

export function Text({ style, children, ...rest }: TextProps) {
  const ready = useContext(BrandFontsContext);
  const parent = useContext(InheritedTextContext);
  const flat: TextStyle = StyleSheet.flatten(style) ?? {};
  const explicitRole = roleOf(flat.fontFamily);

  // An explicit, real font family (not one of the theme's roles) is left untouched — and so are
  // descendants that don't set their own family, which inherit it natively.
  const customFamily = flat.fontFamily && !explicitRole ? flat.fontFamily : !flat.fontFamily ? parent.customFamily : undefined;

  const inherited: Inherited = {
    role: explicitRole ?? parent.role,
    weight: flat.fontWeight ?? parent.weight,
    italic: flat.fontStyle ? flat.fontStyle === 'italic' : parent.italic,
    customFamily,
  };

  let finalStyle: TextProps['style'];
  if (customFamily) {
    finalStyle = style;
  } else if (ready) {
    const resolved = faceStyle(inherited.role, inherited.weight, inherited.italic);
    // Cormorant's default figures are old-style (3, 5, 7, 9 drop below the baseline) — use lining
    // figures so ranks and counts read cleanly.
    if (inherited.role === 'display' && !flat.fontVariant) resolved.fontVariant = ['lining-nums'];
    finalStyle = [style, resolved];
  } else {
    // System-font fallback: drop the role name so the platform doesn't look for a font called "display".
    finalStyle = explicitRole ? withoutRoleName(flat) : style;
  }

  return (
    <InheritedTextContext.Provider value={inherited}>
      <RNText {...rest} style={finalStyle}>
        {children}
      </RNText>
    </InheritedTextContext.Provider>
  );
}

export function TextInput({ style, ...rest }: TextInputProps) {
  const ready = useContext(BrandFontsContext);
  const flat: TextStyle = StyleSheet.flatten(style) ?? {};
  const explicitRole = roleOf(flat.fontFamily);

  let finalStyle: TextInputProps['style'];
  if (flat.fontFamily && !explicitRole) {
    finalStyle = style;
  } else if (ready) {
    finalStyle = [style, faceStyle(explicitRole ?? 'body', flat.fontWeight, flat.fontStyle === 'italic')];
  } else {
    finalStyle = explicitRole ? withoutRoleName(flat) : style;
  }
  return <RNTextInput {...rest} style={finalStyle} />;
}
