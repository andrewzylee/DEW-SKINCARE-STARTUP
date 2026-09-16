import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { ProductImage } from '@/components/ProductImage';
import { categoryLabel, getProduct } from '@/core/catalog';
import { featuredLists } from '@/core/discovery';
import { palette, space } from '@/core/theme';
import type { Product } from '@/core/types';

export default function ListDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const list = featuredLists.find((l) => l.id === id);

  if (!list) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: space(5) }}>
        <Text style={{ color: palette.muted }}>List not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: space(3) }}><Text style={{ color: palette.accent, fontWeight: '700' }}>Go back</Text></Pressable>
      </View>
    );
  }

  const products = list.productIds.map(getProduct).filter((p): p is Product => !!p);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space(8), alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 520, paddingHorizontal: space(5), paddingTop: insets.top + space(3) }}>
          <Pressable onPress={() => router.back()} hitSlop={10}><ArrowLeft size={22} color={palette.ink} /></Pressable>

          <View style={{ marginTop: space(3), borderRadius: 20, backgroundColor: list.tint, padding: space(5) }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: palette.white }}>{list.title}</Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>{list.subtitle} · {products.length} products</Text>
          </View>

          <Text style={{ marginTop: space(4), fontSize: 14.5, lineHeight: 21, color: palette.ink }}>{list.blurb}</Text>

          <View style={{ marginTop: space(5), gap: 8 }}>
            {products.map((p) => (
              <Pressable key={p.id} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 16, padding: 10, borderWidth: 1, borderColor: palette.line }}>
                <ProductImage id={p.id} brand={p.brand} image={p.image} category={categoryLabel(p.category)} width={52} height={52} radius={14} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 12.5, color: palette.muted }}>{p.brand} · {categoryLabel(p.category)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
