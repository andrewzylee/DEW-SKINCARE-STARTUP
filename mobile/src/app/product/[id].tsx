import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { ProductImage } from '@/components/ProductImage';
import { categoryLabel, categoryPlural, getProduct } from '@/core/catalog';
import { people } from '@/core/social';
import { friendRankedShelf, rankedFromIds } from '@/core/taste';
import { palette, space } from '@/core/theme';
import type { Person } from '@/core/types';
import { useMyShelf } from '@/data/hooks';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
interface Ranker { person: Person; rank: number; size: number }

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const p = id ? getProduct(id) : undefined;
  const { shelf } = useMyShelf();

  const myRank = useMemo(() => (p ? rankedFromIds(shelf).find((x) => x.productId === p.id) : undefined), [shelf, p]);
  const rankers = useMemo<Ranker[]>(() => {
    if (!p) return [];
    return people
      .map((pp) => {
        const r = friendRankedShelf(pp.id).find((x) => x.productId === p.id);
        return r ? { person: pp, rank: r.groupRank, size: r.groupSize } : null;
      })
      .filter((x): x is Ranker => x !== null);
  }, [p]);

  if (!p) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', padding: space(5) }}>
        <Text style={{ color: palette.muted }}>Product not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: space(3) }}><Text style={{ color: palette.accent, fontWeight: '700' }}>Go back</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space(8), alignItems: 'center' }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 520, paddingHorizontal: space(5), paddingTop: insets.top + space(3) }}>
          <Pressable onPress={() => router.back()} hitSlop={10}><ArrowLeft size={22} color={palette.ink} /></Pressable>

          <View style={{ alignItems: 'center', marginTop: space(3) }}>
            <ProductImage id={p.id} brand={p.brand} image={p.image} category={categoryLabel(p.category)} width={160} height={200} radius={24} />
            <Text style={{ marginTop: space(3), fontSize: 13, fontWeight: '600', color: palette.muted }}>{p.brand}</Text>
            <Text style={{ marginTop: 2, fontSize: 24, fontWeight: '800', color: palette.ink, textAlign: 'center' }}>{p.name}</Text>
            <Text style={{ marginTop: 4, fontSize: 12.5, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.2 }}>{categoryLabel(p.category)}</Text>
          </View>

          {myRank ? (
            <View style={{ marginTop: space(4), alignSelf: 'center', backgroundColor: palette.accentSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 }}>
              <Text style={{ color: palette.accentInk, fontWeight: '700' }}>Your #{myRank.groupRank} {categoryLabel(p.category).toLowerCase()}</Text>
            </View>
          ) : null}

          {p.blurb ? <Text style={{ marginTop: space(4), fontSize: 14.5, lineHeight: 21, color: palette.ink }}>{p.blurb}</Text> : null}

          {p.styleTags && p.styleTags.length > 0 ? (
            <View style={{ marginTop: space(3), flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {p.styleTags.map((t) => (
                <View key={t} style={{ borderRadius: 999, backgroundColor: 'rgba(46,46,46,0.05)', paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ fontSize: 11.5, fontWeight: '600', color: palette.muted }}>{cap(t)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {rankers.length > 0 ? (
            <View style={{ marginTop: space(5) }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>Ranked by your circle</Text>
              <View style={{ marginTop: space(2), gap: 8 }}>
                {rankers.map((r) => (
                  <Pressable key={r.person.id} onPress={() => router.push({ pathname: '/person/[id]', params: { id: r.person.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 16, padding: 10, borderWidth: 1, borderColor: palette.line }}>
                    <Avatar name={r.person.name} tint={r.person.tint} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14.5, fontWeight: '700', color: palette.ink }}>{r.person.name}</Text>
                      <Text style={{ fontSize: 12, color: palette.muted }}>#{r.rank} of {r.size} {categoryPlural(p.category)}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <Pressable onPress={() => router.push('/shelf')} style={{ marginTop: space(6), alignItems: 'center', backgroundColor: palette.accent, borderRadius: 999, paddingVertical: 15 }}>
            <Text style={{ color: palette.white, fontSize: 16, fontWeight: '700' }}>{myRank ? 'Re-rank on your shelf' : 'Rank it on your shelf'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
