import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { ProductImage } from '@/components/ProductImage';
import { categoryLabel, getProduct } from '@/core/catalog';
import { tierColor } from '@/core/ranking';
import { friendShelves, getPerson, myShelf } from '@/core/social';
import { friendRankedShelf, tasteItemsFromIds, tasteMatchWithFriend } from '@/core/taste';
import { palette, space } from '@/core/theme';

const myTaste = tasteItemsFromIds(myShelf);
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export default function PersonProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const person = id ? getPerson(id) : undefined;

  if (!person) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: space(5) }}>
        <Text style={{ color: palette.muted }}>Profile not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: space(3) }}><Text style={{ color: palette.accent, fontWeight: '700' }}>Go back</Text></Pressable>
      </View>
    );
  }

  const match = tasteMatchWithFriend(myTaste, person.id).score;
  const ranked = friendRankedShelf(person.id);
  const rankMap = new Map(ranked.map((r) => [r.productId, r] as const));
  const ids = friendShelves[person.id] ?? [];
  const chips = [person.skinType ? `${cap(person.skinType)} skin` : null, cap(person.tone), cap(person.undertone)].filter(Boolean) as string[];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space(8), alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 520, paddingHorizontal: space(5), paddingTop: insets.top + space(3) }}>
          <Pressable onPress={() => router.back()} hitSlop={10}><ArrowLeft size={22} color={palette.ink} /></Pressable>

          <View style={{ alignItems: 'center', marginTop: space(3) }}>
            <Avatar name={person.name} tint={person.tint} size={92} />
            <Text style={{ marginTop: space(3), fontSize: 22, fontWeight: '800', color: palette.ink }}>{person.name}</Text>
            <Text style={{ fontSize: 14, color: palette.muted }}>@{person.handle}</Text>
            {person.bio ? <Text style={{ marginTop: space(2), fontSize: 14, color: palette.ink, textAlign: 'center' }}>{person.bio}</Text> : null}
            <View style={{ marginTop: space(2), flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {chips.map((c) => (
                <View key={c} style={{ borderRadius: 999, backgroundColor: 'rgba(46,46,46,0.05)', paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ fontSize: 11.5, fontWeight: '600', color: palette.muted }}>{c}</Text>
                </View>
              ))}
            </View>
            <View style={{ marginTop: space(3), flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.accentSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: palette.accentInk }}>{match}% taste match</Text>
            </View>
          </View>

          <Text style={{ marginTop: space(6), fontSize: 13, fontWeight: '800', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>{person.name.split(' ')[0]}'s shelf</Text>
          <View style={{ marginTop: space(2), gap: 8 }}>
            {ids.map((pid) => {
              const p = getProduct(pid);
              const r = rankMap.get(pid);
              if (!p || !r) return null;
              return (
                <Pressable key={pid} onPress={() => router.push({ pathname: '/product/[id]', params: { id: pid } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: palette.surface, borderRadius: 16, padding: 10, borderWidth: 1, borderColor: palette.line }}>
                  <Text style={{ width: 30, textAlign: 'center', fontSize: 20, fontWeight: '800', color: tierColor(r.tier) }}>{r.groupRank}</Text>
                  <ProductImage id={p.id} brand={p.brand} image={p.image} category={categoryLabel(p.category)} width={44} height={44} radius={12} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
                    <Text style={{ fontSize: 12, color: palette.muted }}>#{r.groupRank} of {r.groupSize} · {categoryLabel(p.category)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
