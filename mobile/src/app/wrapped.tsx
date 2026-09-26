import { Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { ProductImage } from '@/components/ProductImage';
import { Text } from '@/components/Text';
import { categoryLabel, getProduct } from '@/core/catalog';
import { archetypeOf, rankedFromIds, tasteItemsFromIds } from '@/core/taste';
import { font, palette, radius, space } from '@/core/theme';
import type { Category } from '@/core/types';
import { useMyShelf } from '@/data/hooks';

export default function Wrapped() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { shelf } = useMyShelf();

  const archetype = archetypeOf(tasteItemsFromIds(shelf));
  const ranked = rankedFromIds(shelf);
  const top = ranked.find((r) => r.groupRank === 1) ?? ranked[0];
  const topProduct = top ? getProduct(top.productId) : undefined;
  const catCounts: Record<string, number> = {};
  ranked.forEach((r) => {
    catCounts[r.category] = (catCounts[r.category] ?? 0) + 1;
  });
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const year = new Date().getFullYear();

  // A dark wash (not a light one) under the cards keeps white text ≥4.5:1 on the moss.
  const cardBg = 'rgba(0,0,0,0.12)';
  // 92% white keeps secondary copy ≥4.5:1 on the moss background and on the cards.
  const sub = 'rgba(255,255,255,0.92)';

  return (
    <View style={{ flex: 1, backgroundColor: palette.accent }}>
      <View style={{ paddingTop: insets.top + space(3), paddingHorizontal: space(5), flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close"><X size={24} color={palette.white} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: insets.bottom + space(8), alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 480 }}>
          <Text accessibilityRole="header" style={{ fontSize: font.size.sm, fontWeight: '700', color: sub, textTransform: 'uppercase', letterSpacing: 2 }}>Your Beauty Wrapped</Text>
          <Text style={{ fontFamily: font.display, fontSize: font.size.display, fontWeight: '600', color: palette.white, marginTop: 2 }}>{year}</Text>

          <View style={{ marginTop: space(5), backgroundColor: cardBg, borderRadius: radius.lg, padding: space(5) }}>
            <Text style={{ fontFamily: font.display, fontSize: font.size.display, fontWeight: '600', color: palette.white }}>{shelf.length}</Text>
            <Text style={{ fontSize: font.size.base, color: sub, marginTop: 2 }}>products ranked this year</Text>
          </View>

          <View style={{ marginTop: space(3), flexDirection: 'row', gap: space(3) }}>
            <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: radius.lg, padding: space(4) }}>
              <Text style={{ fontSize: font.size.xs, fontWeight: '700', color: sub, textTransform: 'uppercase', letterSpacing: 1 }}>Your taste</Text>
              <Text style={{ fontSize: font.size.xl, fontWeight: '700', color: palette.white, marginTop: 4 }}>{archetype}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: radius.lg, padding: space(4) }}>
              <Text style={{ fontSize: font.size.xs, fontWeight: '700', color: sub, textTransform: 'uppercase', letterSpacing: 1 }}>Most ranked</Text>
              <Text style={{ fontSize: font.size.xl, fontWeight: '700', color: palette.white, marginTop: 4 }}>{topCat ? categoryLabel(topCat as Category) : '—'}</Text>
            </View>
          </View>

          {topProduct ? (
            <View style={{ marginTop: space(3), backgroundColor: cardBg, borderRadius: radius.lg, padding: space(4), flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <ProductImage id={topProduct.id} brand={topProduct.brand} image={topProduct.image} category={categoryLabel(topProduct.category)} width={64} height={64} radius={16} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: font.size.xs, fontWeight: '700', color: sub, textTransform: 'uppercase', letterSpacing: 1 }}>Your #1 of the year</Text>
                <Text style={{ fontSize: font.size.lg, fontWeight: '700', color: palette.white, marginTop: 3 }}>{topProduct.name}</Text>
                <Text style={{ fontSize: font.size.sm, color: sub }}>{topProduct.brand}</Text>
              </View>
            </View>
          ) : null}

          <Pressable
            onPress={() =>
              Share.share({
                message: `My Dew Wrapped: I'm a ${archetype}${topProduct ? `, and my #1 of the year is ${topProduct.brand} ${topProduct.name}` : ''}.`,
              }).catch(() => {})
            }
            accessibilityRole="button"
            style={({ pressed }) => ({ marginTop: space(6), alignSelf: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', paddingHorizontal: 20, paddingVertical: 11, opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ textAlign: 'center', fontSize: font.size.base, fontWeight: '700', color: palette.white }}>Share your Wrapped</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
