import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Plus, Search, SlidersHorizontal, Sparkles, TrendingUp, Users } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { ProductImage } from '@/components/ProductImage';
import { Text, TextInput } from '@/components/Text';
import { TAB_LIST_ROLE } from '@/core/a11y';
import { catalog, categoryLabel, getProduct } from '@/core/catalog';
import { featuredLists, lookalikeStats } from '@/core/discovery';
import { GOAL_ADJECTIVE, type Concern } from '@/core/quiz';
import { friendShelves, myShelf, people, usingDemoGraph } from '@/core/socialSource';
import { tasteItemsFromIds, tasteMatchWithFriend } from '@/core/taste';
import { font, palette, radius, space } from '@/core/theme';
import type { Product } from '@/core/types';
import { useProfile } from '@/data/profile-store';

const myTaste = tasteItemsFromIds(myShelf);
const twins = people
  .map((p) => ({ p, m: tasteMatchWithFriend(myTaste, p.id) }))
  .sort((a, b) => b.m.score - a.m.score);

// Trending: how many people in the graph have it on a shelf. Real signal from the sample data
// rather than a curated list, so the tab shows something For You doesn't.
const TRENDING = (() => {
  const counts = new Map<string, number>();
  Object.values(friendShelves).forEach((ids) => ids.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1)));
  return [...counts.entries()]
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([productId, shelves]) => ({ productId, shelves }));
})();

// Friend recs: top-3 picks from your closest taste twins that you haven't ranked yet.
const FRIEND_RECS = (() => {
  const mine = new Set(myShelf);
  const seen = new Set<string>();
  const out: { productId: string; person: (typeof people)[number]; score: number }[] = [];
  twins.slice(0, 4).forEach(({ p, m }) => {
    (friendShelves[p.id] ?? []).slice(0, 3).forEach((productId) => {
      if (mine.has(productId) || seen.has(productId)) return;
      seen.add(productId);
      out.push({ productId, person: p, score: m.score });
    });
  });
  return out.slice(0, 8);
})();

