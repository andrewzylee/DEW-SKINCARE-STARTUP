import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { Text } from '@/components/Text';
import { people } from '@/core/socialSource';
import { font, hitSlopFor, palette, radius, space } from '@/core/theme';
import { useFollowing } from '@/data/follow-store';

// Followers / Following — the Profile stats open this. Ported from the web Profile peopleSheet.
// The follow toggle writes to the shared store, so the Feed's Following tab reflects it.
export default function PeopleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { type, count } = useLocalSearchParams<{ type?: string; count?: string }>();
  const viewingFollowing = type === 'following';
  const title = `${count ?? people.length} ${viewingFollowing ? 'following' : 'followers'}`;
  const { isFollowing, toggleFollow } = useFollowing();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + space(4), paddingHorizontal: space(5), paddingBottom: space(2) }}>
        <Pressable onPress={() => router.back()} hitSlop={hitSlopFor(22)} accessibilityRole="button" accessibilityLabel="Back"><ArrowLeft size={22} color={palette.ink} /></Pressable>
        <Text accessibilityRole="header" style={{ fontFamily: font.display, fontSize: font.size.title, fontWeight: '600', color: palette.ink, textTransform: 'capitalize' }}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: insets.bottom + space(8) }} showsVerticalScrollIndicator={false}>
        {people.map((p) => {
          const followed = isFollowing(p.id);
          return (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
              <Pressable
                onPress={() => router.push({ pathname: '/person/[id]', params: { id: p.id } })}
                accessibilityRole="button"
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <Avatar name={p.name} tint={p.tint} size={48} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontSize: font.size.base, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
                  <Text numberOfLines={1} style={{ fontSize: font.size.sm, color: palette.muted }}>@{p.handle}</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => toggleFollow(p.id)}
                accessibilityRole="button"
                accessibilityLabel={`${followed ? 'Following' : viewingFollowing ? 'Follow' : 'Follow back'}, ${p.name}`}
                accessibilityState={{ selected: followed }}
                hitSlop={8}
                style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: followed ? palette.line : palette.accent, backgroundColor: followed ? 'transparent' : palette.accent, paddingHorizontal: 14, paddingVertical: 7 }}
              >
                <Text style={{ fontSize: font.size.sm, fontWeight: '700', color: followed ? palette.ink : palette.white }}>{followed ? 'Following' : viewingFollowing ? 'Follow' : 'Follow back'}</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
