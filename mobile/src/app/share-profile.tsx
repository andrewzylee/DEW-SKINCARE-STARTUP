import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Link2, X } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { useProfile } from '@/data/profile-store';
import { palette, space } from '@/core/theme';

export default function ShareProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useProfile();
  const handle = profile?.handle ?? 'you';
  const link = `dew.app/@${handle}`;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space(3), paddingHorizontal: space(5) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: palette.ink }}>Share profile</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}><X size={24} color={palette.muted} /></Pressable>
      </View>

      <View style={{ alignItems: 'center', marginTop: space(6) }}>
        <Avatar name={profile?.display_name ?? 'You'} src={profile?.avatar_url} size={88} />
        <Text style={{ marginTop: space(3), fontSize: 18, fontWeight: '700', color: palette.ink }}>{profile?.display_name ?? 'You'}</Text>
        <Text style={{ fontSize: 14, color: palette.muted }}>@{handle}</Text>
      </View>

      <Pressable onPress={copy} style={{ marginTop: space(6), flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 }}>
        <Link2 size={16} color={palette.muted} />
        <Text style={{ flex: 1, fontSize: 14, color: palette.ink }}>{link}</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: copied ? palette.accent : palette.muted }}>{copied ? 'Copied' : 'Copy'}</Text>
      </Pressable>

      <Text style={{ marginTop: space(4), textAlign: 'center', fontSize: 12.5, color: palette.muted }}>Share your Dew profile so friends can see your rankings.</Text>
    </View>
  );
}
