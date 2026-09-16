import { Pressable, Text } from 'react-native';
import { ProductImage } from './ProductImage';
import { categoryLabel } from '@/core/catalog';
import { palette, radius } from '@/core/theme';
import type { Product } from '@/core/types';

export function CompareCard({ product, onChoose }: { product: Product; onChoose: () => void }) {
  return (
    <Pressable
      onPress={onChoose}
      style={({ pressed }) => ({ flex: 1, backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.line, padding: 14, alignItems: 'center', opacity: pressed ? 0.9 : 1 })}
    >
      <ProductImage id={product.id} brand={product.brand} image={product.image} category={categoryLabel(product.category)} width={120} height={140} radius={14} />
      <Text style={{ marginTop: 10, fontSize: 15, fontWeight: '700', color: palette.ink, textAlign: 'center' }} numberOfLines={2}>{product.name}</Text>
      <Text style={{ marginTop: 2, fontSize: 12.5, color: palette.muted }}>{product.brand}</Text>
    </Pressable>
  );
}
