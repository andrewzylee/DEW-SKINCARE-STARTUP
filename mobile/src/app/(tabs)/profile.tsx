import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AtSign,
  BarChart3,
  Camera,
  ChevronRight,
  Droplet,
  FlaskConical,
  Globe,
  Layers,
  ListChecks,
  Menu,
  Share2,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { ProductImage } from '@/components/ProductImage';
import { useAuth } from '@/core/auth';
import { categoryDomain, categoryLabel, getProduct } from '@/core/catalog';
import { routineAM, routinePM, sampleTrials } from '@/core/shelfData';
import { archetypeOf, tasteItemsFromIds } from '@/core/taste';
import { palette, radius, space } from '@/core/theme';
import { useMyShelf } from '@/data/hooks';
import { useProfile } from '@/data/profile-store';

// Demo stat values (would be derived server-side in real mode).
const DEMO = { followers: 18, following: 27, streak: 5, daysLogged: 12 };

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut, isDemo } = useAuth();
  const { profile } = useProfile();
  const { shelf } = useMyShelf();

  const archetype = useMemo(() => archetypeOf(tasteItemsFromIds(shelf)), [shelf]);
  const counts = useMemo(() => {
    let makeup = 0;
    let skincare = 0;
    let fragrance = 0;
    shelf.forEach((id) => {
      const p = getProduct(id);
      if (!p) return;
      const d = p.domain ?? categoryDomain(p.category);
      if (d === 'makeup') makeup += 1;
      else if (d === 'fragrance') fragrance += 1;
      else skincare += 1;
    });
    return { makeup, skincare, fragrance };
  }, [shelf]);

  const routineCount = new Set([...routineAM, ...routinePM]).size;
  const name = profile?.display_name ?? 'You';
  const handle = profile?.handle ?? 'you';
  const memberSince = formatMonth(profile?.member_since);
  const recent = shelf.slice(0, 3);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: space(8) }} showsVerticalScrollIndicator={false}>
        <View style={{ width: '100%', maxWidth: 520, paddingHorizontal: space(5), paddingTop: insets.top + space(4) }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 27, fontWeight: '700', color: palette.ink }}>{name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Pressable onPress={() => router.push('/share-profile')} hitSlop={8}><Share2 size={20} color={palette.muted} /></Pressable>
              <Pressable onPress={() => router.push('/menu')} hitSlop={8}><Menu size={22} color={palette.muted} /></Pressable>
            </View>
          </View>

          {/* Identity */}
          <View style={{ alignItems: 'center', paddingTop: space(3) }}>
            <View>
              <Avatar name={name} src={profile?.avatar_url} size={96} />
              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: palette.bg }}>
                <Camera size={14} color={palette.white} />
              </View>
            </View>
            <Text style={{ marginTop: space(3), fontSize: 16, fontWeight: '700', color: palette.ink }}>@{handle}</Text>
            <Text style={{ marginTop: 2, fontSize: 12.5, color: palette.muted }}>Member since {memberSince}</Text>
            {isDemo ? (
              <View style={{ marginTop: space(2), borderRadius: 999, backgroundColor: palette.accentSoft, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: palette.accentInk }}>DEMO MODE</Text>
              </View>
            ) : null}
            <Text style={{ marginTop: space(2), fontSize: 13, fontWeight: '500', color: palette.accent }}>+ Add a bio</Text>
            <View style={{ marginTop: space(3), flexDirection: 'row', gap: 8 }}>
              {[AtSign, Globe].map((Icon, i) => (
                <View key={i} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: palette.line, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={palette.muted} />
                </View>
              ))}
            </View>
          </View>

          {/* Stats */}
          <View style={{ marginTop: space(5), flexDirection: 'row', alignItems: 'stretch' }}>
            <Stat label="Followers" value={DEMO.followers} />
            <View style={{ width: 1, backgroundColor: palette.line, marginVertical: 4 }} />
            <Stat label="Following" value={DEMO.following} />
            <View style={{ width: 1, backgroundColor: palette.line, marginVertical: 4 }} />
            <Stat label="Day streak" value={DEMO.streak} />
          </View>

          {/* Actions */}
          <View style={{ marginTop: space(4), flexDirection: 'row', gap: 8 }}>
            <SecondaryButton label="Edit profile" onPress={() => router.push('/edit-profile')} />
            <SecondaryButton label="Share profile" onPress={() => router.push('/share-profile')} />
          </View>

          {/* Invite friends */}
          <Card icon={UserPlus} eyebrow="Invite friends" title="Bring your people to Dew" sub="Share your link & rank beauty together" onPress={() => router.push('/invite')} />

          {/* Your beauty taste */}
          <Pressable onPress={() => router.push('/shelf')} style={cardStyle}>
            <IconCircle Icon={Sparkles} />
            <View style={{ flex: 1 }}>
              <Text style={eyebrowStyle}>Your beauty taste</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: palette.ink, marginTop: 2 }}>{archetype}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6, maxWidth: 130 }}>
              <Pill text={`${counts.makeup} makeup`} bg={palette.makeupSoft} color={palette.makeupInk} />
              {counts.fragrance > 0 ? <Pill text={`${counts.fragrance} scent`} bg="rgba(46,46,46,0.06)" color={palette.ink} /> : null}
              <Pill text={`${counts.skincare} skin`} bg={palette.accentSoft} color={palette.accentInk} />
            </View>
          </Pressable>

          {/* Skin profile */}
          <Pressable onPress={() => router.push('/shade')} style={cardStyle}>
            <IconCircle Icon={Droplet} bg={palette.makeupSoft} color={palette.makeupInk} />
            <View style={{ flex: 1 }}>
              <Text style={eyebrowStyle}>Skin profile</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: palette.ink, marginTop: 2 }}>Combination · Medium · Neutral</Text>
              <Text style={{ fontSize: 12.5, color: palette.muted, marginTop: 1 }}>Find your foundation & concealer match</Text>
            </View>
            <ChevronRight size={18} color={palette.muted} />
          </Pressable>

          {/* Beauty Wrapped */}
          <Pressable onPress={() => router.push('/wrapped')} style={{ marginTop: space(3), flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.accent, borderRadius: radius.lg, padding: space(4) }}>
            <Sparkles size={22} color={palette.white} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: palette.white }}>Your Beauty Wrapped</Text>
              <Text style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.9)', marginTop: 1 }}>A year of your beauty, in numbers.</Text>
            </View>
            <ChevronRight size={18} color={palette.white} />
          </Pressable>

          {/* Streak / activity */}
          <View style={{ marginTop: space(4), flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.line, padding: space(4) }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: palette.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: palette.accent }}>{DEMO.streak}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: palette.ink }}>{DEMO.streak}-day streak 🔥</Text>
              <Text style={{ fontSize: 13, color: palette.muted }}>{DEMO.daysLogged} check-ins · keep it going</Text>
            </View>
            <Pressable onPress={() => router.push('/add')} style={{ borderRadius: 999, backgroundColor: palette.accent, paddingHorizontal: 16, paddingVertical: 9 }}>
              <Text style={{ color: palette.white, fontWeight: '700', fontSize: 13 }}>Log</Text>
            </Pressable>
          </View>

          {/* Lists */}
          <View style={{ marginTop: space(4), backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.line, overflow: 'hidden' }}>
            <ListRow icon={BarChart3} label="Ranked" value={shelf.length} onPress={() => router.push('/shelf')} />
            <ListRow icon={Layers} label="In your routine" value={routineCount} onPress={() => router.push('/shelf')} border />
            <ListRow icon={ListChecks} label="Days logged" value={DEMO.daysLogged} onPress={() => router.push('/add')} border />
            <ListRow icon={FlaskConical} label="Trials" value={sampleTrials.length} onPress={() => router.push('/shelf')} border />
          </View>

          {/* Recent activity */}
          <Text style={{ marginTop: space(6), fontSize: 13, fontWeight: '800', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.4 }}>Recent activity</Text>
          <View style={{ marginTop: space(2) }}>
            {recent.map((id, i) => {
              const p = getProduct(id);
              if (!p) return null;
              return (
                <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: palette.line }}>
                  <ProductImage id={p.id} brand={p.brand} image={p.image} width={40} height={40} radius={12} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14.5, color: palette.ink }}>
                      <Text style={{ fontWeight: '700' }}>You</Text> ranked <Text style={{ fontWeight: '700' }}>{p.name}</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: palette.muted, marginTop: 1 }}>{categoryLabel(p.category)}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {!isDemo ? (
            <Pressable onPress={signOut} style={{ marginTop: space(5), alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: palette.line, paddingVertical: 10, paddingHorizontal: 18 }}>
              <Text style={{ color: palette.ink, fontWeight: '600', fontSize: 14 }}>Sign out</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const cardStyle = {
  marginTop: space(3),
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
  backgroundColor: palette.surface,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: palette.line,
  padding: space(4),
};
const eyebrowStyle = { fontSize: 11, fontWeight: '700' as const, color: palette.muted, textTransform: 'uppercase' as const, letterSpacing: 1 };

function IconCircle({ Icon, bg = palette.accentSoft, color = palette.accent }: { Icon: LucideIcon; bg?: string; color?: string }) {
  return (
    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={19} color={color} />
    </View>
  );
}

function Card({ icon: Icon, eyebrow, title, sub, onPress }: { icon: LucideIcon; eyebrow: string; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={cardStyle}>
      <IconCircle Icon={Icon} />
      <View style={{ flex: 1 }}>
        <Text style={eyebrowStyle}>{eyebrow}</Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: palette.ink, marginTop: 2 }}>{title}</Text>
        <Text style={{ fontSize: 12.5, color: palette.muted, marginTop: 1 }}>{sub}</Text>
      </View>
      <ChevronRight size={18} color={palette.muted} />
    </Pressable>
  );
}

function Pill({ text, bg, color }: { text: string; bg: string; color: string }) {
  return (
    <View style={{ borderRadius: 999, backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 4 }}>
      <Text style={{ fontSize: 11.5, fontWeight: '700', color }}>{text}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: palette.ink }}>{value}</Text>
      <Text style={{ marginTop: 3, fontSize: 12, color: palette.muted }}>{label}</Text>
    </View>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', backgroundColor: 'rgba(46,46,46,0.05)', borderRadius: 999, paddingVertical: 12 }}>
      <Text style={{ fontSize: 14.5, fontWeight: '700', color: palette.ink }}>{label}</Text>
    </Pressable>
  );
}

function ListRow({ icon: Icon, label, value, onPress, border }: { icon: LucideIcon; label: string; value: number; onPress: () => void; border?: boolean }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: border ? 1 : 0, borderTopColor: palette.line }}>
      <Icon size={18} color={palette.accent} />
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: palette.ink }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: palette.muted }}>{value}</Text>
      <ChevronRight size={17} color={palette.muted} />
    </Pressable>
  );
}

function formatMonth(iso?: string): string {
  if (!iso) return 'September 2026';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'September 2026';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
