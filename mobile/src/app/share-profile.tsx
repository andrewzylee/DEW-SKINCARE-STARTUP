import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Link2, X } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { Text } from '@/components/Text';
import { useProfile } from '@/data/profile-store';
import { font, palette, space } from '@/core/theme';

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
        <Text accessibilityRole="header" style={{ fontFamily: font.display, fontSize: font.size.title, fontWeight: '600', color: palette.ink }}>Share profile</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close"><X size={24} color={palette.muted} /></Pressable>
      </View>

      <View style={{ alignItems: 'center', marginTop: space(6) }}>
        <Avatar name={profile?.display_name ?? 'You'} src={profile?.avatar_url} size={88} />
        <Text style={{ marginTop: space(3), fontFamily: font.display, fontSize: font.size.title, fontWeight: '600', color: palette.ink }}>{profile?.display_name ?? 'You'}</Text>
        <Text style={{ fontSize: font.size.base, color: palette.muted }}>@{handle}</Text>
      </View>

      <Pressable onPress={copy} accessibilityRole="button" accessibilityLabel={copied ? `Copied ${link}` : `Copy profile link, ${link}`} style={{ marginTop: space(6), flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 }}>
        <Link2 size={16} color={palette.muted} />
        <Text style={{ flex: 1, fontSize: font.size.base, color: palette.ink }}>{link}</Text>
        <Text style={{ fontSize: font.size.sm, fontWeight: '700', color: copied ? palette.accent : palette.muted }}>{copied ? 'Copied' : 'Copy'}</Text>
      </Pressable>

      <Text style={{ marginTop: space(4), textAlign: 'center', fontSize: font.size.sm, color: palette.muted }}>Share your Dew profile so friends can see your rankings.</Text>
    </View>
  );
}