const CHIPS = [
  { key: 'foryou', label: 'For You', Icon: Sparkles },
  { key: 'trending', label: 'Trending', Icon: TrendingUp },
  { key: 'friends', label: 'Friend recs', Icon: Users },
] as const;

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [view, setView] = useState<'foryou' | 'trending' | 'friends'>('foryou');
  const { skinProfile } = useProfile();

  // Describe the cohort from the user's own quiz answers instead of a fixed "oily & acne-prone".
  const cohortLabel = useMemo(() => {
    const goal = skinProfile?.goal as Concern | null | undefined;
    const parts = [skinProfile?.skin_type, goal ? GOAL_ADJECTIVE[goal] : null].filter(Boolean);
    return parts.length ? parts.join(' & ') : 'skin like yours';
  }, [skinProfile]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return catalog.filter((p) => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(term)).slice(0, 20);
  }, [q]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space(4), paddingBottom: space(8) }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: space(5) }}>
          <Text accessibilityRole="header" style={{ fontFamily: font.display, fontSize: font.size.hero, fontWeight: '600', color: palette.ink }}>Discover</Text>
          <View style={{ marginTop: space(4), flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(46,46,46,0.05)', borderRadius: 999, paddingHorizontal: space(4) }}>
            <Search size={17} color={palette.muted} />
            <TextInputBox value={q} onChange={setQ} />
          </View>
        </View>

        {q.trim() ? (
          <SearchResults results={results} query={q} />
        ) : (
          <>
            {/* Browse all */}
            <View style={{ paddingHorizontal: space(5), paddingTop: space(2) }}>
              <Pressable
                onPress={() => router.push('/browse')}
                accessibilityRole="button"
                accessibilityLabel="Browse all products"
                accessibilityHint="Filter by brand, category and price"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 999, paddingHorizontal: space(4), paddingVertical: 10 }}
              >
                <SlidersHorizontal size={15} color={palette.accent} />
                <Text style={{ fontSize: font.size.sm, fontWeight: '600', color: palette.ink }}>Browse all products</Text>
                <Text style={{ marginLeft: 'auto', fontSize: font.size.xs, color: palette.muted }}>filters · brands · price</Text>
              </Pressable>
            </View>

            {/* Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole={TAB_LIST_ROLE} contentContainerStyle={{ paddingHorizontal: space(5), gap: 8, paddingTop: space(3) }}>
              {CHIPS.map((c) => {
                const on = view === c.key;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setView(c.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    hitSlop={{ top: 7, bottom: 7 }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: on ? palette.accent : 'rgba(46,46,46,0.05)' }}
                  >
                    <c.Icon size={14} color={on ? palette.white : palette.ink} />
                    <Text style={{ fontSize: font.size.sm, fontWeight: '500', color: on ? palette.white : palette.ink }}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Shade Match wedge */}
            <View style={{ paddingHorizontal: space(5), paddingTop: space(4) }}>
              <Pressable
                onPress={() => router.push('/shade')}
                accessibilityRole="button"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.makeupSoft, borderRadius: 20, padding: space(4) }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(194,124,96,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} color={palette.makeupInk} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: font.size.base, fontWeight: '700', color: palette.makeupInk }}>Find your Shade Match</Text>
                  <Text style={{ fontSize: font.size.sm, color: palette.makeupInk, marginTop: 1 }}>Foundation, concealer & blush that suit your tone.</Text>
                </View>
                <ChevronRight size={18} color={palette.makeupInk} />
              </Pressable>
            </View>

            {/* Taste twins — only exist once there is a real social graph. */}
            {twins.length > 0 ? (
            <View style={{ paddingTop: space(5) }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: space(5) }}>
                <Text accessibilityRole="header" style={{ fontSize: font.size.sm, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>Your taste twins</Text>
                <Text style={{ fontSize: font.size.xs, color: palette.muted }}>who ranks like you</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(5), gap: 16, paddingTop: space(3) }}>
                {twins.map(({ p, m }) => (
                  <Pressable
                    key={p.id}
                    onPress={() => router.push({ pathname: '/person/[id]', params: { id: p.id } })}
                    accessibilityRole="button"
                    accessibilityLabel={`${p.name}, ${m.score}% taste match`}
                    style={{ width: 64, alignItems: 'center' }}
                  >
                    <View>
                      <Avatar name={p.name} tint={p.tint} size={56} />
                      <View style={{ position: 'absolute', bottom: -6, alignSelf: 'center', backgroundColor: palette.ink, borderRadius: 999, borderWidth: 2, borderColor: palette.bg, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ color: palette.white, fontSize: font.size.xs, fontWeight: '700' }}>{m.score}%</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={{ marginTop: 10, fontSize: font.size.xs, fontWeight: '500', color: palette.ink }}>{p.name.split(' ')[0]}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            ) : null}

            {/* Featured lists */}
            <View style={{ paddingTop: space(6) }}>
              <Text accessibilityRole="header" style={{ paddingHorizontal: space(5), fontSize: font.size.sm, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>Featured lists</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(5), gap: 12, paddingTop: space(3) }}>
                {featuredLists.map((list) => {
                  const thumbs = list.productIds.slice(0, 3).map(getProduct).filter((p): p is Product => !!p);
                  return (
                    <Pressable key={list.id} onPress={() => router.push({ pathname: '/list/[id]', params: { id: list.id } })} accessibilityRole="button" style={{ width: 172, height: 176, borderRadius: 20, backgroundColor: list.tint, padding: 14, justifyContent: 'space-between', overflow: 'hidden' }}>
                      <View style={{ flexDirection: 'row' }}>
                        {thumbs.map((p, i) => (
                          <View key={p.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                            <ProductImage id={p.id} brand={p.brand} image={p.image} width={36} height={36} radius={18} style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' }} />
                          </View>
                        ))}
                      </View>
                      <View>
                        <Text style={{ fontSize: font.size.lg, fontWeight: '700', color: palette.white }}>{list.title}</Text>
                        <Text style={{ fontSize: font.size.xs, fontWeight: '500', color: palette.white, marginTop: 3 }}>{list.productIds.length} products</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Trending — most-shelved across the graph */}
            {view === 'trending' ? (
              <View style={{ paddingTop: space(6), paddingHorizontal: space(5) }}>
                <Text accessibilityRole="header" style={{ fontSize: font.size.sm, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>Trending on Dew</Text>
                <Text style={{ fontSize: font.size.sm, color: palette.muted, marginTop: 4, marginBottom: space(2) }}>Most-shelved products right now.</Text>
                {TRENDING.length === 0 ? (
                  <Text style={{ fontSize: font.size.sm, color: palette.muted, lineHeight: 20, paddingTop: space(2) }}>
                    Nothing is trending yet — this fills in as people rank products.
                  </Text>
                ) : null}
                <View style={{ gap: 8 }}>
                  {TRENDING.map(({ productId, shelves }) => {
                    const p = getProduct(productId);
                    if (!p) return null;
                    return (
                      <Pressable key={productId} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 18, padding: 10, borderWidth: 1, borderColor: palette.line }}>
                        <ProductImage id={p.id} brand={p.brand} image={p.image} width={44} height={44} radius={12} />
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={{ fontSize: font.size.base, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
                          <Text numberOfLines={1} style={{ fontSize: font.size.sm, color: palette.muted }}>{p.brand}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <TrendingUp size={13} color={palette.accent} />
                          <Text style={{ fontSize: font.size.sm, fontWeight: '700', color: palette.accent }}>{shelves} shelves</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Friend recs — top picks from your closest taste twins that you haven't ranked */}
            {view === 'friends' ? (
              <View style={{ paddingTop: space(6), paddingHorizontal: space(5) }}>
                <Text accessibilityRole="header" style={{ fontSize: font.size.sm, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>From your taste twins</Text>
                <Text style={{ fontSize: font.size.sm, color: palette.muted, marginTop: 4, marginBottom: space(2) }}>Top picks from the people who rank like you — that you haven&apos;t ranked yet.</Text>
                {FRIEND_RECS.length === 0 ? (
                  <Text style={{ fontSize: font.size.sm, color: palette.muted, lineHeight: 20, paddingTop: space(2) }}>
                    {twins.length === 0 ? 'No taste twins yet — invite people you trust and their picks show up here.' : "You've already ranked everything your taste twins have. Rank more to widen the net."}
                  </Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {FRIEND_RECS.map(({ productId, person, score }) => {
                      const p = getProduct(productId);
                      if (!p) return null;
                      return (
                        <Pressable key={productId} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 18, padding: 10, borderWidth: 1, borderColor: palette.line }}>
                          <ProductImage id={p.id} brand={p.brand} image={p.image} width={44} height={44} radius={12} />
                          <View style={{ flex: 1 }}>
                            <Text numberOfLines={1} style={{ fontSize: font.size.base, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
                            <Text numberOfLines={1} style={{ fontSize: font.size.sm, color: palette.muted }}>{p.brand}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Avatar name={person.name} tint={person.tint} size={28} />
                            <Text style={{ fontSize: font.size.xs, fontWeight: '700', color: palette.muted, marginTop: 3 }}>{score}%</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : null}

            {/* Works for skin like yours — the percentages are invented sample stats, so they
                only appear alongside the demo cast. Real cohort stats need rank_events. */}
            {view === 'foryou' && usingDemoGraph ? (
              <View style={{ paddingTop: space(6), paddingHorizontal: space(5) }}>
                <Text accessibilityRole="header" style={{ fontSize: font.size.sm, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>Works for skin like yours</Text>
                <Text style={{ fontSize: font.size.sm, color: palette.muted, marginTop: 4, marginBottom: space(2) }}>
                  Share of people with <Text style={{ fontWeight: '600', color: palette.ink }}>{cohortLabel}</Text> skin who rank each S-tier.
                </Text>
                <View style={{ gap: 8 }}>
                  {lookalikeStats.map((s) => {
                    const p = getProduct(s.productId);
                    if (!p) return null;
                    return (
                      <Pressable key={s.productId} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 18, padding: 10, borderWidth: 1, borderColor: palette.line }}>
                        <ProductImage id={p.id} brand={p.brand} image={p.image} width={44} height={44} radius={12} />
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={{ fontSize: font.size.base, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            <View style={{ flex: 1, height: 6, borderRadius: 999, backgroundColor: 'rgba(46,46,46,0.1)', overflow: 'hidden' }}>
                              <View style={{ width: `${s.pctSTier}%`, height: '100%', borderRadius: 999, backgroundColor: palette.accentBright }} />
                            </View>
                            <Text style={{ fontSize: font.size.sm, fontWeight: '700', color: palette.ink }}>{s.pctSTier}%</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function TextInputBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Search products, brands, concerns"
      accessibilityLabel="Search products, brands, concerns"
      placeholderTextColor={palette.muted}
      style={{ flex: 1, paddingVertical: 12, fontSize: font.size.base, color: palette.ink }}
    />
  );
}

function SearchResults({ results, query }: { results: Product[]; query: string }) {
  const router = useRouter();
  return (
    <View style={{ paddingHorizontal: space(5), paddingTop: space(3), gap: 8 }}>
      {results.map((p) => (
        <Pressable key={p.id} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 18, padding: 10, borderWidth: 1, borderColor: palette.line }}>
          <ProductImage id={p.id} brand={p.brand} image={p.image} width={44} height={44} radius={12} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: font.size.base, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
            <Text numberOfLines={1} style={{ fontSize: font.size.sm, color: palette.muted }}>{p.brand}</Text>
          </View>
          <Text style={{ fontSize: font.size.xs, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>{categoryLabel(p.category)}</Text>
        </Pressable>
      ))}
      <Pressable
        onPress={() => router.push({ pathname: '/add-product', params: { name: query.trim() } })}
        accessibilityRole="button"
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: palette.line, borderStyle: 'dashed', padding: 12, backgroundColor: pressed ? palette.accentSoft : 'transparent' })}
      >
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={18} color={palette.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: font.size.base, fontWeight: '700', color: palette.ink }}>{results.length ? 'Not seeing it?' : `Add “${query.trim()}”`}</Text>
          <Text style={{ fontSize: font.size.sm, color: palette.muted }}>Add a product — name, brand & category</Text>
        </View>
        <ChevronRight size={18} color={palette.muted} />
      </Pressable>
    </View>
  );
}
