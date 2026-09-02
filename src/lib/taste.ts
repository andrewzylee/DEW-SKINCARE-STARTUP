// Taste Match — the app's lead differentiator. Beli's insight applied to beauty: a review from
// a stranger is noise; a ranking from someone whose taste matches yours is signal. We turn two
// people's ranked shelves into a single 0–100 "taste match", plus what you agree and split on.
//
// How the score works, and why:
//  • Shared products → do you RANK them the same way? (normalized per-category score closeness.)
//  • Few/no shared products → fall back to STYLE similarity (shared taste tags) so new users
//    still get a meaningful number instead of a cold 0.
//  • The more you've both ranked in common, the more the score leans on ranking agreement over
//    style. That's the `confidence` blend below.
import {
  categoryDomain,
  getProduct,
  type Category,
  type Domain,
  type Product,
  type SkinType,
} from '../data/mockCatalog';
import { recomputeTiersGrouped, type Tier } from './ranking';
import { friendShelves, getPerson } from '../data/social';
import type { RankedShelfItem } from '../state/store';

export interface TasteItem {
  productId: string;
  category: string;
  score: number; // 0..1 within its category (1 = your #1 of that category)
  styleTags: string[];
}

const catScore = (groupRank: number, groupSize: number) =>
  groupSize <= 1 ? 1 : 1 - (groupRank - 1) / (groupSize - 1);

/** Build taste items from an ordered list of product ids (best → worst). */
export function tasteItemsFromIds(ids: string[]): TasteItem[] {
  const withCat = ids
    .map((id) => getProduct(id))
    .filter((p): p is Product => !!p)
    .map((p) => ({ productId: p.id, category: p.category, styleTags: p.styleTags ?? [] }));
  return recomputeTiersGrouped(withCat, (it) => it.category).map((r) => ({
    productId: r.productId,
    category: r.category,
    score: catScore(r.groupRank, r.groupSize),
    styleTags: r.styleTags,
  }));
}

/** Build taste items from the user's own ranked shelf (already per-category ranked). */
export function tasteItemsFromRanked(ranked: RankedShelfItem[]): TasteItem[] {
  return ranked.map((r) => ({
    productId: r.productId,
    category: r.category,
    score: catScore(r.groupRank, r.groupSize),
    styleTags: getProduct(r.productId)?.styleTags ?? [],
  }));
}

export const friendTasteItems = (personId: string): TasteItem[] =>
  tasteItemsFromIds(friendShelves[personId] ?? []);

// A friend's full per-category ranked shelf (for "#1 of 8 blushes"-style displays).
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

// ---- Taste archetype (the shareable label: "Clean Minimalist", "Bold Glam"…) ----
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
    if (it.score < 0.34) return; // only their favorites shape the label
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
  if (na === 0 || nb === 0) return 0.5; // no signal → neutral
  return dot / Math.sqrt(na * nb);
}

