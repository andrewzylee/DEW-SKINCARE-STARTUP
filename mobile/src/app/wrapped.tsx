import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { ProductImage } from '@/components/ProductImage';
import { categoryLabel, getProduct } from '@/core/catalog';
import { archetypeOf, rankedFromIds, tasteItemsFromIds } from '@/core/taste';
import { palette, radius, space } from '@/core/theme';
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

  const cardBg = 'rgba(255,255,255,0.14)';
  const sub = 'rgba(255,255,255,0.8)';

  return (
    <View style={{ flex: 1, backgroundColor: palette.accent }}>
      <View style={{ paddingTop: insets.top + space(3), paddingHorizontal: space(5), flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => router.back()} hitSlop={10}><X size={24} color="rgba(255,255,255,0.9)" /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: insets.bottom + space(8), alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 480 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: sub, textTransform: 'uppercase', letterSpacing: 2 }}>Your Beauty Wrapped</Text>
          <Text style={{ fontSize: 46, fontWeight: '800', color: palette.white, marginTop: 2, letterSpacing: -1 }}>{year}</Text>

          <View style={{ marginTop: space(5), backgroundColor: cardBg, borderRadius: radius.lg, padding: space(5) }}>
            <Text style={{ fontSize: 52, fontWeight: '800', color: palette.white }}>{shelf.length}</Text>
            <Text style={{ fontSize: 15, color: sub, marginTop: 2 }}>products ranked this year</Text>
          </View>

          <View style={{ marginTop: space(3), flexDirection: 'row', gap: space(3) }}>
            <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: radius.lg, padding: space(4) }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: sub, textTransform: 'uppercase', letterSpacing: 1 }}>Your taste</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: palette.white, marginTop: 4 }}>{archetype}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: radius.lg, padding: space(4) }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: sub, textTransform: 'uppercase', letterSpacing: 1 }}>Most ranked</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: palette.white, marginTop: 4 }}>{topCat ? categoryLabel(topCat as Category) : '—'}</Text>
            </View>
          </View>

          {topProduct ? (
            <View style={{ marginTop: space(3), backgroundColor: cardBg, borderRadius: radius.lg, padding: space(4), flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <ProductImage id={topProduct.id} brand={topProduct.brand} image={topProduct.image} category={categoryLabel(topProduct.category)} width={64} height={64} radius={16} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: sub, textTransform: 'uppercase', letterSpacing: 1 }}>Your #1 of the year</Text>
                <Text style={{ fontSize: 17, fontWeight: '800', color: palette.white, marginTop: 3 }}>{topProduct.name}</Text>
                <Text style={{ fontSize: 13, color: sub }}>{topProduct.brand}</Text>
              </View>
            </View>
          ) : null}

          <Text style={{ marginTop: space(6), textAlign: 'center', fontSize: 13, color: sub }}>Tap to share your Wrapped (coming soon).</Text>
        </View>
      </ScrollView>
    </View>
  );
}
