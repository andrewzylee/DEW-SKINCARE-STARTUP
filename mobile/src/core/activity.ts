// Normalizes feed activity into a single "post" shape so the Feed and the post-detail screen can
// render the same thing (score/rank, review, comments). Ported from the web reference
// (src/lib/activity.ts + data/social seedComments). Demo comments are deterministic so threads
// feel alive without a backend.
import { tierColor } from './ranking';
import { feed, getPerson, rankMoves } from './social';

export interface Comment {
  id: string;
  personId: string;
  text: string;
  timeAgo: string;
}

export interface PostBadge {
  text: string;
  color: string;
}

export interface ActivityPost {
  id: string;
  personId: string; // author id ('me' for the user)
  person: { name: string; tint?: string };
  action: string; // "ranked" · "re-ranked"
  productId?: string;
  badge?: PostBadge;
  review?: string;
  likes: number;
  timeAgo: string;
  seed: Comment[]; // seed comments (screen may add more locally)
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

export function demoComments(key: string, n: number): Comment[] {
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: n }, (_, i) => {
    const pick = POOL[(h + i) % POOL.length];
    return { id: `${key}-c${i}`, personId: pick.personId, text: pick.text, timeAgo: `${(i + 1) * 3}h` };
  });
}

function feedToPost(id: string): ActivityPost | undefined {
  const a = feed.find((x) => x.id === id);
  if (!a) return undefined;
  const p = getPerson(a.personId);
  return {
    id: a.id,
    personId: a.personId,
    person: { name: p?.name ?? 'Someone', tint: p?.tint },
    action: 'ranked',
    productId: a.productId,
    badge: { text: a.tier, color: tierColor(a.tier) },
    review: a.standout ?? a.note,
    likes: a.likes,
    timeAgo: a.timeAgo,
    seed: demoComments(a.id, 2),
  };
}

function moveToPost(id: string): ActivityPost | undefined {
  const m = rankMoves.find((x) => x.id === id);
  if (!m) return undefined;
  const p = getPerson(m.personId);
  const isNew = m.fromRank == null;
  return {
    id: m.id,
    personId: m.personId,
    person: { name: p?.name ?? 'Someone', tint: p?.tint },
    action: isNew ? (m.toRank === 1 ? 'ranked a new #1' : 'ranked') : 're-ranked',
    productId: m.productId,
    badge: { text: `#${m.toRank}`, color: tierColor('A') },
    review: m.reason,
    likes: 0,
    timeAgo: m.timeAgo,
    seed: demoComments(m.id, 1),
  };
}

// Resolve a post by id from either the ranking feed or the rank-move stream.
export function getPostById(id: string): ActivityPost | undefined {
  return feedToPost(id) ?? moveToPost(id);
}
