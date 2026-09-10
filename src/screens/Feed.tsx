import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Bookmark,
  Calendar,
  ChevronRight,
  Crown,
  Heart,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { catalog, getProduct, lookalikeStats, type Product } from '../data/mockCatalog';
import {
  featuredLists,
  feed as feedData,
  friendShelves,
  getPerson,
  people,
  rankMoves,
  seedComments,
  type FeaturedList,
  type FeedActivity,
} from '../data/social';
import { feedToPost } from '../lib/activity';
import { friendRankedShelf, tasteItemsFromRanked, tasteMatchWithFriend, type TasteItem } from '../lib/taste';
import { useStore } from '../state/store';
import { useUI } from '../state/ui';
import { INTEREST_META, type UserProfile } from '../data/quiz';
import { tierVar, type Tier } from '../lib/ranking';
import { cn } from '../lib/cn';
import { listContainer, listItem, spring } from '../lib/motion';
import { Avatar } from '../components/Avatar';
import { ProductImage } from '../components/ProductImage';
import { CategoryTag, categoryLabel } from '../components/CategoryTag';

type View = 'foryou' | 'trending' | 'friends';
type FeedTab = 'foryou' | 'following';

const CHIPS: { key: View; label: string; icon: typeof Sparkles }[] = [
  { key: 'foryou', label: 'For You', icon: Sparkles },
  { key: 'trending', label: 'Trending', icon: TrendingUp },
  { key: 'friends', label: 'Friend recs', icon: Users },
];

// A few curated display tags for the skincare heroes that appear in the feed (kept out of the
// Product model + taste algorithm on purpose — these are purely for the card's benefit chips).
const FEED_TAGS: Record<string, string[]> = {
  'cerave-foaming-cleanser': ['Gentle', 'Non-drying', 'For oily skin'],
  'differin-adapalene': ['Acne', 'Texture', 'Derm-loved'],
  'boj-relief-sun': ['No white cast', 'Lightweight'],
  'ordinary-niacinamide': ['Budget', 'Oil control'],
  'paulas-choice-bha': ['Smoothing', 'Cult'],
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const tagsFor = (p: Product): string[] => FEED_TAGS[p.id] ?? (p.styleTags ?? []).slice(0, 3).map(cap);
const fmtCount = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n);

// Normalized card model — one shape for ranking posts, friends' rank moves, and your own moves,
// so the feed renders as a single consistent card type.
interface CardData {
  key: string;
  mins: number;
  isMe: boolean;
  personId?: string;
  name: string;
  tint?: string;
  avatar?: string;
  productId: string;
  verb: string;
  rankPos?: number;
  rankTotal?: number;
  isTop?: boolean;
  grade?: Tier; // secondary metadata (rating), rank is primary
  deltaText?: string; // secondary metadata for moves (↑ from #3 / New)
  quote?: string;
  timeAgo: string;
  baseLikes: number;
  likeId: string;
  commentId?: string;
  activity?: FeedActivity; // present on posts → opens the full post
  matchPct?: number;
  faces?: { name: string; tint?: string }[];
}

function cohortFor(profile: UserProfile | null): string {
  if (!profile) return 'oily & acne-prone';
  if (profile.goal === 'darkspots') return 'dark-spots focus';
  if (profile.skinType === 'dry' || profile.skinType === 'sensitive') return 'dry & sensitive';
  return 'oily & acne-prone';
}