// ---- Consensus discounting (refinement: agreement on divisive picks is the real signal) ----
// Everyone rates Beauty of Joseon SPF and CeraVe highly, so agreeing on the consensus winners
// tells you almost nothing about shared taste. We weight each product by how *divisive* it is:
// popularity = share of friends who rank it in the top third of its category; weight falls as
// popularity rises. Without this, every pair reads ~90% and the headline number feels fake.
const _popularity: Map<string, number> = (() => {
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
/** 1 for a divisive/niche pick, down to ~0.4 for a near-universal favorite. */
export const consensusWeight = (productId: string): number =>
  1 - 0.6 * (_popularity.get(productId) ?? 0);

export interface TasteMatch {
  score: number; // 0..100
  shared: string[]; // product ids you've both ranked
  agree: string[]; // both rank highly (most divisive agreements first)
  disagree: string[]; // ranked very differently
  archetype: string; // their beauty-taste label
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
    const w = consensusWeight(t.productId); // divisive picks count more than consensus ones
    wClose += w * (1 - Math.abs(m.score - t.score));
    wSum += w;
    if (m.score >= 0.6 && t.score >= 0.6) agreeScored.push({ id: t.productId, w });
    else if (Math.abs(m.score - t.score) >= 0.5) disagreeScored.push({ id: t.productId, w });
  });

  // Surface the most *meaningful* (divisive) agreements & splits first.
  agreeScored.sort((a, b) => b.w - a.w);
  disagreeScored.sort((a, b) => b.w - a.w);

  const agreement = wSum ? wClose / wSum : 0.5; // consensus-weighted, 0..1
  const style = cosine(styleVec(mine), styleVec(theirs)); // 0..1
  const confidence = Math.min(shared.length / 5, 1); // lean on rankings once overlap is real
  const blended = confidence * agreement + (1 - confidence) * style;
  // Map to a friendly 0–100 band; a little lift so strong matches read as "your people".
  const score = Math.round(Math.max(0, Math.min(1, blended)) * 58 + 40);

  return {
    score: Math.min(99, score),
    shared,
    agree: agreeScored.map((x) => x.id),
    disagree: disagreeScored.map((x) => x.id),
    archetype: archetypeOf(theirs),
  };
}

/** Convenience: taste match between the user's ranked shelf and a friend by id. */
export function tasteMatchWithFriend(mine: TasteItem[], personId: string): TasteMatch {
  return tasteMatch(mine, friendTasteItems(personId));
}

// ---- Per-domain match (refinement: makeup taste is aesthetic; skincare is needs-based) ----
// Makeup taste is a pure aesthetic signal. Skincare "taste" is really needs-based — a dry,
// sensitive person's holy-grail moisturizer is irrelevant (or bad) for oily you — so we gate the
// skincare number by how aligned your skin types are. Two honest numbers beat one blended one.
const SKIN_ADJACENT: Record<SkinType, SkinType[]> = {
  oily: ['combination'],
  combination: ['oily', 'dry'],
  dry: ['combination', 'sensitive'],
  sensitive: ['dry'],
};
export function skinTypeSimilarity(a?: SkinType, b?: SkinType): number {
  if (!a || !b) return 0.7; // unknown → mildly neutral
  if (a === b) return 1;
  if (SKIN_ADJACENT[a]?.includes(b)) return 0.6;
  return 0.3;
}

export interface DomainMatches {
  makeup: TasteMatch;
  skincare: TasteMatch;
  fragrance: TasteMatch; // aesthetic, like makeup — no phenotype gate
  skinTypeSim: number; // 0..1 — how phenotype-aligned the skincare number is
}

const inDomain = (items: TasteItem[], d: Domain) =>
  items.filter((i) => categoryDomain(i.category as Category) === d);

export function tasteMatchByDomain(
  mine: TasteItem[],
  theirs: TasteItem[],
  skinTypeSim = 0.7,
): DomainMatches {
  const makeup = tasteMatch(inDomain(mine, 'makeup'), inDomain(theirs, 'makeup'));
  const fragrance = tasteMatch(inDomain(mine, 'fragrance'), inDomain(theirs, 'fragrance'));
  const raw = tasteMatch(inDomain(mine, 'skincare'), inDomain(theirs, 'skincare'));
  const gated = Math.round(40 + (raw.score - 40) * (0.5 + 0.5 * skinTypeSim));
  const skincare: TasteMatch = { ...raw, score: Math.max(40, Math.min(99, gated)) };
  return { makeup, skincare, fragrance, skinTypeSim };
}

/** Per-domain taste match with a friend, phenotype-gating skincare by your two skin types. */
export function tasteMatchByDomainWithFriend(
  mine: TasteItem[],
  personId: string,
  mySkinType?: SkinType,
): DomainMatches {
  const person = getPerson(personId);
  const sim = skinTypeSimilarity(mySkinType, person?.skinType);
  return tasteMatchByDomain(mine, friendTasteItems(personId), sim);
}
