// Normalizes activity into a single "post" shape so the Feed and the Profile's Recent
// Activity can both render posts and open the same Post detail (score, rating, comments).
import { feed, getPerson, seedComments, type Comment, type FeedActivity } from '../data/social';
import { catalog } from '../data/mockCatalog';
import type { Account, LogEntry, RankedShelfItem, Trial } from '../state/store';
import { tierVar, type Tier } from './ranking';

export interface PostBadge {
  text: string;
  color: string;
}

export interface ActivityPost {
  id: string;
  personId: string; // author id ('me' for the user)
  person: { name: string; tint: string; avatar?: string };
  action: string; // "reviewed" · "ranked" · "checked in"
  productId?: string;
  badge?: PostBadge;
  review?: string;
  likes: number;
  timeAgo: string;
  seed: Comment[]; // seed comments (store may add more)
}

const ME_TINT = '12 143 98';
const RATING_WORD = ['rough', 'off', 'okay', 'good', 'great'];

const scoreColor = (n: number) =>
  n >= 8 ? 'rgb(var(--accent))' : n >= 6 ? 'rgb(var(--tier-s))' : 'rgb(var(--tier-f))';

function daysAgo(dateKey: string, today: string): number {
  const [ya, ma, da] = dateKey.split('-').map(Number);
  const [yb, mb, db] = today.split('-').map(Number);
  return Math.round((new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime()) / 86400000);
}
function rel(dateKey: string, today: string): string {
  const d = daysAgo(dateKey, today);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

export function feedToPost(a: FeedActivity): ActivityPost {
  const p = getPerson(a.personId)!;
  return {
    id: a.id,
    personId: a.personId,
    person: { name: p.name, tint: p.tint },
    action: 'ranked',
    productId: a.productId,
    badge: { text: a.tier, color: tierVar(a.tier) },
    review: a.standout ?? a.note,
    likes: a.likes,
    timeAgo: a.timeAgo,
    seed: seedComments[a.id] ?? [],
  };
}

// A few deterministic mock comments so the demo threads feel alive.
const POOL: { personId: string; text: string }[] = [
  { personId: 'emily', text: 'Love this pick 🙌' },
  { personId: 'marcus', text: 'How long till you saw results?' },
  { personId: 'devon', text: 'Adding to my want-to-try.' },
  { personId: 'priya', text: 'Same skin type — trying this next.' },
  { personId: 'theo', text: 'Solid score, agreed.' },
  { personId: 'sam', text: 'Does it hold up under SPF?' },
];
function demoComments(key: string, n: number): Comment[] {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: n }, (_, i) => {
    const pick = POOL[(h + i) % POOL.length];
    return { id: `${key}-c${i}`, personId: pick.personId, text: pick.text, timeAgo: `${(i + 1) * 3}h` };
  });
}

// The user's own recent activity, newest-ish first: reviewed (finished trials) → ranked → checked in.
export function deriveMyPosts(args: {
  trials: Trial[];
  ranked: RankedShelfItem[];
  logs: Record<string, LogEntry>;
  account: Account;
  today: string;
}): ActivityPost[] {
  const { trials, ranked, logs, account, today } = args;
  const me = { name: account.displayName, tint: ME_TINT, avatar: account.avatar };
  const posts: Omit<ActivityPost, 'personId'>[] = [];
  const reviewedProducts = new Set<string>();

  trials
    .filter((t) => t.status === 'completed' && t.verdict)
    .forEach((t) => {
      const v = t.verdict!;
      reviewedProducts.add(t.productId);
      posts.push({
        id: `me-trial-${t.id}`,
        person: me,
        action: 'reviewed',
        productId: t.productId,
        badge: { text: `${v.overall}/10`, color: scoreColor(v.overall) },
        review: v.note ?? (v.repurchase ? 'Would repurchase.' : "Wouldn't repurchase."),
        likes: 4,
        timeAgo: rel(t.endDate ?? today, today),
        seed: demoComments(`me-trial-${t.id}`, 2),
      });
    });

  ranked
    .filter((it) => !reviewedProducts.has(it.productId))
    .slice(0, 4)
    .forEach((it, i) => {
      posts.push({
        id: `me-rank-${it.productId}`,
        person: me,
        action: 'ranked',
        productId: it.productId,
        badge: { text: it.tier, color: tierVar(it.tier) },
        review: it.note,
        likes: 2 + (i % 3),
        timeAgo: `${i + 1}d ago`,
        seed: demoComments(`me-rank-${it.productId}`, 1),
      });
    });

  const lastLog = Object.keys(logs)
    .filter((k) => logs[k].skinRating !== null && logs[k].skinRating !== undefined)
    .sort()
    .reverse()[0];
  if (lastLog) {
    const e = logs[lastLog];
    posts.push({
      id: `me-log-${lastLog}`,
      person: me,
      action: 'checked in',
      review: e.note ?? `Skin felt ${RATING_WORD[e.skinRating ?? 2]} today.`,
      likes: 1,
      timeAgo: rel(lastLog, today),
      seed: [],
    });
  }

  return posts.map((p) => ({ ...p, personId: 'me' }));
}

// ---- Friend profiles ----
function h32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** A friend's recent activity: their seeded feed posts + a few deterministic rankings. */
export function friendPosts(personId: string): ActivityPost[] {
  const p = getPerson(personId);
  if (!p) return [];
  const person = { name: p.name, tint: p.tint };
  const posts = feed.filter((a) => a.personId === personId).map(feedToPost);
  const used = new Set(posts.map((x) => x.productId));
  const hv = h32(personId);
  const tiers: Tier[] = ['S', 'A', 'A', 'B', 'C'];
  for (let i = 0; i < 5 && posts.length < 6; i++) {
    const prod = catalog[(hv + i * 13) % catalog.length];
    if (used.has(prod.id)) continue;
    used.add(prod.id);
    const tier = tiers[i % tiers.length];
    posts.push({
      id: `${personId}-r${i}`,
      personId,
      person,
      action: 'ranked',
      productId: prod.id,
      badge: { text: tier, color: tierVar(tier) },
      likes: 2 + ((hv >> i) % 12),
      timeAgo: `${i + 2}d ago`,
      seed: [],
    });
  }
  return posts;
}

export function friendStats(personId: string): {
  followers: number;
  following: number;
  streak: number;
  memberSince: string;
} {
  const hv = h32(personId);
  return {
    followers: 80 + (hv % 520),
    following: 60 + ((hv >> 4) % 340),
    streak: 6 + (hv % 60),
    memberSince: ['2021', '2022', '2023'][hv % 3],
  };
}