export function Feed({
  onOpenCalendar,
  onOpenMenu,
  mode = 'feed',
}: {
  onOpenCalendar: () => void;
  onOpenMenu: () => void;
  mode?: 'feed' | 'discover';
}) {
  const { state, rankedShelf } = useStore();
  const { openProduct, openFriend, openShade, openBrowse, openTwins } = useUI();
  const [view, setView] = useState<View>('foryou');
  const [feedTab, setFeedTab] = useState<FeedTab>('foryou');
  const [q, setQ] = useState('');

  const myTaste = useMemo(() => tasteItemsFromRanked(rankedShelf), [rankedShelf]);

  // Interests emphasize the feed (not a hard wall): the makeup wedge only shows if you're into
  // makeup, while taste-twins stay cross-domain so discovery still bridges interests.
  const interests = state.profile?.interests ?? ['skincare', 'makeup'];
  const likesMakeup = interests.includes('makeup');
  const soon = interests.filter((i) => !INTEREST_META[i].live);
  const lists = featuredLists.filter((l) => !l.domain || interests.includes(l.domain));

  const owned = useMemo(() => {
    const s = new Set<string>();
    state.using.forEach((id) => s.add(id));
    state.shelf.forEach((it) => s.add(it.productId));
    return s;
  }, [state.using, state.shelf]);

  const results = useMemo(() => {
    const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return [...catalog, ...state.customProducts]
      .filter((p) => {
        const hay = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
      .slice(0, 12);
  }, [q, state.customProducts]);

  const cohort = cohortFor(state.profile);
  const lookalike = useMemo(
    () => lookalikeStats.filter((s) => s.cohortLabel === cohort).sort((a, b) => b.pctSTier - a.pctSTier).slice(0, 4),
    [cohort],
  );

  // One unified feed of rich cards: friends' ranking posts + friends' rank moves + (For You) your
  // own moves, interleaved by recency. "Following" drops your own activity — friends only.
  const entries = useMemo<CardData[]>(() => {
    const parseMins = (s: string): number => {
      const m = s.match(/(\d+)\s*(m|min|h|hour|d|day|w|week)/i);
      if (!m) return 99999;
      const n = Number(m[1]);
      const u = m[2][0].toLowerCase();
      return u === 'm' ? n : u === 'h' ? n * 60 : u === 'd' ? n * 1440 : n * 10080;
    };
    const rankInfo = (pid: string, productId: string) => {
      const rl = friendRankedShelf(pid).find((r) => r.productId === productId);
      return rl ? { pos: rl.groupRank, total: rl.groupSize } : null;
    };
    const facesFor = (pid: string, productId: string) =>
      people
        .filter((pp) => pp.id !== pid && (friendShelves[pp.id] ?? []).includes(productId))
        .slice(0, 3)
        .map((pp) => ({ name: pp.name, tint: pp.tint }));

    const posts: CardData[] = feedData.map((a) => {
      const person = getPerson(a.personId);
      const ri = rankInfo(a.personId, a.productId);
      return {
        key: `p-${a.id}`,
        mins: parseMins(a.timeAgo),
        isMe: false,
        personId: a.personId,
        name: person?.name ?? 'Someone',
        tint: person?.tint,
        productId: a.productId,
        verb: 'ranked a product',
        rankPos: ri?.pos,
        rankTotal: ri?.total,
        isTop: ri?.pos === 1,
        grade: a.tier,
        quote: a.standout ?? a.note,
        timeAgo: a.timeAgo,
        baseLikes: a.likes,
        likeId: a.id,
        commentId: a.id,
        activity: a,
        matchPct: tasteMatchWithFriend(myTaste, a.personId).score,
        faces: facesFor(a.personId, a.productId),
      };
    });

    const friendMoves: CardData[] = rankMoves.map((m) => {
      const person = getPerson(m.personId);
      const isNew = m.fromRank == null;
      const up = !isNew && m.toRank < (m.fromRank as number);
      return {
        key: `fm-${m.id}`,
        mins: parseMins(m.timeAgo),
        isMe: false,
        personId: m.personId,
        name: person?.name ?? 'Someone',
        tint: person?.tint,
        productId: m.productId,
        verb: isNew ? (m.toRank === 1 ? 'ranked a new #1' : 'ranked a product') : up ? 'moved a pick up' : 're-ranked a product',
        rankPos: m.toRank,
        rankTotal: m.groupSize,
        isTop: m.toRank === 1,
        deltaText: isNew ? 'New' : up ? `↑ from #${m.fromRank}` : `↓ from #${m.fromRank}`,
        quote: m.reason,
        timeAgo: m.timeAgo,
        baseLikes: 0,
        likeId: m.id,
        matchPct: tasteMatchWithFriend(myTaste, m.personId).score,
        faces: facesFor(m.personId, m.productId),
      };
    });

    const myMoves: CardData[] = state.rankEvents.slice(0, 3).map((e) => {
      const isNew = e.fromRank == null;
      const up = !isNew && e.toRank < (e.fromRank as number);
      return {
        key: `mm-${e.id}`,
        mins: Math.floor(Math.max(0, Date.now() - e.ts) / 60000),
        isMe: true,
        name: state.account.displayName,
        avatar: state.account.avatar,
        productId: e.productId,
        verb: isNew ? 'ranked a product' : up ? 'moved a pick up' : 're-ranked a product',
        rankPos: e.toRank,
        rankTotal: e.groupSize,
        isTop: e.toRank === 1,
        deltaText: isNew ? 'New' : up ? `↑ from #${e.fromRank}` : `↓ from #${e.fromRank}`,
        quote: e.reason,
        timeAgo: relTime(e.ts),
        baseLikes: 0,
        likeId: e.id,
      };
    });

    const all = feedTab === 'following' ? [...posts, ...friendMoves] : [...posts, ...friendMoves, ...myMoves];
    return all.sort((a, b) => a.mins - b.mins);
  }, [state.rankEvents, state.account, feedTab, myTaste]);

  return (
    <div className="pb-8">
      {/* Header — Feed shows the Dew wordmark; Discover leads with search */}
      {mode === 'feed' ? (
        <div className="flex items-center justify-between px-5 pt-6">
          <span className="font-display text-[26px] font-semibold tracking-tight text-ink">Dew</span>
          <div className="flex items-center gap-3 text-ink">
            <button type="button" onClick={onOpenCalendar} aria-label="Progress calendar">
              <Calendar size={20} className="text-muted" />
            </button>
            <button type="button" className="relative" aria-label="Notifications">
              <Bell size={21} className="text-muted" />
              <span className="num absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-tier-f px-1 text-[10px] font-bold text-white">
                1
              </span>
            </button>
            <button type="button" onClick={onOpenMenu} aria-label="Menu">
              <Menu size={22} className="text-muted" />
            </button>
          </div>
        </div>
      ) : (
        <div className="px-5 pt-6">
          <h1 className="font-display text-[30px] font-semibold leading-none">Discover</h1>
          <div className="mt-4 flex items-center gap-2 rounded-full bg-ink/[0.05] px-4">
            <Search size={17} className="text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, brands, concerns"
              className="w-full bg-transparent py-3 text-[15px] outline-none placeholder:text-muted"
            />
          </div>
        </div>
      )}

      {mode === 'discover' && !q.trim() && (
        <div className="px-5 pt-2">
          <button
            type="button"
            onClick={openBrowse}
            className="flex w-full items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-transform active:scale-[0.99]"
          >
            <SlidersHorizontal size={15} className="text-accent" />
            Browse all products
            <span className="num ml-auto text-[12px] font-normal text-muted">
              filters · brands · price
            </span>
          </button>
        </div>
      )}

      {mode === 'discover' && q.trim() && (
        <SearchResults results={results} owned={owned} query={q} />
      )}

      {mode === 'discover' && !q.trim() && (
        <>
          {/* Chips */}
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5">
            {CHIPS.map((c) => {
              const on = view === c.key;
              const Icon = c.icon;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setView(c.key)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors',
                    on ? 'bg-accent text-white' : 'bg-ink/[0.05] text-ink',
                  )}
                >
                  <Icon size={14} />
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Shade Match — the acquisition wedge (works solo). Emphasized only for makeup fans. */}
          {likesMakeup && (
            <div className="mt-4 px-5">
              <button
                type="button"
                onClick={openShade}
                className="flex w-full items-center gap-3 rounded-[20px] bg-makeup-soft p-4 text-left shadow-card transition-transform active:scale-[0.99]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-makeup/15 text-makeup-ink">
                  <Sparkles size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold leading-tight text-makeup-ink">
                    Find your Shade Match
                  </div>
                  <div className="text-[12.5px] text-makeup-ink/70">
                    Foundation, concealer & blush that suit your tone.
                  </div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-makeup-ink/50" />
              </button>
            </div>
          )}

          {/* Roadmap teaser — confirms we captured a "Soon" interest without shipping the domain */}
          {soon.length > 0 && (
            <div className="mt-4 px-5">
              <div className="rounded-[16px] border border-dashed border-line px-4 py-3 text-[12.5px] text-muted">
                <span className="font-semibold text-ink">
                  {soon.map((i) => (i === 'fragrance' ? 'Fragrance' : 'Hair')).join(' & ')}
                </span>{' '}
                is coming to Dew — you’re on the list. Ranking works the same way there.
              </div>
            </div>
          )}

          {/* Your taste twins — friends ranked by how much your beauty taste lines up */}
          <TasteTwins mine={myTaste} onOpen={openFriend} onSeeAll={openTwins} />

          {/* Featured lists */}
          <div className="mt-6">
            <div className="px-5">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
                Featured lists
              </h2>
            </div>
            <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5 pb-1">
              {lists.map((list) => (
                <FeaturedCard key={list.id} list={list} owned={owned} />
              ))}
            </div>
          </div>

          {/* What works for skin like yours (folded-in discovery) */}
          {view === 'foryou' && (
            <div className="mt-6 px-5">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
                Works for skin like yours
              </h2>
              <p className="mb-2 mt-1 text-[13px] text-muted">
                Share of people with{' '}
                <span className="font-medium capitalize text-ink">{cohort}</span> skin who rank each
                S-tier.
              </p>
              <div className="flex flex-col gap-2">
                {lookalike.map((s, i) => {
                  const p = getProduct(s.productId);
                  if (!p) return null;
                  return (
                    <button
                      key={s.productId}
                      type="button"
                      onClick={() => openProduct(p.id)}
                      className="flex w-full items-center gap-3 rounded-[18px] bg-surface p-2.5 text-left shadow-card transition-transform active:scale-[0.99]"
                    >
                      <ProductImage id={p.id} brand={p.brand} name={p.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14.5px] font-semibold leading-tight">{p.name}</div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                            <motion.div
                              className="h-full rounded-full bg-accent-bright"
                              initial={{ width: 0 }}
                              animate={{ width: `${s.pctSTier}%` }}
                              transition={{ ...spring, delay: 0.05 * i }}
                            />
                          </div>
                          <span className="num shrink-0 text-[12.5px] font-semibold">{s.pctSTier}%</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'feed' && (
        <div className="mt-4">
          {/* For You | Following — a real social toggle instead of a static header */}
          <div className="px-5">
            <div className="flex rounded-full bg-ink/[0.05] p-1 text-[14px] font-semibold">
              {(['foryou', 'following'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFeedTab(t)}
                  className={cn(
                    'flex-1 rounded-full py-2 transition-colors',
                    feedTab === t ? 'bg-surface text-ink shadow-card' : 'text-muted',
                  )}
                >
                  {t === 'foryou' ? 'For You' : 'Following'}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-full bg-ink/[0.05] px-4">
              <Search size={17} className="text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products, brands, concerns…"
                className="w-full bg-transparent py-2.5 text-[15px] outline-none placeholder:text-muted"
              />
              <button type="button" onClick={openBrowse} aria-label="Browse all products">
                <SlidersHorizontal size={17} className="text-muted" />
              </button>
            </div>
          </div>

          {q.trim() ? (
            <SearchResults results={results} owned={owned} query={q} />
          ) : (
            <motion.div
              key={feedTab}
              variants={listContainer}
              initial="initial"
              animate="animate"
              className="mt-4 flex flex-col gap-3 px-5"
            >
              {entries.map((d) => (
                <FeedEntryCard key={d.key} d={d} />
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

function TasteTwins({
  mine,
  onOpen,
  onSeeAll,
}: {
  mine: TasteItem[];
  onOpen: (id: string) => void;
  onSeeAll: () => void;
}) {
  const twins = useMemo(
    () =>
      people
        .map((p) => ({ p, m: tasteMatchWithFriend(mine, p.id) }))
        .sort((a, b) => b.m.score - a.m.score),
    [mine],
  );
  const shown = twins.slice(0, 5);

  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between px-5">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
          Your taste twins
        </h2>
        {twins.length > 5 ? (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-[13px] font-semibold text-accent"
          >
            See all
          </button>
        ) : (
          <span className="text-[12px] text-muted">who ranks like you</span>
        )}
      </div>
      <div className="no-scrollbar mt-3 flex gap-4 overflow-x-auto px-5 pb-1">
        {shown.map(({ p, m }) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onOpen(p.id)}
            className="flex w-16 shrink-0 flex-col items-center"
          >
            <div className="relative">
              <Avatar name={p.name} tint={p.tint} size="md" className="!h-14 !w-14 !text-xl" />
              <span className="num absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full border-2 border-bg bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white">
                {m.score}%
              </span>
            </div>
            <span className="mt-2 w-full truncate text-center text-[12px] font-medium">
              {p.name.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function relTime(ts: number): string {
  const s = Math.max(0, Date.now() - ts) / 1000;
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// One consistent rank-first badge: rank position (with a crown for a #1), category as context.
function RankBadge({ pos, label, top }: { pos?: number; label?: string; top?: boolean }) {
  if (!pos || !label) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line bg-bg px-2.5 py-1 text-[12px] font-semibold text-ink">
      {top && <Crown size={12} className="text-tier-s" />}#{pos} {label}
    </span>
  );
}

function FeedEntryCard({ d }: { d: CardData }) {
  const { openFriend, openProduct, openPost } = useUI();
  const { state, toggleLikePost } = useStore();
  const product = getProduct(d.productId);
  if (!product) return null;
  const liked = state.likedPosts.includes(d.likeId);
  const likeCount = d.baseLikes + (liked ? 1 : 0);
  const commentCount = d.commentId
    ? (seedComments[d.commentId]?.length ?? 0) + (state.postComments[d.commentId]?.length ?? 0)
    : 0;
  const open = () => (d.activity ? openPost(feedToPost(d.activity)) : openProduct(d.productId));
  const first = d.isMe ? 'You' : d.name.split(' ')[0];
  const tags = tagsFor(product);

  return (
    <motion.div variants={listItem} transition={spring} className="rounded-[20px] bg-surface p-3.5 shadow-card">
      {/* Header: small avatar + who/verb, rank badge on the right */}
      <div className="flex items-center gap-2.5">
        {d.isMe || !d.personId ? (
          <Avatar name={d.name} src={d.avatar} tint={d.tint} size="sm" />
        ) : (
          <button type="button" onClick={() => openFriend(d.personId!)} aria-label={d.name}>
            <Avatar name={d.name} tint={d.tint} size="sm" />
          </button>
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[13.5px] text-ink">
            <span className="font-semibold">{first}</span>
            <span className="text-muted"> {d.verb}</span>
          </div>
          <div className="num text-[11.5px] text-muted">{d.timeAgo}</div>
        </div>
        <RankBadge pos={d.rankPos} label={categoryLabel(product.category)} top={d.isTop} />
      </div>

      {/* Body: the product is the hero — large image + name carry the weight */}
      <button type="button" onClick={open} className="mt-3 flex w-full gap-3 text-left">
        <ProductImage
          id={product.id}
          brand={product.brand}
          name={product.name}
          size="lg"
          className="!h-[116px] !w-[88px] !rounded-[14px]"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-medium text-muted">{product.brand}</div>
          <div className="line-clamp-2 text-[16.5px] font-semibold leading-snug text-ink">{product.name}</div>
          <div className="mt-0.5 text-[12px] text-muted">
            {categoryLabel(product.category)}
            {d.grade && (
              <>
                {' · '}
                <span className="font-semibold" style={{ color: tierVar(d.grade) }}>
                  {d.grade}-tier
                </span>
              </>
            )}
            {d.deltaText && <>{' · '}<span className="font-medium">{d.deltaText}</span></>}
          </div>
          {d.quote && (
            <p className="mt-1.5 line-clamp-3 text-[13.5px] italic leading-snug text-ink">“{d.quote}”</p>
          )}
        </div>
      </button>

      {/* Benefit tags */}
      {tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <span
              key={t}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11.5px] font-medium',
                i === tags.length - 1 ? 'bg-accent-soft text-accent-ink' : 'bg-ink/[0.05] text-muted',
              )}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Actions + social proof */}
      <div className="mt-3 flex items-center gap-4">
        <button type="button" onClick={() => toggleLikePost(d.likeId)} className="flex items-center gap-1.5" aria-label="Like">
          <Heart size={18} className={liked ? 'text-tier-f' : 'text-ink'} fill={liked ? 'currentColor' : 'none'} />
          {likeCount > 0 && <span className="num text-[12.5px] text-muted">{fmtCount(likeCount)}</span>}
        </button>
        <button type="button" onClick={open} className="flex items-center gap-1.5 text-ink" aria-label="Comments">
          <MessageCircle size={18} />
          {commentCount > 0 && <span className="num text-[12.5px] text-muted">{commentCount}</span>}
        </button>
        <Send size={17} className="text-ink" />
        <Bookmark size={17} className="text-ink" />
        {d.matchPct != null && (
          <button type="button" onClick={open} className="ml-auto flex items-center gap-1.5">
            {d.faces && d.faces.length > 0 && (
              <div className="flex -space-x-1.5">
                {d.faces.map((f, i) => (
                  <Avatar key={i} name={f.name} tint={f.tint} size="xs" className="!h-5 !w-5 !text-[8px] ring-2 ring-surface" />
                ))}
              </div>
            )}
            <span className="num text-[12.5px] font-semibold text-accent">{d.matchPct}% match</span>
            <ChevronRight size={14} className="text-muted" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function SearchResults({
  results,
  owned,
  query,
}: {
  results: Product[];
  owned: Set<string>;
  query: string;
}) {
  const { openProduct, openAddProduct } = useUI();
  return (
    <div className="mt-3 flex flex-col gap-2 px-5">
      {results.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => openProduct(p.id)}
          className="flex w-full items-center gap-3 rounded-[18px] bg-surface p-2.5 text-left shadow-card transition-transform active:scale-[0.99]"
        >
          <ProductImage id={p.id} brand={p.brand} name={p.name} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold leading-tight">{p.name}</div>
            <div className="truncate text-[12.5px] text-muted">{p.brand}</div>
          </div>
          {owned.has(p.id) ? (
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-semibold text-accent-ink">
              Yours
            </span>
          ) : (
            <CategoryTag category={p.category} />
          )}
        </button>
      ))}

      {/* Search-first: the "+" fallback when it isn't already on Dew. */}
      <button
        type="button"
        onClick={() => openAddProduct(query)}
        className="mt-1 flex w-full items-center gap-3 rounded-[18px] border border-dashed border-line bg-surface/60 p-3 text-left transition-transform active:scale-[0.99]"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
          <Plus size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14.5px] font-semibold">
            {results.length ? 'Not seeing it?' : `Add “${query.trim()}”`}
          </div>
          <div className="text-[12.5px] text-muted">Add a product — just a photo + name</div>
        </div>
      </button>
    </div>
  );
}

function FeaturedCard({ list, owned }: { list: FeaturedList; owned: Set<string> }) {
  const { openList } = useUI();
  const used = list.productIds.filter((id) => owned.has(id)).length;
  const total = list.productIds.length;
  const thumbs = list.productIds.slice(0, 3).map(getProduct).filter((p): p is Product => !!p);

  return (
    <button
      type="button"
      onClick={() => openList(list.id)}
      className="relative h-44 w-[172px] shrink-0 overflow-hidden rounded-[20px] p-3.5 text-left shadow-card transition-transform active:scale-[0.98]"
      style={{
        backgroundImage: `linear-gradient(160deg, rgb(${list.tint}), rgb(${list.tint} / 0.72)), linear-gradient(0deg, rgba(15,17,21,0.5), rgba(15,17,21,0) 55%)`,
      }}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex -space-x-2">
          {thumbs.map((p) => (
            <ProductImage
              key={p.id}
              id={p.id}
              brand={p.brand}
              size="sm"
              className="h-9 w-9 rounded-full ring-2 ring-white/70"
            />
          ))}
        </div>
        <div>
          <h3 className="text-[16px] font-bold leading-tight text-white">{list.title}</h3>
          <p className="num mt-1 text-[12px] font-medium text-white/85">
            You use {used} of {total}
          </p>
        </div>
      </div>
    </button>
  );
}
