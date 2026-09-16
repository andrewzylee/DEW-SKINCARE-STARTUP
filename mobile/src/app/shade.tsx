import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, X } from 'lucide-react-native';
import { palette, space } from '@/core/theme';

export default function Shade() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space(3), paddingHorizontal: space(5) }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => router.back()} hitSlop={10}><X size={24} color={palette.muted} /></Pressable>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: palette.makeupSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={28} color={palette.makeupInk} />
        </View>
        <Text style={{ marginTop: space(4), fontSize: 24, fontWeight: '700', color: palette.ink }}>Shade Match</Text>
        <Text style={{ marginTop: space(2), fontSize: 14, color: palette.muted, textAlign: 'center', lineHeight: 20, maxWidth: 300 }}>
          Foundation, concealer & blush matched to your tone & undertone — rebuilt from the web reference next.
        </Text>
      </View>
    </View>
  );
}
