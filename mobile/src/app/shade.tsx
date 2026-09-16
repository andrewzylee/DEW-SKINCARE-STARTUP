import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Sparkles } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { ProductImage } from '@/components/ProductImage';
import { categoryLabel } from '@/core/catalog';
import { shadeMatch, TONE_LABEL, TONES, UNDERTONE_LABEL, UNDERTONES } from '@/core/shade';
import { palette, radius, space } from '@/core/theme';
import type { Tone, Undertone } from '@/core/types';

// Shade Match — the acquisition wedge. Set your tone + undertone (works with zero social graph),
// get shade-aware picks for color makeup, and see people with your skin. Ported from the web
// reference (src/components/ShadeMatchView.tsx). Seeds from the demo skin profile so picks render.
export default function Shade() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tone, setTone] = useState<Tone | undefined>('medium');
  const [undertone, setUndertone] = useState<Undertone | undefined>('neutral');

  const result = useMemo(() => shadeMatch(tone, undertone), [tone, undertone]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space(10) }} showsVerticalScrollIndicator={false}>
        {/* Cover — clay (makeup identity) */}
        <View style={{ backgroundColor: palette.makeup, paddingTop: insets.top + space(4), paddingHorizontal: space(5), paddingBottom: space(6) }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={20} color={palette.white} />
          </Pressable>
          <View style={{ marginTop: space(5), alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 5 }}>
            <Sparkles size={12} color={palette.white} />
            <Text style={{ fontSize: 11, fontWeight: '800', color: palette.white, letterSpacing: 1.4, textTransform: 'uppercase' }}>The wedge</Text>
          </View>
          <Text style={{ marginTop: space(3), fontSize: 31, fontWeight: '700', color: palette.white, letterSpacing: -0.5 }}>Shade Match</Text>
          <Text style={{ marginTop: 4, fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.9)', lineHeight: 20 }}>
            Color that actually suits your skin — foundation, concealer, blush & lip.
          </Text>
        </View>

        {/* Your skin — editable tone + undertone */}
        <View style={{ paddingHorizontal: space(5), paddingTop: space(5) }}>
          <View style={{ borderRadius: 20, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, padding: space(4) }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: palette.muted, letterSpacing: 1.2, textTransform: 'uppercase' }}>Your skin</Text>

            <Text style={{ marginTop: 10, fontSize: 12.5, fontWeight: '700', color: palette.ink }}>Tone</Text>
            <View style={{ marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {TONES.map((t) => (
                <Chip key={t} on={tone === t} onPress={() => setTone(t)} label={TONE_LABEL[t]} />
              ))}
            </View>

            <Text style={{ marginTop: 12, fontSize: 12.5, fontWeight: '700', color: palette.ink }}>Undertone</Text>
            <View style={{ marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {UNDERTONES.map((u) => (
                <Chip key={u} on={undertone === u} onPress={() => setUndertone(u)} label={UNDERTONE_LABEL[u]} />
              ))}
            </View>

            {!tone ? (
              <Text style={{ marginTop: 12, fontSize: 12.5, color: palette.muted, lineHeight: 18 }}>
                Pick your tone & undertone to see shade-matched picks. (In the full app, a selfie sets these automatically.)
              </Text>
            ) : null}
          </View>
        </View>

        {/* People with your skin — wrapping row (few fans; avoids nested horizontal scroll) */}
        {result.fans.length > 0 ? (
          <View style={{ marginTop: space(5), paddingHorizontal: space(5) }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: palette.muted, letterSpacing: 1.2, textTransform: 'uppercase' }}>People with your skin</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: space(3) }}>
              {result.fans.map((p) => (
                <Pressable key={p.id} onPress={() => router.push({ pathname: '/person/[id]', params: { id: p.id } })} style={{ width: 64, alignItems: 'center' }}>
                  <Avatar name={p.name} tint={p.tint} size={56} />
                  <Text numberOfLines={1} style={{ marginTop: 6, fontSize: 12, fontWeight: '500', color: palette.ink, maxWidth: 64 }}>{p.name.split(' ')[0]}</Text>
                  {p.tone ? (
                    <Text style={{ fontSize: 10.5, color: palette.muted }}>{TONE_LABEL[p.tone].toLowerCase()}{p.undertone ? ` · ${p.undertone}` : ''}</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Shade-matched picks by category */}
        {tone ? (
          <View style={{ marginTop: space(5), paddingHorizontal: space(5) }}>
            <Text style={{ marginBottom: 10, fontSize: 13, fontWeight: '800', color: palette.muted, letterSpacing: 1.2, textTransform: 'uppercase' }}>Your matches</Text>
            <View style={{ gap: 16 }}>
              {result.byCategory.map(({ category, picks }) => (
                <View key={category}>
                  <Text style={{ marginBottom: 6, fontSize: 12.5, fontWeight: '800', color: palette.ink }}>{categoryLabel(category)}</Text>
                  <View style={{ gap: 8 }}>
                    {picks.map((pick) => (
                      <Pressable
                        key={pick.product.id}
                        onPress={() => router.push({ pathname: '/product/[id]', params: { id: pick.product.id } })}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, padding: 10 }}
                      >
                        <ProductImage id={pick.product.id} brand={pick.product.brand} image={pick.product.image} width={56} height={56} radius={14} />
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={{ fontSize: 14.5, fontWeight: '700', color: palette.ink }}>{pick.product.name}</Text>
                          <Text style={{ fontSize: 12, color: palette.muted, marginTop: 1 }}>{pick.product.brand}{pick.product.price ? ` · $${pick.product.price}` : ''}</Text>
                          <Text style={{ marginTop: 4, fontSize: 12, color: palette.makeupInk, lineHeight: 16 }}>{pick.reason}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          <View style={{ borderRadius: 999, backgroundColor: palette.makeup, paddingHorizontal: 8, paddingVertical: 2 }}>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: palette.white }}>{pick.fit}</Text>
                          </View>
                          <ChevronRight size={16} color={palette.muted} />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <Text style={{ marginTop: 16, textAlign: 'center', fontSize: 11.5, color: palette.muted }}>
              Shade fit is a guide, not a guarantee — always test in daylight. Prototype data.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Chip({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: on ? palette.makeup : 'rgba(46,46,46,0.05)' }}
    >
      <Text style={{ fontSize: 13, fontWeight: '500', color: on ? palette.white : palette.ink }}>{label}</Text>
    </Pressable>
  );
}
