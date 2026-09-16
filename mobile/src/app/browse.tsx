import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';

import { ProductImage } from '@/components/ProductImage';
import { SegmentedToggle } from '@/components/SegmentedToggle';
import { catalog, categoriesForDomain, categoryLabel, productDomain } from '@/core/catalog';
import { palette, space } from '@/core/theme';
import type { Category, Domain } from '@/core/types';

export default function Browse() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [domain, setDomain] = useState<Domain>('skincare');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return catalog
      .filter((p) => productDomain(p) === domain)
      .filter((p) => cat === 'all' || p.category === cat)
      .filter((p) => !term || `${p.name} ${p.brand}`.toLowerCase().includes(term));
  }, [domain, cat, q]);
  const cats = categoriesForDomain(domain);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingTop: insets.top + space(3), paddingHorizontal: space(5) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={10}><ArrowLeft size={22} color={palette.ink} /></Pressable>
          <Text style={{ fontSize: 22, fontWeight: '700', color: palette.ink }}>Browse</Text>
        </View>
        <View style={{ marginTop: space(3) }}>
          <SegmentedToggle
            value={domain}
            onChange={(d) => { setDomain(d); setCat('all'); }}
            options={[{ value: 'skincare', label: 'Skincare' }, { value: 'makeup', label: 'Makeup' }, { value: 'fragrance', label: 'Fragrance' }]}
          />
        </View>
        <View style={{ marginTop: space(2), flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 999, paddingHorizontal: space(4) }}>
          <Search size={16} color={palette.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Search" placeholderTextColor={palette.muted} style={{ flex: 1, paddingVertical: 11, fontSize: 15, color: palette.ink }} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: space(3) }}>
          {(['all', ...cats] as (Category | 'all')[]).map((c) => {
            const on = cat === c;
            return (
              <Pressable key={c} onPress={() => setCat(c)} style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: on ? palette.ink : 'rgba(46,46,46,0.05)' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: on ? palette.white : palette.ink }}>{c === 'all' ? 'All' : categoryLabel(c)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ padding: space(5), gap: 8, paddingBottom: insets.bottom + space(5) }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 12.5, color: palette.muted }}>{results.length} products</Text>
        {results.map((p) => (
          <Pressable key={p.id} onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 18, padding: 10, borderWidth: 1, borderColor: palette.line }}>
            <ProductImage id={p.id} brand={p.brand} image={p.image} category={categoryLabel(p.category)} width={52} height={52} radius={14} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
              <Text numberOfLines={1} style={{ fontSize: 12.5, color: palette.muted }}>{p.brand} · {categoryLabel(p.category)}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
