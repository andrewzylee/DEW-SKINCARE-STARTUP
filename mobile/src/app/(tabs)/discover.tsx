import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Plus, Search, SlidersHorizontal, Sparkles, TrendingUp, Users } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { ProductImage } from '@/components/ProductImage';
import { catalog, categoryLabel, getProduct } from '@/core/catalog';
import { featuredLists, lookalikeStats } from '@/core/discovery';
import { myShelf, people } from '@/core/social';
import { tasteItemsFromIds, tasteMatchWithFriend } from '@/core/taste';
import { palette, radius, space } from '@/core/theme';
import type { Product } from '@/core/types';

const myTaste = tasteItemsFromIds(myShelf);
const twins = people
  .map((p) => ({ p, m: tasteMatchWithFriend(myTaste, p.id) }))
  .sort((a, b) => b.m.score - a.m.score);

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

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return catalog.filter((p) => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(term)).slice(0, 20);
  }, [q]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space(4), paddingBottom: space(8) }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: space(5) }}>
          <Text style={{ fontSize: 30, fontWeight: '700', color: palette.ink, letterSpacing: -0.5 }}>Discover</Text>
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
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 999, paddingHorizontal: space(4), paddingVertical: 10 }}
              >
                <SlidersHorizontal size={15} color={palette.accent} />
                <Text style={{ fontSize: 13.5, fontWeight: '600', color: palette.ink }}>Browse all products</Text>
                <Text style={{ marginLeft: 'auto', fontSize: 12, color: palette.muted }}>filters · brands · price</Text>
              </Pressable>
            </View>

            {/* Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(5), gap: 8, paddingTop: space(3) }}>
              {CHIPS.map((c) => {
                const on = view === c.key;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setView(c.key)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: on ? palette.accent : 'rgba(46,46,46,0.05)' }}
                  >
                    <c.Icon size={14} color={on ? palette.white : palette.ink} />
                    <Text style={{ fontSize: 13, fontWeight: '500', color: on ? palette.white : palette.ink }}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Shade Match wedge */}
            <View style={{ paddingHorizontal: space(5), paddingTop: space(4) }}>
              <Pressable
                onPress={() => router.push('/shade')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.makeupSoft, borderRadius: 20, padding: space(4) }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(194,124,96,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} color={palette.makeupInk} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: palette.makeupInk }}>Find your Shade Match</Text>
                  <Text style={{ fontSize: 12.5, color: 'rgba(166,98,72,0.7)', marginTop: 1 }}>Foundation, concealer & blush that suit your tone.</Text>
                </View>
                <ChevronRight size={18} color="rgba(166,98,72,0.5)" />
              </Pressable>
            </View>

            {/* Taste twins */}
            <View style={{ paddingTop: space(5) }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: space(5) }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>Your taste twins</Text>
                <Text style={{ fontSize: 12, color: palette.muted }}>who ranks like you</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(5), gap: 16, paddingTop: space(3) }}>
                {twins.map(({ p, m }) => (
                  <Pressable key={p.id} onPress={() => router.push({ pathname: '/person/[id]', params: { id: p.id } })} style={{ width: 64, alignItems: 'center' }}>
                    <View>
                      <Avatar name={p.name} tint={p.tint} size={56} />
                      <View style={{ position: 'absolute', bottom: -6, alignSelf: 'center', backgroundColor: palette.ink, borderRadius: 999, borderWidth: 2, borderColor: palette.bg, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ color: palette.white, fontSize: 10, fontWeight: '800' }}>{m.score}%</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={{ marginTop: 10, fontSize: 12, fontWeight: '500', color: palette.ink }}>{p.name.split(' ')[0]}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Featured lists */}
            <View style={{ paddingTop: space(6) }}>
              <Text style={{ paddingHorizontal: space(5), fontSize: 13, fontWeight: '800', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>Featured lists</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(5), gap: 12, paddingTop: space(3) }}>
                {featuredLists.map((list) => {
                  const thumbs = list.productIds.slice(0, 3).map(getProduct).filter((p): p is Product => !!p);
                  return (
                    <Pressable key={list.id} onPress={() => router.push({ pathname: '/list/[id]', params: { id: list.id } })} style={{ width: 172, height: 176, borderRadius: 20, backgroundColor: list.tint, padding: 14, justifyContent: 'space-between', overflow: 'hidden' }}>
                      <View style={{ flexDirection: 'row' }}>
                        {thumbs.map((p, i) => (
                          <View key={p.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                            <ProductImage id={p.id} brand={p.brand} image={p.image} width={36} height={36} radius={18} style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' }} />
                          </View>
                        ))}
                      </View>
                      <View>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: palette.white }}>{list.title}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>{list.productIds.length} products</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Works for skin like yours */}
            {view === 'foryou' ? (
              <View style={{ paddingTop: space(6), paddingHorizontal: space(5) }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>Works for skin like yours</Text>
                <Text style={{ fontSize: 13, color: palette.muted, marginTop: 4, marginBottom: space(2) }}>
                  Share of people with <Text style={{ fontWeight: '600', color: palette.ink }}>oily & acne-prone</Text> skin who rank each S-tier.
                </Text>
                <View style={{ gap: 8 }}>
                  {lookalikeStats.map((s) => {
                    const p = getProduct(s.productId);
                    if (!p) return null;
                    return (
                      <Pressable key={s.productId} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 18, padding: 10, borderWidth: 1, borderColor: palette.line }}>
                        <ProductImage id={p.id} brand={p.brand} image={p.image} width={44} height={44} radius={12} />
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            <View style={{ flex: 1, height: 6, borderRadius: 999, backgroundColor: 'rgba(46,46,46,0.1)', overflow: 'hidden' }}>
                              <View style={{ width: `${s.pctSTier}%`, height: '100%', borderRadius: 999, backgroundColor: palette.accentBright }} />
                            </View>
                            <Text style={{ fontSize: 12.5, fontWeight: '700', color: palette.ink }}>{s.pctSTier}%</Text>
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
      placeholderTextColor={palette.muted}
      style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: palette.ink }}
    />
  );
}

function SearchResults({ results, query }: { results: Product[]; query: string }) {
  const router = useRouter();
  return (
    <View style={{ paddingHorizontal: space(5), paddingTop: space(3), gap: 8 }}>
      {results.map((p) => (
        <Pressable key={p.id} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 18, padding: 10, borderWidth: 1, borderColor: palette.line }}>
          <ProductImage id={p.id} brand={p.brand} image={p.image} width={44} height={44} radius={12} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
            <Text numberOfLines={1} style={{ fontSize: 12.5, color: palette.muted }}>{p.brand}</Text>
          </View>
          <Text style={{ fontSize: 10.5, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>{categoryLabel(p.category)}</Text>
        </Pressable>
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: palette.line, borderStyle: 'dashed', padding: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={18} color={palette.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14.5, fontWeight: '700', color: palette.ink }}>{results.length ? 'Not seeing it?' : `Add “${query.trim()}”`}</Text>
          <Text style={{ fontSize: 12.5, color: palette.muted }}>Add a product — just a photo + name</Text>
        </View>
      </View>
    </View>
  );
}
