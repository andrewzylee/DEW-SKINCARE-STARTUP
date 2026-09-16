import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FlaskConical, ListChecks, Plus, Star, X, type LucideIcon } from 'lucide-react-native';
import { palette, space } from '@/core/theme';

export default function AddSheet() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // The center ＋ menu — routes to the core habit loop (rate → log → add → trial).
  const items: { icon: LucideIcon; label: string; sub: string; onPress: () => void; primary?: boolean }[] = [
    { icon: Star, label: 'Rate a product', sub: 'Rank something you’ve tried', primary: true, onPress: () => router.replace('/shelf') },
    { icon: ListChecks, label: 'Log today’s routine', sub: 'Check in & keep your streak', onPress: () => router.replace('/log') },
    { icon: Plus, label: 'Add a product', sub: 'Not on Dew yet? Add it', onPress: () => router.replace('/add-product') },
    { icon: FlaskConical, label: 'Start a trial', sub: 'Track a product over time', onPress: () => router.replace('/shelf') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space(3), paddingHorizontal: space(5) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: palette.ink }}>What do you want to do?</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <X size={24} color={palette.muted} />
        </Pressable>
      </View>

      <View style={{ marginTop: space(4), gap: space(2) }}>
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Pressable key={it.label} onPress={it.onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, padding: 14, opacity: pressed ? 0.9 : 1 })}>
              <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: it.primary ? palette.accent : palette.accentSoft }}>
                <Icon size={20} color={it.primary ? palette.white : palette.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15.5, fontWeight: '600', color: palette.ink }}>{it.label}</Text>
                <Text style={{ fontSize: 12.5, color: palette.muted, marginTop: 1 }}>{it.sub}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
