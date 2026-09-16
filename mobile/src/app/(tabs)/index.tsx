import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Bookmark, Calendar, ChevronRight, Crown, Heart, Menu, MessageCircle, Search, Send } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { ProductImage } from '@/components/ProductImage';
import { categoryLabel, getProduct } from '@/core/catalog';
import { tierColor } from '@/core/ranking';
import { feed, friendShelves, getPerson, myShelf, people, rankMoves } from '@/core/social';
import { friendRankedShelf, tasteItemsFromIds, tasteMatchWithFriend } from '@/core/taste';
import { palette, radius, space } from '@/core/theme';
import type { Product, Tier } from '@/core/types';

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

  // Following drops your own activity (none in the sample yet) — friends only.
  const entries = useMemo(() => ALL_ENTRIES, [tab]);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space(3), paddingBottom: space(6) }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(5) }}>
          <Text style={{ fontSize: 26, fontWeight: '700', color: palette.ink, letterSpacing: -0.5 }}>Dew</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(4) }}>
            <Calendar size={20} color={palette.muted} />
            <View>
              <Bell size={21} color={palette.muted} />
              <View style={{ position: 'absolute', top: -5, right: -5, backgroundColor: palette.tierF, borderRadius: 8, minWidth: 15, height: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                <Text style={{ color: palette.white, fontSize: 9, fontWeight: '700' }}>1</Text>
              </View>
            </View>
            <Menu size={22} color={palette.muted} />
          </View>
        </View>

        {/* For You / Following */}
        <View style={{ marginTop: space(4), paddingHorizontal: space(5) }}>
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(46,46,46,0.05)', borderRadius: 999, padding: 4 }}>
            {(['foryou', 'following'] as const).map((t) => {
              const on = tab === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={{ flex: 1, borderRadius: 999, paddingVertical: 9, alignItems: 'center', backgroundColor: on ? palette.surface : 'transparent' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: on ? palette.ink : palette.muted }}>
                    {t === 'foryou' ? 'For You' : 'Following'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Search → Discover */}
          <Pressable
            onPress={() => router.push('/discover')}
            style={{ marginTop: space(3), flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(46,46,46,0.05)', borderRadius: 999, paddingHorizontal: space(4), paddingVertical: 11 }}
          >
            <Search size={17} color={palette.muted} />
            <Text style={{ fontSize: 15, color: palette.muted }}>Search products, brands, concerns…</Text>
          </Pressable>
        </View>

        {/* Cards */}
        <View style={{ marginTop: space(4), paddingHorizontal: space(5), gap: space(3) }}>
          {entries.map((d) => (
            <FeedCard key={d.key} d={d} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function RankBadge({ pos, label, top }: { pos?: number; label?: string; top?: boolean }) {
  if (!pos || !label) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
      {top ? <Crown size={12} color={palette.tierS} /> : null}
      <Text style={{ fontSize: 12, fontWeight: '700', color: palette.ink }}>#{pos} {label}</Text>
    </View>
  );
}

function FeedCard({ d }: { d: CardData }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const product = getProduct(d.productId);
  if (!product) return null;
  const first = d.name.split(' ')[0];
  const likeCount = d.baseLikes + (liked ? 1 : 0);
  const tags = tagsFor(product);

  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={() => router.push({ pathname: '/person/[id]', params: { id: d.personId } })}>
          <Avatar name={d.name} tint={d.tint} size={36} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13.5, color: palette.ink }}>
            <Text style={{ fontWeight: '700' }}>{first}</Text>
            <Text style={{ color: palette.muted }}> {d.verb}</Text>
          </Text>
          <Text style={{ fontSize: 11.5, color: palette.muted, marginTop: 1 }}>{d.timeAgo}</Text>
        </View>
        <RankBadge pos={d.rankPos} label={categoryLabel(product.category)} top={d.isTop} />
      </View>

      {/* Body: product hero + info */}
      <Pressable onPress={() => router.push({ pathname: '/product/[id]', params: { id: d.productId } })} style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <ProductImage id={product.id} brand={product.brand} image={product.image} category={categoryLabel(product.category)} width={88} height={116} radius={14} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: palette.muted }}>{product.brand}</Text>
          <Text style={{ fontSize: 16.5, fontWeight: '700', color: palette.ink, lineHeight: 21 }} numberOfLines={2}>{product.name}</Text>
          <Text style={{ fontSize: 12, color: palette.muted, marginTop: 2 }}>
            {categoryLabel(product.category)}
            {d.grade ? <Text> · <Text style={{ fontWeight: '700', color: tierColor(d.grade) }}>{d.grade}-tier</Text></Text> : null}
            {d.deltaText ? <Text> · <Text style={{ fontWeight: '600' }}>{d.deltaText}</Text></Text> : null}
          </Text>
          {d.quote ? <Text style={{ fontSize: 13.5, fontStyle: 'italic', color: palette.ink, lineHeight: 19, marginTop: 6 }} numberOfLines={3}>“{d.quote}”</Text> : null}
        </View>
      </Pressable>

      {/* Tags */}
      {tags.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {tags.map((t, i) => {
            const highlight = i === tags.length - 1;
            return (
              <View key={t} style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: highlight ? palette.accentSoft : 'rgba(46,46,46,0.05)' }}>
                <Text style={{ fontSize: 11.5, fontWeight: '500', color: highlight ? palette.accentInk : palette.muted }}>{t}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {/* Actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }}>
        <Pressable onPress={() => setLiked((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Heart size={18} color={liked ? palette.tierF : palette.ink} fill={liked ? palette.tierF : 'transparent'} />
          {likeCount > 0 ? <Text style={{ fontSize: 12.5, color: palette.muted }}>{fmtCount(likeCount)}</Text> : null}
        </Pressable>
        <MessageCircle size={18} color={palette.ink} />
        <Send size={17} color={palette.ink} />
        <Bookmark size={17} color={palette.ink} />
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {d.faces.length > 0 ? (
            <View style={{ flexDirection: 'row' }}>
              {d.faces.map((f, i) => (
                <View key={i} style={{ marginLeft: i === 0 ? 0 : -6 }}>
                  <Avatar name={f.name} tint={f.tint} size={20} style={{ borderWidth: 2, borderColor: palette.surface }} />
                </View>
              ))}
            </View>
          ) : null}
          <Text style={{ fontSize: 12.5, fontWeight: '700', color: palette.accent }}>{d.matchPct}% match</Text>
          <ChevronRight size={14} color={palette.muted} />
        </View>
      </View>
    </View>
  );
}
