import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { people } from '@/core/social';
import { palette, radius, space } from '@/core/theme';

// Followers / Following — the Profile stats open this. Ported from the web Profile peopleSheet.
export default function PeopleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { type, count } = useLocalSearchParams<{ type?: string; count?: string }>();
  const following = type === 'following';
  const title = `${count ?? people.length} ${following ? 'following' : 'followers'}`;

  // Followers default to not-yet-followed-back; following default to followed. Toggle locally.
  const [followed, setFollowed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(people.map((p) => [p.id, following])),
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + space(4), paddingHorizontal: space(5), paddingBottom: space(2) }}>
        <Pressable onPress={() => router.back()} hitSlop={8}><ArrowLeft size={22} color={palette.ink} /></Pressable>
        <Text style={{ fontSize: 22, fontWeight: '800', color: palette.ink, textTransform: 'capitalize' }}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: insets.bottom + space(8) }} showsVerticalScrollIndicator={false}>
        {people.map((p) => {
          const isFollowing = followed[p.id];
          return (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
              <Pressable
                onPress={() => router.push({ pathname: '/person/[id]', params: { id: p.id } })}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <Avatar name={p.name} tint={p.tint} size={48} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: palette.ink }}>{p.name}</Text>
                  <Text numberOfLines={1} style={{ fontSize: 12.5, color: palette.muted }}>@{p.handle}</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => setFollowed((f) => ({ ...f, [p.id]: !f[p.id] }))}
                style={{ borderRadius: radius.pill, borderWidth: 1, borderColor: isFollowing ? palette.line : palette.accent, backgroundColor: isFollowing ? 'transparent' : palette.accent, paddingHorizontal: 14, paddingVertical: 7 }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: isFollowing ? palette.ink : palette.white }}>{isFollowing ? 'Following' : 'Follow back'}</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
