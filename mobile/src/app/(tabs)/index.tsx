import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Bookmark, Calendar, Crown, Heart, MessageCircle, Search, Send } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { ProductImage } from '@/components/ProductImage';
import { Text } from '@/components/Text';
import { TAB_LIST_ROLE } from '@/core/a11y';
import { categoryLabel, getProduct } from '@/core/catalog';
import { tierInk } from '@/core/ranking';
import { feed, friendShelves, getPerson, myShelf, people, rankMoves, usingDemoGraph } from '@/core/socialSource';
import { friendRankedShelf, tasteItemsFromIds, tasteMatchWithFriend } from '@/core/taste';
import { font, hitSlopFor, palette, radius, space } from '@/core/theme';
import type { Product, Tier } from '@/core/types';
import { useFollowing } from '@/data/follow-store';

// Curated benefit chips for the skincare heroes (display-only, mirrors the web reference).
const FEED_TAGS: Record<string, string[]> = {
  'cerave-foaming-cleanser': ['Gentle', 'Non-drying', 'For oily skin'],
  'differin-adapalene': ['Acne', 'Texture', 'Derm-loved'],
  'boj-relief-sun': ['No white cast', 'Lightweight'],
  'ordinary-niacinamide': ['Budget', 'Oil control'],
  'paulas-choice-bha': ['Smoothing', 'Cult'],
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const tagsFor = (p: Product): string[] => FEED_TAGS[p.id] ?? (p.styleTags ?? []).slice(0, 3).map(cap);
const fmtCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n));
const parseMins = (s: string): number => {
  const m = s.match(/(\d+)\s*(m|min|h|hour|d|day|w|week)/i);
  if (!m) return 99999;
  const n = Number(m[1]);
  const u = m[2][0].toLowerCase();
  return u === 'm' ? n : u === 'h' ? n * 60 : u === 'd' ? n * 1440 : n * 10080;
};

interface CardData {
  key: string;
  postId: string;
  personId: string;
  name: string;
  tint?: string;
  productId: string;
  verb: string;
  mins: number;
  rankPos?: number;
  isTop?: boolean;
  grade?: Tier;
  deltaText?: string;
  quote?: string;
  timeAgo: string;
  baseLikes: number;
  matchPct: number;
  faces: { name: string; tint?: string }[];
}

const myTaste = tasteItemsFromIds(myShelf);
const facesFor = (pid: string, productId: string) =>
  people
    .filter((pp) => pp.id !== pid && (friendShelves[pp.id] ?? []).includes(productId))
    .slice(0, 3)
    .map((pp) => ({ name: pp.name, tint: pp.tint }));
const rankOf = (pid: string, productId: string): number | undefined =>
  friendRankedShelf(pid).find((r) => r.productId === productId)?.groupRank;

function buildEntries(): CardData[] {
  const posts: CardData[] = feed.map((a) => {
    const person = getPerson(a.personId);
    const pos = rankOf(a.personId, a.productId);
    return {
      key: `p-${a.id}`,
      postId: a.id,
      personId: a.personId,
      name: person?.name ?? 'Someone',
      tint: person?.tint,
      productId: a.productId,
      verb: 'ranked a product',
      mins: parseMins(a.timeAgo),
      rankPos: pos,
      isTop: pos === 1,
      grade: a.tier,
      quote: a.standout ?? a.note,
      timeAgo: a.timeAgo,
      baseLikes: a.likes,
      matchPct: tasteMatchWithFriend(myTaste, a.personId).score,
      faces: facesFor(a.personId, a.productId),
    };
  });
  const moves: CardData[] = rankMoves.map((m) => {
    const person = getPerson(m.personId);
    const isNew = m.fromRank == null;
    const up = !isNew && m.toRank < (m.fromRank as number);
    return {
      key: `m-${m.id}`,
      postId: m.id,
      personId: m.personId,
      name: person?.name ?? 'Someone',
      tint: person?.tint,
      productId: m.productId,
      verb: isNew ? (m.toRank === 1 ? 'ranked a new #1' : 'ranked a product') : up ? 'moved a pick up' : 're-ranked a product',
      mins: parseMins(m.timeAgo),
      rankPos: m.toRank,
      isTop: m.toRank === 1,
      deltaText: isNew ? 'New' : up ? `↑ from #${m.fromRank}` : `↓ from #${m.fromRank}`,
      quote: m.reason,
      timeAgo: m.timeAgo,
      baseLikes: 0,
      matchPct: tasteMatchWithFriend(myTaste, m.personId).score,
      faces: facesFor(m.personId, m.productId),
    };
  });
  return [...posts, ...moves].sort((a, b) => a.mins - b.mins);
}

