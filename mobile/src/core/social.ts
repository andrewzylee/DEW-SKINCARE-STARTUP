// Sample social graph (placeholder — production data comes from Supabase). A co-ed, multi-tone
// Gen-Z cast so Taste Match has real variety. Every product id below exists in the sample catalog.
import type { FeedActivity, Person, RankMove } from './types';

export const people: Person[] = [
  { id: 'emily', name: 'Emily Rker', handle: 'emilyskin', tint: '#0C8F62', skinType: 'oily', tone: 'light', undertone: 'neutral', bio: 'oily & acne-prone · glowy minimalist', location: 'Brooklyn, NY' },
  { id: 'marcus', name: 'Marcus Vale', handle: 'marcusv', tint: '#4B83F0', skinType: 'combination', tone: 'tan', undertone: 'warm', bio: 'combination skin · SPF + skin tint everyday', location: 'Austin, TX' },
  { id: 'devon', name: 'Devon Lee', handle: 'devonglow', tint: '#D7A13A', skinType: 'oily', tone: 'deep', undertone: 'warm', bio: 'budget beauty, big results', location: 'Chicago, IL' },
  { id: 'priya', name: 'Priya N', handle: 'priyaderm', tint: '#EC6A5A', skinType: 'sensitive', tone: 'medium', undertone: 'warm', bio: 'sensitive skin · fragrance-free only', location: 'London, UK' },
  { id: 'theo', name: 'Theo Park', handle: 'theoclears', tint: '#17B57F', skinType: 'oily', tone: 'light', undertone: 'cool', bio: 'K-beauty dewy · lashes + lip masks', location: 'Seoul, KR' },
  { id: 'sam', name: 'Sam Ortiz', handle: 'samo', tint: '#8A8F99', skinType: 'dry', tone: 'fair', undertone: 'cool', bio: 'dry skin · bold glam era', location: 'Denver, CO' },
];

export const getPerson = (id: string): Person | undefined => people.find((p) => p.id === id);

// Each friend's ranked shelf (best → worst); per-category ranks are derived from order.
export const friendShelves: Record<string, string[]> = {
  emily: ['rare-beauty-blush', 'glossier-skin-tint', 'rhode-peptide-lip', 'cerave-foaming-cleanser', 'boj-relief-sun', 'maybelline-sky-high', 'ordinary-niacinamide', 'saie-dew-blush', 'glossier-you'],
  marcus: ['boj-relief-sun', 'glossier-skin-tint', 'kosas-revealer', 'summer-fridays-lip', 'cerave-foaming-cleanser', 'ilia-limitless-lash', 'chanel-bleu'],
  devon: ['maybelline-sky-high', 'nyx-butter-gloss', 'rare-beauty-blush', 'ordinary-niacinamide', 'cerave-daily-lotion', 'lrp-anthelios-clear'],
  priya: ['ilia-limitless-lash', 'kosas-revealer', 'differin-adapalene', 'rhode-peptide-lip', 'vanicream-cleanser', 'lrp-toleriane-moist', 'saie-dew-blush', 'glossier-you', 'lelabo-santal33'],
  theo: ['glossier-skin-tint', 'rhode-pocket-blush', 'boj-relief-sun', 'paulas-choice-bha', 'ilia-limitless-lash'],
  sam: ['ctilbury-pillowtalk', 'kosas-revealer', 'krave-barrier', 'cerave-hydrating-cleanser', 'tomford-tobacco-vanille'],
};

// "Me" — a starter shelf so Taste Match varies (until it's read from the signed-in user's DB shelf).
export const myShelf: string[] = [
  'saie-dew-blush', 'glossier-skin-tint', 'boj-relief-sun', 'ordinary-niacinamide',
  'rhode-peptide-lip', 'cerave-foaming-cleanser', 'glossier-you', 'ilia-limitless-lash',
];

export const feed: FeedActivity[] = [
  { id: 'a1', personId: 'emily', productId: 'cerave-foaming-cleanser', tier: 'S', standout: 'Cut my oil without the tight, squeaky feeling.', likes: 1243, timeAgo: '2 minutes ago', withNames: ['Theo', 'Me'] },
  { id: 'a2', personId: 'priya', productId: 'differin-adapalene', tier: 'S', note: 'Slow start, but it cleared my forehead in about 3 weeks.', likes: 842, timeAgo: '1 hour ago' },
  { id: 'a3', personId: 'marcus', productId: 'boj-relief-sun', tier: 'A', note: 'No white cast, feels like nothing. Wear it daily now.', likes: 512, timeAgo: '4 hours ago' },
  { id: 'a4', personId: 'devon', productId: 'ordinary-niacinamide', tier: 'B', note: 'Helped the shine a bit — not magic, but for $6 I keep it around.', likes: 1876, timeAgo: '12 hours ago' },
  { id: 'a5', personId: 'theo', productId: 'paulas-choice-bha', tier: 'S', standout: 'Smoothed the bumps on my nose in a week.', likes: 964, timeAgo: 'Yesterday' },
];

export const rankMoves: RankMove[] = [
  { id: 'rm1', personId: 'emily', productId: 'saie-dew-blush', fromRank: 3, toRank: 1, groupSize: 7, reason: 'Finally edged out Rare Beauty after months.', timeAgo: '40m' },
  { id: 'rm2', personId: 'marcus', productId: 'chanel-bleu', fromRank: null, toRank: 1, groupSize: 5, timeAgo: '2h' },
  { id: 'rm3', personId: 'devon', productId: 'nyx-butter-gloss', fromRank: 2, toRank: 6, groupSize: 9, reason: 'Got too sticky in the summer heat.', timeAgo: '6h' },
  { id: 'rm4', personId: 'priya', productId: 'lelabo-santal33', fromRank: null, toRank: 1, groupSize: 4, timeAgo: '1d' },
  { id: 'rm5', personId: 'sam', productId: 'tomford-tobacco-vanille', fromRank: 2, toRank: 1, groupSize: 8, reason: 'My scent of the winter.', timeAgo: '1d' },
  { id: 'rm6', personId: 'theo', productId: 'paulas-choice-bha', fromRank: 4, toRank: 2, groupSize: 6, timeAgo: '2d' },
];
