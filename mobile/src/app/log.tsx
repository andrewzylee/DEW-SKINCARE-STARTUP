import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';

import { ProductImage } from '@/components/ProductImage';
import { categoryLabel, getProduct } from '@/core/catalog';
import { routineAM, routinePM } from '@/core/shelfData';
import { palette, space } from '@/core/theme';

const RATINGS = [
  { v: 0, e: '😣' },
  { v: 1, e: '🙁' },
  { v: 2, e: '😐' },
  { v: 3, e: '🙂' },
  { v: 4, e: '😍' },
];
const eyebrow = { fontSize: 13, fontWeight: '800' as const, color: palette.muted, textTransform: 'uppercase' as const, letterSpacing: 1.4 };

export default function Log() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [used, setUsed] = useState<Set<string>>(new Set([...routineAM, ...routinePM]));
  const [rating, setRating] = useState<number | null>(null);

  const toggle = (id: string) =>
    setUsed((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const Section = ({ title, ids }: { title: string; ids: string[] }) => (
    <View style={{ marginTop: space(4) }}>
      <Text style={eyebrow}>{title}</Text>
      <View style={{ marginTop: 8, gap: 8 }}>
        {ids.map((id) => {
          const p = getProduct(id);
          if (!p) return null;
          const on = used.has(id);
          return (
            <Pressable key={id} onPress={() => toggle(id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 16, padding: 10, borderWidth: 1, borderColor: on ? palette.accent : palette.line }}>
              <ProductImage id={p.id} brand={p.brand} image={p.image} width={40} height={40} radius={12} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '600', color: palette.ink }}>{p.name}</Text>
                <Text style={{ fontSize: 12, color: palette.muted }}>{categoryLabel(p.category)}</Text>
              </View>
              <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? palette.accent : 'transparent', borderWidth: on ? 0 : 1.5, borderColor: palette.line }}>
                {on ? <Check size={15} color={palette.white} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space(3) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5) }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: palette.ink }}>Log today</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}><X size={24} color={palette.muted} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: insets.bottom + space(6) }}>
        <Text style={{ marginTop: space(3), fontSize: 13, color: palette.muted }}>Check off what you used and rate your skin today.</Text>
        <Section title="Morning" ids={routineAM} />
        <Section title="Evening" ids={routinePM} />
        <Text style={[eyebrow, { marginTop: space(5) }]}>How&apos;s your skin?</Text>
        <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
          {RATINGS.map((r) => (
            <Pressable key={r.v} onPress={() => setRating(r.v)} style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: rating === r.v ? palette.accentSoft : palette.surface, borderWidth: 1, borderColor: rating === r.v ? palette.accent : palette.line }}>
              <Text style={{ fontSize: 24 }}>{r.e}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => router.back()} style={{ marginTop: space(6), alignItems: 'center', backgroundColor: palette.accent, borderRadius: 999, paddingVertical: 15 }}>
          <Text style={{ color: palette.white, fontSize: 16, fontWeight: '700' }}>Log today 🔥</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
