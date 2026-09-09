import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Calendar,
  ChevronRight,
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
  getPerson,
  people,
  rankMoves,
  seedComments,
  type FeaturedList,
  type FeedActivity,
} from '../data/social';
import { feedToPost } from '../lib/activity';
import { tasteItemsFromRanked, tasteMatchWithFriend, type TasteItem } from '../lib/taste';
import { useStore } from '../state/store';
import { useUI } from '../state/ui';
import { INTEREST_META, type UserProfile } from '../data/quiz';
import { tierVar, type Tier } from '../lib/ranking';
import { cn } from '../lib/cn';
import { listContainer, listItem, spring } from '../lib/motion';
import { Avatar } from '../components/Avatar';
import { ProductImage } from '../components/ProductImage';
import { CategoryTag, categoryLabel, categoryPlural } from '../components/CategoryTag';

type View = 'foryou' | 'trending' | 'friends';

const CHIPS: { key: View; label: string; icon: typeof Sparkles }[] = [
  { key: 'foryou', label: 'For You', icon: Sparkles },
  { key: 'trending', label: 'Trending', icon: TrendingUp },
  { key: 'friends', label: 'Friend recs', icon: Users },
];

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

  const feed = useMemo(() => {
    if (view === 'trending') return [...feedData].sort((a, b) => b.likes - a.likes);
    return feedData;
  }, [view]);

  const cohort = cohortFor(state.profile);
  const lookalike = useMemo(
    () => lookalikeStats.filter((s) => s.cohortLabel === cohort).sort((a, b) => b.pctSTier - a.pctSTier).slice(0, 4),
    [cohort],
  );

  // One unified feed: friends' posts + friends' ranking moves + your own moves, interleaved by
  // recency. (Replaces the separate "Latest moves" strip — it's all one stream now.)
  const mergedFeed = useMemo(() => {
    const parseMins = (s: string): number => {
      const m = s.match(/(\d+)\s*(m|min|h|hour|d|day|w|week)/i);
      if (!m) return 99999;
      const n = Number(m[1]);
      const u = m[2][0].toLowerCase();
      return u === 'm' ? n : u === 'h' ? n * 60 : u === 'd' ? n * 1440 : n * 10080;
    };
    const myMoves: MoveItem[] = state.rankEvents.slice(0, 3).map((e) => ({
      id: e.id,
      isMe: true,
      name: state.account.displayName,
      avatar: state.account.avatar,
      productId: e.productId,
      fromRank: e.fromRank,
      toRank: e.toRank,
      groupSize: e.groupSize,
      reason: e.reason,
      timeAgo: relTime(e.ts),
    }));
    const friendMoves: MoveItem[] = rankMoves.map((m) => {
      const person = getPerson(m.personId);
      return {
        id: m.id,
        isMe: false,
        personId: m.personId,
        name: person?.name ?? 'Someone',
        tint: person?.tint,
        productId: m.productId,
        fromRank: m.fromRank,
        toRank: m.toRank,
        groupSize: m.groupSize,
        reason: m.reason,
        timeAgo: m.timeAgo,
      };
    });
    type Entry =
      | { key: string; mins: number; kind: 'post'; post: FeedActivity }
      | { key: string; mins: number; kind: 'move'; move: MoveItem };
    const entries: Entry[] = [
      ...feed.map((p) => ({ key: `p-${p.id}`, mins: parseMins(p.timeAgo), kind: 'post' as const, post: p })),
      ...myMoves.map((m) => ({ key: `mm-${m.id}`, mins: parseMins(m.timeAgo), kind: 'move' as const, move: m })),
      ...friendMoves.map((m) => ({ key: `fm-${m.id}`, mins: parseMins(m.timeAgo), kind: 'move' as const, move: m })),
    ];
    return entries.sort((a, b) => a.mins - b.mins);
  }, [feed, state.rankEvents, state.account]);

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
        <div className="mt-6 px-5">
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
            Your feed
          </h2>
          <motion.div variants={listContainer} initial="initial" animate="animate" className="flex flex-col">
            {mergedFeed.map((entry) =>
              entry.kind === 'post' ? (
                <FeedCard key={entry.key} item={entry.post} />
              ) : (
                <MoveRow key={entry.key} m={entry.move} onProduct={openProduct} onFriend={openFriend} />
              ),
            )}
          </motion.div>
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

interface MoveItem {
  id: string;
  isMe: boolean;
  personId?: string;
  name: string;
  tint?: string;
  avatar?: string;
  productId: string;
  fromRank: number | null;
  toRank: number;
  groupSize: number;
  reason?: string;
  timeAgo: string;
}