const ALL_ENTRIES = buildEntries();

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [tab, setTab] = useState<'foryou' | 'following'>('foryou');
  const { following } = useFollowing();

  // For You is the whole graph; Following is only people you follow (toggle it in Followers/
  // Following and this list changes).
  const entries = useMemo(
    () => (tab === 'following' ? ALL_ENTRIES.filter((e) => following.includes(e.personId)) : ALL_ENTRIES),
    [tab, following],
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space(3), paddingBottom: space(6) }} showsVerticalScrollIndicator={false}>
        {/* Header — Settings lives on Profile only, so the Feed keeps just the two things you check daily. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5) }}>
          <Text accessibilityRole="header" style={{ fontFamily: font.display, fontSize: font.size.hero, fontWeight: '600', color: palette.ink }}>Dew</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(6) }}>
            <Pressable onPress={() => router.push('/calendar')} hitSlop={hitSlopFor(20)} accessibilityRole="button" accessibilityLabel="Progress calendar">
              <Calendar size={20} color={palette.muted} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/notifications')}
              hitSlop={hitSlopFor(21)}
              accessibilityRole="button"
              accessibilityLabel={usingDemoGraph ? 'Notifications, 1 unread' : 'Notifications'}
            >
              <Bell size={21} color={palette.muted} />
              {/* Only the demo cast generates notifications; a real account has none yet. */}
              {usingDemoGraph ? (
                <View style={{ position: 'absolute', top: -8, right: -9, backgroundColor: palette.danger, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: palette.bg }}>
                  <Text style={{ color: palette.white, fontSize: font.size.xs, fontWeight: '700' }}>1</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>

        {/* For You / Following */}
        <View style={{ marginTop: space(4), paddingHorizontal: space(5) }}>
          <View accessibilityRole={TAB_LIST_ROLE} style={{ flexDirection: 'row', backgroundColor: 'rgba(46,46,46,0.05)', borderRadius: 999, padding: 4 }}>
            {(['foryou', 'following'] as const).map((t) => {
              const on = tab === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  hitSlop={{ top: 4, bottom: 4 }}
                  style={{ flex: 1, borderRadius: 999, paddingVertical: 9, alignItems: 'center', backgroundColor: on ? palette.surface : 'transparent' }}
                >
                  <Text style={{ fontSize: font.size.base, fontWeight: '600', color: on ? palette.ink : palette.muted }}>
                    {t === 'foryou' ? 'For You' : 'Following'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Search → Discover */}
          <Pressable
            onPress={() => router.push('/discover')}
            accessibilityRole="button"
            accessibilityLabel="Search products, brands, concerns"
            accessibilityHint="Opens Discover"
            style={{ marginTop: space(3), flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(46,46,46,0.05)', borderRadius: 999, paddingHorizontal: space(4), paddingVertical: 11 }}
          >
            <Search size={17} color={palette.muted} />
            <Text style={{ fontSize: font.size.base, color: palette.muted }}>Search products, brands, concerns…</Text>
          </Pressable>
        </View>

        {/* Cards */}
        <View style={{ marginTop: space(4), paddingHorizontal: space(5), gap: space(3) }}>
          {entries.length === 0 ? (
            <View style={{ paddingVertical: space(8), alignItems: 'center', gap: space(3) }}>
              <Text accessibilityRole="header" style={{ fontSize: font.size.lg, fontWeight: '700', color: palette.ink }}>
                {usingDemoGraph ? 'No one to show' : 'Your feed is empty'}
              </Text>
              <Text style={{ fontSize: font.size.base, color: palette.muted, textAlign: 'center', lineHeight: 20, maxWidth: 300 }}>
                {usingDemoGraph
                  ? "You're not following anyone yet. Follow people to see what they rank."
                  : 'Rank a few products, then invite the people whose taste you actually trust — their rankings show up here.'}
              </Text>
              <Pressable
                onPress={() =>
                  usingDemoGraph
                    ? router.push({ pathname: '/people', params: { type: 'following' } })
                    : router.push('/shelf')
                }
                accessibilityRole="button"
                style={{ borderRadius: radius.pill, backgroundColor: palette.accent, paddingHorizontal: 18, paddingVertical: 10 }}
              >
                <Text style={{ color: palette.white, fontSize: font.size.base, fontWeight: '700' }}>
                  {usingDemoGraph ? 'Find people' : 'Rank your first product'}
                </Text>
              </Pressable>
            </View>
          ) : (
            entries.map((d) => <FeedCard key={d.key} d={d} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function RankBadge({ pos, label, top }: { pos: number; label: string; top?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
      {top ? <Crown size={12} color={palette.tierS} /> : null}
      <Text style={{ fontSize: font.size.xs, fontWeight: '700', color: palette.ink }}>#{pos} {label}</Text>
    </View>
  );
}

// Taste match is the reason to trust a stranger's ranking, so it sits up top next to who posted,
// sized to be read at a glance. It describes the person, so it opens their profile.
function MatchPill({ pct, name, onPress }: { pct: number; name: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${pct}% match with ${name}`}
      accessibilityHint="How closely their rankings match yours. Opens their profile."
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'baseline', gap: 3, borderRadius: radius.pill, backgroundColor: palette.accentSoft, paddingHorizontal: 11, paddingVertical: 5, opacity: pressed ? 0.8 : 1 })}
    >
      <Text style={{ fontSize: font.size.lg, fontWeight: '700', color: palette.accentInk }}>{pct}%</Text>
      <Text style={{ fontSize: font.size.xs, fontWeight: '600', color: palette.accentInk }}>match</Text>
    </Pressable>
  );
}

// Icon-only actions keep their compact look; the slop grows each tap area to ~40×44 without
// overlapping its neighbours (they sit 22pt apart).
const ACTION_SLOP = { top: 13, bottom: 13, left: 11, right: 11 };

function FeedCard({ d }: { d: CardData }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const product = getProduct(d.productId);
  if (!product) return null;
  const first = d.name.split(' ')[0];
  const likeCount = d.baseLikes + (liked ? 1 : 0);
  const tags = tagsFor(product);
  const category = categoryLabel(product.category);
  const openPost = () => router.push({ pathname: '/post/[id]', params: { id: d.postId } });
  const openPerson = () => router.push({ pathname: '/person/[id]', params: { id: d.personId } });
  const share = () => {
    Share.share({ message: `${product.name} by ${product.brand} — ranked on Dew` }).catch(() => {});
  };

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 }}>
      {/* Header: who, when, and how much their taste matches yours */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={openPerson} hitSlop={4} accessibilityRole="button" accessibilityLabel={`${d.name}'s profile`}>
          <Avatar name={d.name} tint={d.tint} size={36} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: font.size.sm, color: palette.ink }}>
            <Text style={{ fontWeight: '700' }}>{first}</Text>
            <Text style={{ color: palette.muted }}> {d.verb}</Text>
          </Text>
          <Text style={{ fontSize: font.size.xs, color: palette.muted, marginTop: 1 }}>{d.timeAgo}</Text>
        </View>
        <MatchPill pct={d.matchPct} name={first} onPress={openPerson} />
      </View>

      {/* Body: product hero + where it ranks */}
      <Pressable
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: d.productId } })}
        accessibilityRole="button"
        accessibilityHint="Opens the product"
        style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}
      >
        <ProductImage id={product.id} brand={product.brand} image={product.image} category={category} width={88} height={116} radius={14} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: font.size.xs, fontWeight: '500', color: palette.muted }}>{product.brand}</Text>
          <Text style={{ fontSize: font.size.lg, fontWeight: '700', color: palette.ink, lineHeight: 21 }} numberOfLines={2}>{product.name}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 6 }}>
            {d.rankPos ? (
              <RankBadge pos={d.rankPos} label={category} top={d.isTop} />
            ) : (
              <Text style={{ fontSize: font.size.xs, color: palette.muted }}>{category}</Text>
            )}
            {d.grade ? <Text style={{ fontSize: font.size.xs, fontWeight: '700', color: tierInk(d.grade) }}>{d.grade}-tier</Text> : null}
            {d.deltaText ? <Text style={{ fontSize: font.size.xs, fontWeight: '600', color: palette.muted }}>{d.deltaText}</Text> : null}
          </View>
          {d.quote ? <Text style={{ fontSize: font.size.sm, fontStyle: 'italic', color: palette.ink, lineHeight: 19, marginTop: 8 }} numberOfLines={3}>“{d.quote}”</Text> : null}
        </View>
      </Pressable>

      {/* Tags */}
      {tags.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {tags.map((t, i) => {
            const highlight = i === tags.length - 1;
            return (
              <View key={t} style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: highlight ? palette.accentSoft : 'rgba(46,46,46,0.05)' }}>
                <Text style={{ fontSize: font.size.xs, fontWeight: '500', color: highlight ? palette.accentInk : palette.muted }}>{t}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 22, marginTop: 12 }}>
        <Pressable
          onPress={() => setLiked((v) => !v)}
          hitSlop={ACTION_SLOP}
          accessibilityRole="button"
          accessibilityLabel={likeCount > 0 ? `Like, ${likeCount} ${likeCount === 1 ? 'like' : 'likes'}` : 'Like'}
          accessibilityState={{ selected: liked }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Heart size={18} color={liked ? palette.tierF : palette.ink} fill={liked ? palette.tierF : 'transparent'} />
          {likeCount > 0 ? <Text style={{ fontSize: font.size.sm, color: palette.muted }}>{fmtCount(likeCount)}</Text> : null}
        </Pressable>
        <Pressable onPress={openPost} hitSlop={ACTION_SLOP} accessibilityRole="button" accessibilityLabel="Comments">
          <MessageCircle size={18} color={palette.ink} />
        </Pressable>
        <Pressable onPress={share} hitSlop={ACTION_SLOP} accessibilityRole="button" accessibilityLabel="Share">
          <Send size={17} color={palette.ink} />
        </Pressable>
        <Pressable onPress={() => setSaved((v) => !v)} hitSlop={ACTION_SLOP} accessibilityRole="button" accessibilityLabel="Save" accessibilityState={{ selected: saved }}>
          <Bookmark size={17} color={saved ? palette.accent : palette.ink} fill={saved ? palette.accent : 'transparent'} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {d.faces.length > 0 ? (
          <Pressable
            onPress={openPost}
            hitSlop={{ top: 12, bottom: 12 }}
            accessibilityRole="button"
            accessibilityLabel={`Also ranked by ${d.faces.map((f) => f.name.split(' ')[0]).join(', ')}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <View style={{ flexDirection: 'row' }}>
              {d.faces.map((f, i) => (
                <View key={i} style={{ marginLeft: i === 0 ? 0 : -6 }}>
                  <Avatar name={f.name} tint={f.tint} size={20} style={{ borderWidth: 2, borderColor: palette.surface }} />
                </View>
              ))}
            </View>
            <Text style={{ fontSize: font.size.xs, color: palette.muted }}>also ranked</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
