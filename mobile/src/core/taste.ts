// Taste Match — the app's differentiator, ported from the web reference. Two ranked shelves →
// a 0–100 "taste match" that leans on ranking agreement (consensus-discounted so agreeing on
// divisive picks counts more than agreeing on universal favorites) and falls back to style
// similarity when overlap is thin.
import { getProduct } from './catalog';
import { recomputeTiersGrouped } from './ranking';
import { friendShelves } from './social';
import type { Category, Product, Tier } from './types';

export interface TasteItem {
  productId: string;
  category: string;
  score: number; // 0..1 within its category (1 = #1 of that category)
  styleTags: string[];
}

const catScore = (groupRank: number, groupSize: number) =>
  groupSize <= 1 ? 1 : 1 - (groupRank - 1) / (groupSize - 1);

export function tasteItemsFromIds(ids: string[]): TasteItem[] {
  const withCat = ids
    .map((id) => getProduct(id))
    .filter((p): p is Product => !!p)
    .map((p) => ({ productId: p.id, category: p.category as string, styleTags: p.styleTags ?? [] }));
  return recomputeTiersGrouped(withCat, (it) => it.category).map((r) => ({
    productId: r.productId,
    category: r.category,
    score: catScore(r.groupRank, r.groupSize),
    styleTags: r.styleTags,
  }));
}

export const friendTasteItems = (personId: string): TasteItem[] =>
  tasteItemsFromIds(friendShelves[personId] ?? []);

export interface RankedLite {
  productId: string;
  category: Category;
  tier: Tier;
  rank: number;
  groupRank: number;
  groupSize: number;
}
export function rankedFromIds(ids: string[]): RankedLite[] {
  const withCat = ids
    .map((id) => getProduct(id))
    .filter((p): p is Product => !!p)
    .map((p) => ({ productId: p.id, category: p.category }));
  return recomputeTiersGrouped(withCat, (it) => it.category);
}
export const friendRankedShelf = (personId: string): RankedLite[] =>
  rankedFromIds(friendShelves[personId] ?? []);

// ---- taste archetype (the shareable label) ----
const ARCHETYPES: { label: string; tags: string[] }[] = [
  { label: 'Bold & Glam', tags: ['bold', 'glam', 'matte', 'luxe'] },
  { label: 'Clean Minimalist', tags: ['clean', 'minimal', 'natural', 'skinlike'] },
  { label: 'Glowy It-Girl', tags: ['glowy', 'dewy', 'viral'] },
  { label: 'Budget Genius', tags: ['budget', 'dupe'] },
  { label: 'K-Beauty Dewy', tags: ['kbeauty', 'dewy'] },
];
export function archetypeOf(items: TasteItem[]): string {
  if (items.length === 0) return 'Fresh Face';
  const weight = new Map<string, number>();
  items.forEach((it) => {
    if (it.score < 0.34) return;
    it.styleTags.forEach((t) => weight.set(t, (weight.get(t) ?? 0) + 1));
  });
  let best = 'Balanced Beauty';
  let bestScore = 0;
  for (const a of ARCHETYPES) {
    const s = a.tags.reduce((acc, t) => acc + (weight.get(t) ?? 0), 0);
    if (s > bestScore) {
      bestScore = s;
      best = a.label;
    }
  }
  return best;
}

function styleVec(items: TasteItem[]): Map<string, number> {
  const m = new Map<string, number>();
  items.forEach((it) => it.styleTags.forEach((t) => m.set(t, (m.get(t) ?? 0) + it.score)));
  return m;
}
function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  a.forEach((v) => (na += v * v));
  b.forEach((v) => (nb += v * v));
  a.forEach((v, k) => {
    if (b.has(k)) dot += v * (b.get(k) as number);
  });
  if (na === 0 || nb === 0) return 0.5;
  return dot / Math.sqrt(na * nb);
}

// Consensus discounting: weight each product by how divisive it is, so agreeing on niche picks
// signals shared taste more than agreeing on universal favorites.
const popularity: Map<string, number> = (() => {
  const shelves = Object.values(friendShelves);
  const n = Math.max(shelves.length, 1);
  const hits = new Map<string, number>();
  for (const ids of shelves) {
    for (const r of rankedFromIds(ids)) {
      const topThird = r.groupSize <= 1 ? true : (r.groupRank - 1) / (r.groupSize - 1) <= 0.34;
      if (topThird) hits.set(r.productId, (hits.get(r.productId) ?? 0) + 1);
    }
  }
  const pop = new Map<string, number>();
  hits.forEach((v, k) => pop.set(k, v / n));
  return pop;
})();
export const consensusWeight = (productId: string): number => 1 - 0.6 * (popularity.get(productId) ?? 0);

export interface TasteMatch {
  score: number; // 0..100
  shared: string[];
  agree: string[];
  disagree: string[];
  archetype: string;
}

export function tasteMatch(mine: TasteItem[], theirs: TasteItem[]): TasteMatch {
  const myMap = new Map(mine.map((i) => [i.productId, i]));
  const shared: string[] = [];
  const agreeScored: { id: string; w: number }[] = [];
  const disagreeScored: { id: string; w: number }[] = [];
  let wClose = 0;
  let wSum = 0;

  theirs.forEach((t) => {
    const m = myMap.get(t.productId);
    if (!m) return;
    shared.push(t.productId);
    const w = consensusWeight(t.productId);
    wClose += w * (1 - Math.abs(m.score - t.score));
    wSum += w;
    if (m.score >= 0.6 && t.score >= 0.6) agreeScored.push({ id: t.productId, w });
    else if (Math.abs(m.score - t.score) >= 0.5) disagreeScored.push({ id: t.productId, w });
  });

  agreeScored.sort((a, b) => b.w - a.w);
  disagreeScored.sort((a, b) => b.w - a.w);

  const agreement = wSum ? wClose / wSum : 0.5;
  const style = cosine(styleVec(mine), styleVec(theirs));
  const confidence = Math.min(shared.length / 5, 1);
  const blended = confidence * agreement + (1 - confidence) * style;
  const score = Math.round(Math.max(0, Math.min(1, blended)) * 58 + 40);

  return {
    score: Math.min(99, score),
    shared,
    agree: agreeScored.map((x) => x.id),
    disagree: disagreeScored.map((x) => x.id),
    archetype: archetypeOf(theirs),
  };
}

export function tasteMatchWithFriend(mine: TasteItem[], personId: string): TasteMatch {
  return tasteMatch(mine, friendTasteItems(personId));
}
