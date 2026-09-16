import { Image, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { palette } from '@/core/theme';
import { localProductImage } from '@/core/productImages';

// A product's photo, or a polished per-product monogram tile when there's no image yet — ported
// from the web reference's placeholder (stable tint by id + brand initials + category label).
const STOP = new Set(['the', 'of', 'and']);
function initials(brand: string): string {
  const words = brand.replace(/[^a-zA-Z\s-]/g, ' ').split(/[\s-]+/).filter(Boolean);
  const meaningful = words.filter((w) => !STOP.has(w.toLowerCase()));
  const use = meaningful.length ? meaningful : words;
  if (use.length === 1) return use[0].slice(0, 2).toUpperCase();
  return (use[0][0] + use[1][0]).toUpperCase();
}
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
const TILES = [
  { bg: '#E8EFE9', ink: '#566E5E' },
  { bg: '#F5EAE1', ink: '#96654F' },
  { bg: '#F1ECE2', ink: '#847354' },
  { bg: '#ECEBE8', ink: '#6B685F' },
  { bg: '#F0E7E7', ink: '#876666' },
  { bg: '#E7EDF1', ink: '#5B6D77' },
  { bg: '#EDEAF0', ink: '#6C6379' },
] as const;

export function ProductImage({
  id,
  brand,
  image,
  category,
  width = 56,
  height = 56,
  radius = 16,
  style,
}: {
  id: string;
  brand: string;
  image?: string;
  category?: string;
  width?: number;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const base = { width, height, borderRadius: radius, borderWidth: 1, borderColor: palette.line, overflow: 'hidden' as const };
  // Prefer a bundled local photo (ported from the web demo), then a remote URL, then the monogram.
  const source = localProductImage(id) ?? (image ? { uri: image } : undefined);
  if (source) {
    return (
      <View style={[base, { backgroundColor: palette.white }, style]}>
        <Image source={source} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
      </View>
    );
  }
  const tile = TILES[hash(id || brand) % TILES.length];
  const min = Math.min(width, height);
  const showLabel = min >= 56 && !!category;
  return (
    <View style={[base, { backgroundColor: tile.bg, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ color: tile.ink, fontWeight: '700', fontSize: min * 0.26 }}>{initials(brand)}</Text>
      {showLabel ? (
        <Text
          numberOfLines={1}
          style={{ marginTop: 2, color: tile.ink, opacity: 0.72, fontSize: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, maxWidth: '86%' }}
        >
          {category}
        </Text>
      ) : null}
    </View>
  );
}
