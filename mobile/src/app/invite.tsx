import { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Link2, Send, UserPlus, X } from 'lucide-react-native';

import { Text } from '@/components/Text';
import { useProfile } from '@/data/profile-store';
import { font, palette, radius, space } from '@/core/theme';

export default function Invite() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useProfile();
  const handle = profile?.handle ?? 'you';
  const link = `dew.app/join/@${handle}`;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  // The primary button used to just copy — open the real share sheet, falling back to the
  // clipboard if the platform can't share (web without navigator.share).
  const share = async () => {
    try {
      await Share.share({ message: `Rank beauty with me on Dew — ${link}` });
    } catch {
      await copy();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space(3), paddingHorizontal: space(5) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text accessibilityRole="header" style={{ fontFamily: font.display, fontSize: font.size.title, fontWeight: '600', color: palette.ink }}>Invite friends</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close"><X size={24} color={palette.muted} /></Pressable>
      </View>

      <View style={{ marginTop: space(4), backgroundColor: palette.accentSoft, borderRadius: 18, padding: space(4) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <UserPlus size={16} color={palette.accentInk} />
          <Text style={{ fontSize: font.size.base, fontWeight: '700', color: palette.accentInk }}>Bring your people to Dew</Text>
        </View>
        <Text style={{ marginTop: 6, fontSize: font.size.sm, lineHeight: 19, color: palette.accentInk }}>
          Share your link — when friends join, their ranks show up in your feed and taste twins.
        </Text>
      </View>

      <Pressable onPress={copy} accessibilityRole="button" accessibilityLabel={copied ? `Copied ${link}` : `Copy invite link, ${link}`} style={{ marginTop: space(4), flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 }}>
        <Link2 size={16} color={palette.muted} />
        <Text style={{ flex: 1, fontSize: font.size.base, color: palette.ink }}>{link}</Text>
        <Text style={{ fontSize: font.size.sm, fontWeight: '700', color: copied ? palette.accent : palette.muted }}>{copied ? 'Copied' : 'Copy'}</Text>
      </Pressable>

      <Pressable onPress={share} accessibilityRole="button" style={{ marginTop: space(4), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: palette.accent, borderRadius: radius.pill, paddingVertical: 15 }}>
        <Send size={16} color={palette.white} />
        <Text style={{ color: palette.white, fontSize: font.size.lg, fontWeight: '700' }}>Share invite link</Text>
      </Pressable>
    </View>
  );
}
