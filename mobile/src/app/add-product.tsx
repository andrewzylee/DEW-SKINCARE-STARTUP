import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { Text, TextInput } from '@/components/Text';
import { categoriesForDomain, categoryLabel, registerCustomProduct } from '@/core/catalog';
import { font, palette, space } from '@/core/theme';
import type { Category, Domain } from '@/core/types';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function AddProduct() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Prefilled when you arrive from a Discover search that found nothing.
  const { name: initialName } = useLocalSearchParams<{ name?: string }>();
  const [name, setName] = useState(initialName ?? '');
  const [brand, setBrand] = useState('');
  const [domain, setDomain] = useState<Domain>('skincare');
  const [category, setCategory] = useState<Category>('cleanser');

  const cats = categoriesForDomain(domain);
  const canAdd = name.trim().length > 1 && brand.trim().length > 0;

  const pickDomain = (d: Domain) => {
    setDomain(d);
    setCategory(categoriesForDomain(d)[0]);
  };

  const add = () => {
    if (!canAdd) return;
    const id = `custom-${slug(brand)}-${slug(name)}`;
    registerCustomProduct({ id, brand: brand.trim(), name: name.trim(), category, domain });
    router.replace({ pathname: '/product/[id]', params: { id } });
  };

  const fieldStyle = { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: font.size.base, color: palette.ink } as const;
  const labelStyle = { fontSize: font.size.xs, fontWeight: '600' as const, color: palette.muted, marginBottom: 6, marginTop: space(3) };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space(3) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5) }}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close"><X size={24} color={palette.muted} /></Pressable>
        <Text accessibilityRole="header" style={{ fontSize: font.size.lg, fontWeight: '600', color: palette.ink }}>Add a product</Text>
        <Pressable onPress={add} disabled={!canAdd} hitSlop={12} accessibilityRole="button" accessibilityLabel="Add product" accessibilityState={{ disabled: !canAdd }}>
          <Text style={{ fontSize: font.size.lg, fontWeight: '700', color: canAdd ? palette.accent : palette.muted }}>Add</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: insets.bottom + space(6) }} keyboardShouldPersistTaps="handled">
        <Text style={{ marginTop: space(3), fontSize: font.size.sm, color: palette.muted }}>Not on Dew yet? Add it for you and your community to rank.</Text>

        <Text style={labelStyle}>Brand</Text>
        <TextInput value={brand} onChangeText={setBrand} placeholder="e.g. CeraVe" accessibilityLabel="Brand" placeholderTextColor={palette.muted} style={fieldStyle} />

        <Text style={labelStyle}>Product name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Foaming Facial Cleanser" accessibilityLabel="Product name" placeholderTextColor={palette.muted} style={fieldStyle} />

        <Text style={labelStyle}>Type</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['skincare', 'makeup', 'fragrance'] as Domain[]).map((d) => {
            const on = domain === d;
            return (
              <Pressable key={d} onPress={() => pickDomain(d)} accessibilityRole="button" accessibilityState={{ selected: on }} hitSlop={{ top: 7, bottom: 7 }} style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: on ? palette.accent : 'rgba(46,46,46,0.05)' }}>
                <Text style={{ fontSize: font.size.sm, fontWeight: '600', color: on ? palette.white : palette.ink, textTransform: 'capitalize' }}>{d}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={labelStyle}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {cats.map((c) => {
            const on = category === c;
            return (
              <Pressable key={c} onPress={() => setCategory(c)} accessibilityRole="button" accessibilityState={{ selected: on }} hitSlop={{ top: 3, bottom: 3 }} style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: on ? palette.ink : 'rgba(46,46,46,0.05)' }}>
                <Text style={{ fontSize: font.size.sm, fontWeight: '600', color: on ? palette.white : palette.ink }}>{categoryLabel(c)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ marginTop: space(4), fontSize: font.size.xs, color: palette.muted }}>A photo can be added later — it shows a clean branded tile until then.</Text>
      </ScrollView>
    </View>
  );
}
