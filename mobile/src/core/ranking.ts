// Ranking mechanic — ported from the web reference (src/lib/ranking.ts). Reaction-anchored
// absolute tiers so S is earned, plus per-category grouping ("#2 of 8 blushes").
import { palette } from './theme';
import type { Reaction, Strength, Tier } from './types';

export function tierForPercentile(pct: number): Tier {
  if (pct <= 0.15) return 'S';
  if (pct <= 0.4) return 'A';
  if (pct <= 0.7) return 'B';
  if (pct <= 0.9) return 'C';
  return 'F';
}

const REACTION_CAP: Record<Reaction, number> = { love: 92, like: 82, fine: 65, dislike: 55, never: 45 };
const NEUTRAL_CAP = 73;
export function reactionCap(reaction?: Reaction): number {
  return reaction ? REACTION_CAP[reaction] : NEUTRAL_CAP;
}

const STRENGTH_GAP: Record<Strength, number> = { tied: 1, close: 5, step: 11 };
export function strengthGap(strength?: Strength): number {
  return STRENGTH_GAP[strength ?? 'close'];
}

export function tierForScore(score: number): Tier {
  if (score >= 90) return 'S';
  if (score >= 79) return 'A';
  if (score >= 66) return 'B';
  if (score >= 52) return 'C';
  return 'F';
}

// Per-category ranking: keeps global order for `rank`, computes groupRank/groupSize/tier per group.
export function recomputeTiersGrouped<T extends object>(
  shelf: T[],
  groupKey: (item: T) => string,
): Array<T & { rank: number; tier: Tier; groupRank: number; groupSize: number }> {
  const sizes = new Map<string, number>();
  for (const it of shelf) {
    const g = groupKey(it);
    sizes.set(g, (sizes.get(g) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  return shelf.map((item, i) => {
    const g = groupKey(item);
    const groupSize = sizes.get(g)!;
    const groupRank = (seen.get(g) ?? 0) + 1;
    seen.set(g, groupRank);
    const pct = groupSize > 1 ? (groupRank - 1) / (groupSize - 1) : 0;
    return { ...item, rank: i + 1, groupRank, groupSize, tier: tierForPercentile(pct) };
  });
}

// Tier → color (the web used CSS vars; native maps straight to the palette).
const TIER_COLOR: Record<Tier, string> = {
  S: palette.tierS,
  A: palette.tierA,
  B: palette.tierB,
  C: '#B79C7E', // muted tan (no --tier-c token in the reference)
  F: palette.tierF,
};
export const tierColor = (tier: Tier): string => TIER_COLOR[tier];

// ---------- resumable pairwise-comparison session (Beli-style binary-search insert) ----------
export interface CompareSession {
  productId: string;
  lo: number;
  hi: number;
  done: number;
  estimate: number;
}

function comparisonsFor(rangeSize: number): number {
  if (rangeSize <= 0) return 0;
  return Math.max(1, Math.ceil(Math.log2(rangeSize + 1)));
}

// A gut reaction seeds WHERE in the category the search starts (fewer comparisons + an anchor).
export function reactionRange(reaction: Reaction, n: number): { lo: number; hi: number } {
  if (n <= 0) return { lo: 0, hi: 0 };
  const hiTop = (frac: number) => Math.min(n, Math.max(1, Math.ceil(n * frac)));
  switch (reaction) {
    case 'love':
      return { lo: 0, hi: hiTop(0.34) };
    case 'like':
      return { lo: 0, hi: hiTop(0.6) };
    case 'fine':
      return { lo: Math.floor(n * 0.2), hi: hiTop(0.8) };
    case 'dislike':
      return { lo: Math.floor(n * 0.4), hi: n };
    case 'never':
      return { lo: Math.floor(n * 0.7), hi: n };
  }
}

export function startCompareInRange(productId: string, lo: number, hi: number): CompareSession {
  const l = Math.max(0, Math.min(lo, hi));
  const h = Math.max(l, hi);
  return { productId, lo: l, hi: h, done: 0, estimate: comparisonsFor(h - l) };
}
export const isCompareDone = (s: CompareSession): boolean => s.lo >= s.hi;
export function compareTargetIndex(s: CompareSession): number | null {
  if (isCompareDone(s)) return null;
  return Math.floor((s.lo + s.hi) / 2);
}
// newWins === true → the inserted product ranks ABOVE mid.
export function applyCompare(s: CompareSession, newWins: boolean): CompareSession {
  const mid = Math.floor((s.lo + s.hi) / 2);
  const next = newWins ? { ...s, hi: mid } : { ...s, lo: mid + 1 };
  return { ...next, done: s.done + 1 };
}
export const insertionIndex = (s: CompareSession): number => s.lo;
