import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Database, Eye, Lock, Trash2, X } from 'lucide-react-native';

import { useAuth } from '@/core/auth';
import { palette, radius, space } from '@/core/theme';
import { clearAll } from '@/data/local';
import { isSupabaseConfigured } from '@/data/config';

// Privacy & data — what the app actually stores and who can read it. This describes the current
// behaviour; it is NOT a legal privacy policy, and one still has to be written before launch
// (sign-in already claims agreement to documents that don't exist yet).
export default function Privacy() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDemo } = useAuth();

  const resetLocal = () => {
    Alert.alert('Reset local data?', 'Clears your shelf, profile, skin profile, follows and trials from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await clearAll();
          Alert.alert('Cleared', 'Restart the app to start fresh.');
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space(3) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5) }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: palette.ink }}>Privacy & data</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <X size={24} color={palette.muted} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space(5), paddingTop: space(4), paddingBottom: insets.bottom + space(8) }}>
        <Section
          Icon={Lock}
          title="Private to you"
          body="Your skin profile, daily logs and trials are yours alone. No one else can read them — not your followers, not your taste twins."
        />
        <Section
          Icon={Eye}
          title="Visible to followers"
          body="Your shelf, your rankings and your posts. Followers can read them; nobody can write to them but you."
        />
        <Section
          Icon={Database}
          title="Where it's stored"
          body={
            isSupabaseConfigured
              ? 'On Dew’s server, with row-level security enforced in the database — the rules hold no matter what this app does.'
              : 'Only on this device. Dew is running in Demo Mode with no backend connected, so nothing you enter leaves your phone.'
          }
        />
        <Section Icon={Lock} title="No face, no photos" body="Shade Match works from the tone and undertone you pick yourself. Dew never asks for a selfie." />

        <Pressable
          onPress={resetLocal}
          style={{ marginTop: space(5), flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: palette.line, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 14 }}
        >
          <Trash2 size={17} color={palette.tierF} />
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: palette.tierF }}>Reset data on this device</Text>
        </Pressable>

        <Text style={{ marginTop: space(5), fontSize: 12, lineHeight: 18, color: palette.muted }}>
          {isDemo ? 'Demo Mode — sample social data is bundled with the app and isn’t connected to real people. ' : ''}
          This screen describes how Dew handles data today. A full privacy policy and terms of service still need to be published
          before launch.
        </Text>
      </ScrollView>
    </View>
  );
}

function Section({ Icon, title, body }: { Icon: typeof Lock; title: string; body: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: space(4) }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: palette.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={palette.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: palette.ink }}>{title}</Text>
        <Text style={{ marginTop: 3, fontSize: 13.5, lineHeight: 19.5, color: palette.muted }}>{body}</Text>
      </View>
    </View>
  );
}
