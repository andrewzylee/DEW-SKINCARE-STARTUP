import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, ChevronRight, Info, LogOut, Pencil, Shield, X, type LucideIcon } from 'lucide-react-native';

import { useAuth } from '@/core/auth';
import { palette, radius, space } from '@/core/theme';

function Row({ icon: Icon, label, onPress, border, danger }: { icon: LucideIcon; label: string; onPress: () => void; border?: boolean; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15, borderTopWidth: border ? 1 : 0, borderTopColor: palette.line }}>
      <Icon size={18} color={danger ? palette.tierF : palette.accent} />
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: danger ? palette.tierF : palette.ink }}>{label}</Text>
      {!danger ? <ChevronRight size={17} color={palette.muted} /> : null}
    </Pressable>
  );
}

export default function Menu() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut, isDemo } = useAuth();
  const soon = (label: string) => Alert.alert(label, 'Coming soon.');

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space(3), paddingHorizontal: space(5) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: palette.ink }}>Settings</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}><X size={24} color={palette.muted} /></Pressable>
      </View>

      <View style={{ marginTop: space(4), backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.line, overflow: 'hidden' }}>
        <Row icon={Pencil} label="Edit profile" onPress={() => { router.back(); router.push('/edit-profile'); }} />
        <Row icon={Bell} label="Notifications" onPress={() => soon('Notifications')} border />
        <Row icon={Shield} label="Privacy & data" onPress={() => soon('Privacy & data')} border />
        <Row icon={Info} label="About Dew" onPress={() => Alert.alert('Dew', 'Beli for Beauty — rank what you love, see what your people trust.')} border />
      </View>

      {!isDemo ? (
        <View style={{ marginTop: space(4), backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.line, overflow: 'hidden' }}>
          <Row icon={LogOut} label="Sign out" onPress={async () => { await signOut(); router.back(); }} danger />
        </View>
      ) : (
        <Text style={{ marginTop: space(4), textAlign: 'center', fontSize: 12.5, color: palette.muted }}>You're in Demo Mode. Add Supabase keys to enable real accounts.</Text>
      )}
    </View>
  );
}