function MoveRow({
  m,
  onProduct,
  onFriend,
}: {
  m: MoveItem;
  onProduct: (id: string) => void;
  onFriend: (id: string) => void;
}) {
  const product = getProduct(m.productId);
  if (!product) return null;
  const first = m.isMe ? 'You' : m.name.split(' ')[0];
  const action = m.fromRank == null ? 'ranked' : m.toRank < m.fromRank ? 'moved up' : 'dropped';
  return (
    <div className="border-t border-line py-3.5 first:border-t-0">
      <div className="flex items-start gap-3">
        {m.isMe || !m.personId ? (
          <Avatar name={m.name} src={m.avatar} tint={m.tint} size="md" />
        ) : (
          <button type="button" onClick={() => onFriend(m.personId!)} aria-label={m.name}>
            <Avatar name={m.name} tint={m.tint} size="md" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onProduct(m.productId)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-[14.5px] leading-snug">
            <span className="font-semibold">{first}</span> {action}{' '}
            <span className="font-semibold">{product.name}</span>
          </p>
          <p className="num text-[12.5px] text-muted">
            #{m.toRank} of {m.groupSize} {categoryPlural(product.category)}
          </p>
          {m.reason && <p className="mt-0.5 text-[13px] leading-snug text-ink/80">“{m.reason}”</p>}
          <p className="num mt-1 text-[11.5px] text-muted">{m.timeAgo}</p>
        </button>
        <MoveBadge from={m.fromRank} to={m.toRank} />
      </div>
    </div>
  );
}

function MoveBadge({ from, to }: { from: number | null; to: number }) {
  let color = 'rgb(var(--muted))';
  let label = 'NEW';
  if (from == null) {
    color = to === 1 ? 'rgb(var(--tier-s))' : 'rgb(var(--muted))';
    label = 'NEW';
  } else if (to < from) {
    color = 'rgb(var(--accent))';
    label = `↑${from - to}`;
  } else {
    color = 'rgb(var(--tier-f))';
    label = `↓${to - from}`;
  }
  return (
    <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
      <span className="num text-[20px] font-bold leading-none" style={{ color }}>
        #{to}
      </span>
      <span
        className="rounded-full bg-ink/[0.06] px-1.5 py-0.5 text-[10.5px] font-bold"
        style={{ color }}
      >
        {label}
      </span>
    </div>
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

function TierCircle({ tier }: { tier: Tier }) {
  return (
    <span
      className="num grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 text-[15px] font-bold"
      style={{ borderColor: tierVar(tier), color: tierVar(tier) }}
    >
      {tier}
    </span>
  );
}

function FeedCard({ item }: { item: (typeof feedData)[number] }) {
  const person = getPerson(item.personId);
  const product = getProduct(item.productId);
  const { openPost, openFriend } = useUI();
  const { state, toggleLikePost } = useStore();
  if (!person || !product) return null;
  const post = feedToPost(item);
  const liked = state.likedPosts.includes(item.id);
  const likeCount = item.likes + (liked ? 1 : 0);
  const commentCount =
    (seedComments[item.id]?.length ?? 0) + (state.postComments[item.id]?.length ?? 0);

  return (
    <motion.div variants={listItem} transition={spring} className="border-t border-line py-4 first:border-t-0">
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => openFriend(item.personId)} aria-label={`View ${person.name}`}>
          <Avatar name={person.name} tint={person.tint} size="md" />
        </button>
        <button type="button" onClick={() => openPost(post)} className="min-w-0 flex-1 text-left">
          <p className="text-[15px] leading-snug">
            <span className="font-semibold">{person.name.split(' ')[0]}</span> ranked{' '}
            <span className="font-semibold">{product.name}</span>
          </p>
          {item.withNames && item.withNames.length > 0 && (
            <p className="text-[13px] text-muted">with {item.withNames.join(', ')}</p>
          )}
          <p className="mt-0.5 text-[12.5px] text-muted">
            {product.brand} · {categoryLabel(product.category)}
          </p>
        </button>
        <TierCircle tier={item.tier} />
      </div>

      {(item.standout || item.note) && (
        <button
          type="button"
          onClick={() => openPost(post)}
          className="mt-2.5 block w-full text-left text-[14px] leading-snug"
        >
          <span className="font-semibold">{item.standout ? 'Standout: ' : 'Notes: '}</span>
          {item.standout ?? item.note}
        </button>
      )}

      <div className="mt-2.5 flex items-center gap-4">
        <span className="num text-[12.5px] text-muted">{likeCount} likes</span>
        <div className="flex items-center gap-4 text-ink">
          <button type="button" onClick={() => toggleLikePost(item.id)} aria-label="Like">
            <Heart
              size={19}
              className={cn(liked ? 'text-tier-f' : 'text-ink')}
              fill={liked ? 'currentColor' : 'none'}
            />
          </button>
          <button
            type="button"
            onClick={() => openPost(post)}
            aria-label="Comments"
            className="flex items-center gap-1"
          >
            <MessageCircle size={19} />
            {commentCount > 0 && <span className="num text-[12px] text-muted">{commentCount}</span>}
          </button>
          <Send size={18} />
        </div>
        <span className="ml-auto text-[11.5px] text-muted">{item.timeAgo}</span>
      </div>
    </motion.div>
  );
}
