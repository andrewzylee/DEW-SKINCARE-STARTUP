import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { ProductImage } from '@/components/ProductImage';
import { Text } from '@/components/Text';
import { categoryLabel, getProduct } from '@/core/catalog';
import { tierInk } from '@/core/ranking';
import { friendShelves, getPerson, myShelf } from '@/core/socialSource';
import { friendRankedShelf, tasteItemsFromIds, tasteMatchWithFriend } from '@/core/taste';
import { font, hitSlopFor, palette, space } from '@/core/theme';

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
        <Text style={{ fontSize: font.size.base, color: palette.muted }}>Profile not found.</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12} style={{ marginTop: space(3) }}><Text style={{ fontSize: font.size.base, color: palette.accent, fontWeight: '700' }}>Go back</Text></Pressable>
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
          <Pressable onPress={() => router.back()} hitSlop={hitSlopFor(22)} accessibilityRole="button" accessibilityLabel="Back"><ArrowLeft size={22} color={palette.ink} /></Pressable>

          <View style={{ alignItems: 'center', marginTop: space(3) }}>
            <Avatar name={person.name} tint={person.tint} size={92} />
            <Text accessibilityRole="header" style={{ marginTop: space(3), fontFamily: font.display, fontSize: font.size.title, fontWeight: '600', color: palette.ink }}>{person.name}</Text>
            <Text style={{ fontSize: font.size.base, color: palette.muted }}>@{person.handle}</Text>
            {person.bio ? <Text style={{ marginTop: space(2), fontSize: font.size.base, color: palette.ink, textAlign: 'center' }}>{person.bio}</Text> : null}
            <View style={{ marginTop: space(2), flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {chips.map((c) => (
                <View key={c} style={{ borderRadius: 999, backgroundColor: 'rgba(46,46,46,0.05)', paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ fontSize: font.size.xs, fontWeight: '600', color: palette.muted }}>{c}</Text>
                </View>
              ))}
            </View>
            <View style={{ marginTop: space(3), flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.accentSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}>
              <Text style={{ fontSize: font.size.sm, fontWeight: '700', color: palette.accentInk }}>{match}% taste match</Text>
            </View>
          </View>

          <Text accessibilityRole="header" style={{ marginTop: space(6), fontSize: font.size.sm, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>{person.name.split(' ')[0]}'s shelf</Text>
          <View style={{ marginTop: space(2), gap: 8 }}>
            {ids.map((pid) => {
              const p = getProduct(pid);
              const r = rankMap.get(pid);
              if (!p || !r) return null;
              return (
                <Pressable
                  key={pid}
                  onPress={() => router.push({ pathname: '/product/[id]', params: { id: pid } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.name}. Number ${r.groupRank} of ${r.groupSize} ${categoryLabel(p.category).toLowerCase()}, ${r.tier} tier`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: palette.surface, borderRadius: 16, padding: 10, borderWidth: 1, borderColor: palette.line }}>
                  <Text style={{ width: 32, textAlign: 'center', fontFamily: font.display, fontSize: font.size.title, fontWeight: '600', color: tierInk(r.tier) }}>{r.groupRank}</Text>
                  <ProductImage id={p.id} brand={p.brand} image={p.image} category={categoryLabel(p.category)} width={44} height={44} radius={12} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontSize: font.size.base, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
                    <Text style={{ fontSize: font.size.xs, color: palette.muted }}>#{r.groupRank} of {r.groupSize} · {categoryLabel(p.category)}</Text>
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
