import { Pressable } from 'react-native';
import { ProductImage } from './ProductImage';
import { Text } from '@/components/Text';
import { categoryLabel } from '@/core/catalog';
import { font, palette, radius } from '@/core/theme';
import type { Product } from '@/core/types';

export function CompareCard({ product, onChoose }: { product: Product; onChoose: () => void }) {
  return (
    <Pressable
      onPress={onChoose}
      accessibilityRole="button"
      accessibilityLabel={`${product.name} by ${product.brand}`}
      accessibilityHint="Picks this one"
      style={({ pressed }) => ({ flex: 1, backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.line, padding: 14, alignItems: 'center', opacity: pressed ? 0.9 : 1 })}
    >
      <ProductImage id={product.id} brand={product.brand} image={product.image} category={categoryLabel(product.category)} width={120} height={140} radius={14} />
      <Text style={{ marginTop: 10, fontSize: font.size.base, fontWeight: '700', color: palette.ink, textAlign: 'center' }} numberOfLines={2}>{product.name}</Text>
      <Text style={{ marginTop: 2, fontSize: font.size.sm, color: palette.muted }}>{product.brand}</Text>
    </Pressable>
  );
}
