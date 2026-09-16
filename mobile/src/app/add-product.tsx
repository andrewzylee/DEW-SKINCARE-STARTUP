import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { categoriesForDomain, categoryLabel, registerCustomProduct } from '@/core/catalog';
import { palette, space } from '@/core/theme';
import type { Category, Domain } from '@/core/types';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function AddProduct() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState('');
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

  const fieldStyle = { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: palette.ink } as const;
  const labelStyle = { fontSize: 12, fontWeight: '600' as const, color: palette.muted, marginBottom: 6, marginTop: space(3) };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space(3) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5) }}>
        <Pressable onPress={() => router.back()} hitSlop={10}><X size={24} color={palette.muted} /></Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: palette.ink }}>Add a product</Text>
        <Pressable onPress={add} disabled={!canAdd} hitSlop={10}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: canAdd ? palette.accent : palette.muted }}>Add</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: insets.bottom + space(6) }} keyboardShouldPersistTaps="handled">
        <Text style={{ marginTop: space(3), fontSize: 13, color: palette.muted }}>Not on Dew yet? Add it for you and your community to rank.</Text>

        <Text style={labelStyle}>Brand</Text>
        <TextInput value={brand} onChangeText={setBrand} placeholder="e.g. CeraVe" placeholderTextColor={palette.muted} style={fieldStyle} />

        <Text style={labelStyle}>Product name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Foaming Facial Cleanser" placeholderTextColor={palette.muted} style={fieldStyle} />

        <Text style={labelStyle}>Type</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['skincare', 'makeup', 'fragrance'] as Domain[]).map((d) => {
            const on = domain === d;
            return (
              <Pressable key={d} onPress={() => pickDomain(d)} style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: on ? palette.accent : 'rgba(46,46,46,0.05)' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: on ? palette.white : palette.ink, textTransform: 'capitalize' }}>{d}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={labelStyle}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {cats.map((c) => {
            const on = category === c;
            return (
              <Pressable key={c} onPress={() => setCategory(c)} style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: on ? palette.ink : 'rgba(46,46,46,0.05)' }}>
                <Text style={{ fontSize: 12.5, fontWeight: '600', color: on ? palette.white : palette.ink }}>{categoryLabel(c)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ marginTop: space(4), fontSize: 12, color: palette.muted }}>A photo can be added later — it shows a clean branded tile until then.</Text>
      </ScrollView>
    </View>
  );
}
