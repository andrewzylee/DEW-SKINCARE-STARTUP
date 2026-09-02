import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowLeftRight, Check, Heart, Instagram, MessageCircle, Music2, Share2 } from 'lucide-react';
import { categoryDomain, getProduct, type Category } from '../data/mockCatalog';
import { getPerson, type Person } from '../data/social';
import { friendPosts, friendStats, type ActivityPost } from '../lib/activity';
import {
  archetypeOf,
  friendRankedShelf,
  friendTasteItems,
  tasteItemsFromRanked,
  tasteMatchByDomainWithFriend,
  type TasteItem,
} from '../lib/taste';
import type { SkinType } from '../data/mockCatalog';
import { cn } from '../lib/cn';
import { spring } from '../lib/motion';
import { useStore } from '../state/store';
import { Avatar } from './Avatar';
import { ProductImage } from './ProductImage';
import { SegmentedToggle } from './SegmentedToggle';
import { categoryPlural } from './CategoryTag';

const TIER_NAME: Record<string, string> = {
  S: 'S · Elite',
  A: 'A · Great',
  B: 'B · Solid',
  C: 'C · Okay',
  F: 'F · Nope',
};

export function FriendProfile({
  personId,
  onClose,
  onOpenPost,
}: {
  personId: string | null;
  onClose: () => void;
  onOpenPost: (p: ActivityPost) => void;
}) {
  const root = typeof document !== 'undefined' ? document.getElementById('stack-overlay') : null;
  const { rankedShelf, state } = useStore();
  const [tab, setTab] = useState<'activity' | 'playlists'>('activity');
  const [following, setFollowing] = useState(true);

  useEffect(() => {
    setTab('activity');
    setFollowing(true);
  }, [personId]);

  const person = personId ? getPerson(personId) : undefined;
  const mine = useMemo(() => tasteItemsFromRanked(rankedShelf), [rankedShelf]);

  if (!root) return null;
  const stats = person ? friendStats(person.id) : null;
  const posts = person ? friendPosts(person.id) : [];

  return createPortal(
    <AnimatePresence>
      {person && stats && (
        <motion.div
          className="pointer-events-auto absolute inset-0 z-[60] flex flex-col overflow-y-auto no-scrollbar bg-bg pb-8"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={spring}
        >
          <div className="flex items-center justify-between px-5 pb-2 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ink/5"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="truncate font-display text-[23px] font-semibold">{person.name}</h1>
            <Share2 size={19} className="text-muted" />
          </div>

          <div className="flex flex-col items-center px-5 pt-2 text-center">
            <Avatar name={person.name} tint={person.tint} size="lg" ring />
            <div className="mt-3 text-[16px] font-semibold">@{person.handle}</div>
            <div className="num text-[12.5px] text-muted">Member since {stats.memberSince}</div>
            <p className="mt-2 max-w-[19rem] text-[14px] leading-snug">
              {person.bio}
              <span className="text-muted"> · 📍 {person.location}</span>
            </p>
            <div className="mt-3 flex items-center gap-2 text-muted">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-line">
                <Instagram size={17} />
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full border border-line">
                <Music2 size={17} />
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-stretch px-6">
            <Stat label="Followers" value={stats.followers} />
            <div className="my-1 w-px self-stretch bg-line" />
            <Stat label="Following" value={stats.following} />
            <div className="my-1 w-px self-stretch bg-line" />
            <Stat label="Day streak" value={stats.streak} />
          </div>

          <div className="mt-4 px-5">
            <button
              type="button"
              onClick={() => setFollowing((v) => !v)}
              className={cn(
                'w-full rounded-full py-3 text-[15px] font-semibold transition-colors active:scale-[0.99]',
                following ? 'border border-line text-ink' : 'bg-accent text-white',
              )}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          </div>

          <TasteMatchCard person={person} mine={mine} mySkinType={state.profile?.skinType} />

          <div className="mt-5 px-5">
            <SegmentedToggle<'activity' | 'playlists'>
              layoutId="friend-tab"
              value={tab}
              onChange={setTab}
              options={[
                { value: 'activity', label: 'Recent Activity' },
                { value: 'playlists', label: 'Playlists' },
              ]}
            />
          </div>

          {tab === 'activity' ? (
            <div className="mt-2 px-5">
              {posts.map((post) => {
                const product = post.productId ? getProduct(post.productId) : undefined;
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => onOpenPost(post)}
                    className="w-full border-t border-line py-3.5 text-left first:border-t-0"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar name={post.person.name} tint={post.person.tint} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14.5px] leading-snug">
                          <span className="font-semibold">{post.person.name.split(' ')[0]}</span>{' '}
                          {post.action}
                          {product ? (
                            <>
                              {' '}
                              <span className="font-semibold">{product.name}</span>
                            </>
                          ) : (
                            ''
                          )}
                        </p>
                        {post.review && (
                          <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">{post.review}</p>
                        )}
                        <div className="num mt-1.5 flex items-center gap-3 text-[11.5px] text-muted">
                          <span className="flex items-center gap-1">
                            <Heart size={13} /> {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle size={13} /> {post.seed.length}
                          </span>
                          <span>{post.timeAgo}</span>
                        </div>
                      </div>
                      {post.badge && (
                        <span
                          className="num inline-flex items-center rounded-full border-2 px-2 py-0.5 text-[13px] font-bold"
                          style={{ borderColor: post.badge.color, color: post.badge.color }}
                        >
                          {post.badge.text}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <FriendPlaylists posts={posts} />
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 py-1 text-center">
      <div className="num text-[20px] font-bold leading-none">{value}</div>
      <div className="mt-1 text-[12px] text-muted">{label}</div>
    </div>
  );
}

function ScorePill({
  score,
  label,
  sub,
  color,
}: {
  score: number;
  label: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="rounded-[16px] bg-bg p-3">
      <div className="num text-[24px] font-bold leading-none" style={{ color }}>
        {score}
      </div>
      <div className="mt-1 text-[12.5px] font-semibold leading-tight">{label}</div>
      <div className="text-[11px] leading-tight text-muted">{sub}</div>
    </div>
  );
}

// The lead feature: how much your beauty taste lines up with this person — split into two honest
// numbers (Makeup taste is aesthetic; Skincare match is phenotype-gated by your skin types) — plus
// what you agree and split on. The reason their picks should matter more than a stranger's.
function TasteMatchCard({
  person,
  mine,
  mySkinType,
}: {
  person: Person;
  mine: TasteItem[];
  mySkinType?: SkinType;
}) {
  const dm = useMemo(
    () => tasteMatchByDomainWithFriend(mine, person.id, mySkinType),
    [mine, person.id, mySkinType],
  );
  const archetype = useMemo(() => archetypeOf(friendTasteItems(person.id)), [person.id]);
  const holy = useMemo(
    () => friendRankedShelf(person.id).filter((r) => r.groupRank === 1).slice(0, 4),
    [person.id],
  );
  // Which domains this person actually ranks — so we only show relevant taste pills.
  const friendDomains = useMemo(
    () => new Set(friendTasteItems(person.id).map((i) => categoryDomain(i.category as Category))),
    [person.id],
  );
  const first = person.name.split(' ')[0];

  // Merge the per-domain agree/disagree (already ordered most-divisive-first) for the callout list.
  const agree = [...dm.makeup.agree, ...dm.fragrance.agree, ...dm.skincare.agree];
  const disagree = [...dm.makeup.disagree, ...dm.fragrance.disagree, ...dm.skincare.disagree];
  const shared = dm.makeup.shared.length + dm.fragrance.shared.length + dm.skincare.shared.length;
  const sameSkin = dm.skinTypeSim >= 0.99;
  const skinNote = sameSkin
    ? `Same skin type${mySkinType ? ` · ${mySkinType}` : ''}`
    : dm.skinTypeSim >= 0.6
      ? 'Similar skin type'
      : 'Different skin type';

  const pills = [
    friendDomains.has('makeup') && {
      score: dm.makeup.score,
      label: 'Makeup taste',
      sub: 'how you rank color',
      color: 'rgb(var(--makeup))',
    },
    friendDomains.has('fragrance') && {
      score: dm.fragrance.score,
      label: 'Fragrance taste',
      sub: 'how you rank scent',
      color: 'rgb(var(--tier-s))',
    },
    friendDomains.has('skincare') && {
      score: dm.skincare.score,
      label: 'Skincare match',
      sub: skinNote,
      color: 'rgb(var(--accent))',
    },
  ].filter(Boolean) as { score: number; label: string; sub: string; color: string }[];

  return (
    <div className="mt-4 px-5">
      <div className="rounded-[22px] border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <div className="text-[15px] font-bold leading-tight">You + {first}</div>
          <span className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-accent-ink">
            {archetype}
          </span>
        </div>

        {/* Co-equal per-domain numbers: makeup + fragrance are aesthetic; skincare is
            phenotype-gated. Only domains this person actually ranks are shown. */}
        <div className={cn('mt-3 grid gap-2.5', pills.length >= 3 ? 'grid-cols-3' : 'grid-cols-2')}>
          {pills.map((p) => (
            <ScorePill key={p.label} score={p.score} label={p.label} sub={p.sub} color={p.color} />
          ))}
        </div>

        {shared === 0 ? (
          <p className="mt-3 text-[12.5px] leading-snug text-muted">
            Based on your styles so far. Rank a few products you both use to sharpen it.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-1.5">
            {agree.slice(0, 3).map((id) => {
              const p = getProduct(id);
              if (!p) return null;
              return (
                <div key={id} className="flex items-center gap-1.5 text-[12.5px]">
                  <Check size={13} className="shrink-0 text-accent" />
                  <span>
                    You both rate <span className="font-semibold">{p.name}</span>
                  </span>
                </div>
              );
            })}
            {disagree.slice(0, 2).map((id) => {
              const p = getProduct(id);
              if (!p) return null;
              return (
                <div key={id} className="flex items-center gap-1.5 text-[12.5px] text-muted">
                  <ArrowLeftRight size={13} className="shrink-0 text-tier-b" />
                  <span>
                    You split on <span className="font-semibold">{p.name}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {holy.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
            {first}'s holy grails
          </h2>
          <div className="flex flex-col gap-2">
            {holy.map((r) => {
              const p = getProduct(r.productId);
              if (!p) return null;
              return (
                <div
                  key={r.productId}
                  className="flex items-center gap-3 rounded-[18px] bg-surface p-2.5 shadow-card"
                >
                  <ProductImage id={p.id} brand={p.brand} name={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-semibold leading-tight">{p.name}</div>
                    <div className="num text-[12px] text-muted">
                      #1 of {r.groupSize} {categoryPlural(p.category)} · {p.brand}
                    </div>
                  </div>
                  <span className="num shrink-0 text-[12.5px] font-semibold text-muted">${p.price}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FriendPlaylists({ posts }: { posts: ActivityPost[] }) {
  const groups = new Map<string, { n: number; color: string }>();
  posts.forEach((p) => {
    if (!p.badge) return;
    const g = groups.get(p.badge.text) ?? { n: 0, color: p.badge.color };
    g.n += 1;
    groups.set(p.badge.text, g);
  });
  const tiles = ['S', 'A', 'B', 'C', 'F']
    .filter((t) => groups.has(t))
    .map((t) => ({ label: t, ...groups.get(t)! }));

  if (tiles.length === 0) {
    return <p className="mt-4 px-5 text-center text-sm text-muted">No playlists yet.</p>;
  }
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 px-5">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="relative h-28 overflow-hidden rounded-[20px] p-3.5 text-left shadow-card"
          style={{
            backgroundColor: t.color,
            backgroundImage: 'linear-gradient(0deg, rgba(15,17,21,0.38), rgba(15,17,21,0) 60%)',
          }}
        >
          <div className="flex h-full flex-col justify-end">
            <div className="text-[15px] font-bold text-white">{TIER_NAME[t.label] ?? t.label}</div>
            <div className="num text-[12px] text-white/85">
              {t.n} product{t.n === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
