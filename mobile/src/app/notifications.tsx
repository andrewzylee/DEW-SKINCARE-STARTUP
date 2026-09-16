import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeft, Flame, Heart, MessageCircle, Sparkles, UserPlus } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { getPerson } from '@/core/social';
import { palette, radius, space } from '@/core/theme';

// Notifications — social pings derived from the sample graph (demo). The Feed bell opens this.
type Kind = 'follow' | 'like' | 'comment' | 'twin' | 'milestone';
interface Notif {
  id: string;
  kind: Kind;
  personId?: string;
  action: string; // text after the name
  time: string;
  unread?: boolean;
  href: Href;
}

const NOTIFS: Notif[] = [
  { id: 'n1', kind: 'like', personId: 'emily', action: 'liked your ranking of Glossier Skin Tint', time: '12m', unread: true, href: { pathname: '/person/[id]', params: { id: 'emily' } } },
  { id: 'n2', kind: 'follow', personId: 'marcus', action: 'started following you', time: '1h', href: { pathname: '/person/[id]', params: { id: 'marcus' } } },
  { id: 'n3', kind: 'comment', personId: 'priya', action: 'commented: “Same skin type — trying this next.”', time: '3h', href: { pathname: '/person/[id]', params: { id: 'priya' } } },
  { id: 'n4', kind: 'twin', personId: 'theo', action: 'is a new taste twin — 78% match', time: '5h', href: { pathname: '/person/[id]', params: { id: 'theo' } } },
  { id: 'n5', kind: 'follow', personId: 'devon', action: 'started following you', time: '1d', href: { pathname: '/person/[id]', params: { id: 'devon' } } },
  { id: 'n6', kind: 'milestone', action: 'You hit a 5-day streak 🔥 Keep it going', time: '2d', href: '/calendar' },
];

const KIND_ICON = { follow: UserPlus, like: Heart, comment: MessageCircle, twin: Sparkles, milestone: Flame } as const;
const KIND_TINT = { follow: palette.accent, like: palette.tierF, comment: palette.tierB, twin: palette.makeup, milestone: palette.makeup } as const;

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + space(4), paddingHorizontal: space(5), paddingBottom: space(2) }}>
        <Pressable onPress={() => router.back()} hitSlop={8}><ArrowLeft size={22} color={palette.ink} /></Pressable>
        <Text style={{ fontSize: 22, fontWeight: '800', color: palette.ink }}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: insets.bottom + space(8) }} showsVerticalScrollIndicator={false}>
        {NOTIFS.map((n) => {
          const person = n.personId ? getPerson(n.personId) : undefined;
          const Icon = KIND_ICON[n.kind];
          const first = person?.name.split(' ')[0];
          return (
            <Pressable
              key={n.id}
              onPress={() => router.push(n.href)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.lg, backgroundColor: n.unread ? palette.accentSoft : palette.surface, borderWidth: 1, borderColor: n.unread ? 'transparent' : palette.line, padding: 12, marginBottom: 8 }}
            >
              <View>
                {person ? (
                  <Avatar name={person.name} tint={person.tint} size={44} />
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.makeupSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={KIND_TINT[n.kind]} />
                  </View>
                )}
                {person ? (
                  <View style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: KIND_TINT[n.kind], alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: palette.bg }}>
                    <Icon size={10} color={palette.white} />
                  </View>
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14.5, color: palette.ink, lineHeight: 20 }}>
                  {first ? <Text style={{ fontWeight: '700' }}>{first} </Text> : null}
                  {n.action}
                </Text>
                <Text style={{ fontSize: 12, color: palette.muted, marginTop: 1 }}>{n.time}</Text>
              </View>
              {n.unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: palette.accent }} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
