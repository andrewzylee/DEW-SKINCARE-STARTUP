// STACK — the ranking mechanic (§4). Beli-style binary-search insertion.
//
// In a real UI the pairwise question is answered asynchronously (the user taps a button),
// so we can't run the spec's synchronous loop with a blocking askComparison(). Instead we
// model the binary search as a small, resumable state machine: each step exposes the item
// to compare against; applying the user's answer narrows [lo, hi); when the range collapses
// the product is inserted at `lo`. Converges in ~log2(n) comparisons.

export type Tier = 'S' | 'A' | 'B' | 'C' | 'F';

// Tier bands by rank percentile (tunable) — matches the spec's recomputeTiers thresholds.
export function tierForPercentile(pct: number): Tier {
  if (pct <= 0.15) return 'S';
  if (pct <= 0.4) return 'A';
  if (pct <= 0.7) return 'B';
  if (pct <= 0.9) return 'C';
  return 'F';
}

// ---- Reaction-anchored ABSOLUTE tiers (the real ranking quality signal) ----
// Pure percentile made the #1 of every (often tiny) category an automatic S, so a single "meh"
// product read as elite. Instead we anchor an absolute 0–100 score to your gut reaction, then
// nudge by position within the category. S is EARNED — you have to love it — not handed to
// whatever happens to sit on top of a short list. Tiers stay meaningful even at one product.
// Optional "how close?" magnitude captured at final placement — the gap to the item just above.
export type Strength = 'tied' | 'close' | 'step';

// Absolute ceiling for a product's score from its gut reaction: the tier can't exceed this, so a
// "fine" product never reads S no matter where it sits. #1 of a category scores exactly its cap.
const REACTION_CAP: Record<Reaction, number> = {
  love: 92,
  like: 82,
  fine: 65,
  dislike: 55,
  never: 45,
};
const NEUTRAL_CAP = 73; // no reaction captured (older / imported items)
export function reactionCap(reaction?: Reaction): number {
  return reaction ? REACTION_CAP[reaction] : NEUTRAL_CAP;
}

// How far a product sits below the one ranked just above it — the strength tap. "Basically tied"
// barely drops (same tier likely); a "clear step down" can push it a tier lower.
const STRENGTH_GAP: Record<Strength, number> = { tied: 1, close: 5, step: 11 };
export function strengthGap(strength?: Strength): number {
  return STRENGTH_GAP[strength ?? 'close'];
}

// Absolute tier thresholds — S is rare and earned, F is a regret buy.
export function tierForScore(score: number): Tier {
  if (score >= 90) return 'S';
  if (score >= 79) return 'A';
  if (score >= 66) return 'B';
  if (score >= 52) return 'C';
  return 'F';
}

// Assign 1-based rank + tier to an ordered shelf (index 0 = top / best).
export function recomputeTiers<T extends object>(
  shelf: T[],
): Array<T & { rank: number; tier: Tier }> {
  const n = shelf.length;
  return shelf.map((item, i) => {
    const pct = i / Math.max(n - 1, 1);
    return { ...item, rank: i + 1, tier: tierForPercentile(pct) };
  });
}

// Per-category ranking (you rank blushes against blushes, not against a cleanser). Keeps the
// global order for `rank`, but computes `groupRank`/`groupSize`/`tier` within each category —
// so a product can be "#2 of 8 blushes". Tier is the within-category percentile band.
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

// ---------- Resumable pairwise-comparison session ----------

export interface CompareSession {
  productId: string; // the product being inserted
  lo: number;
  hi: number;
  done: number; // comparisons answered so far
  estimate: number; // expected total comparisons (for the progress dots)
}

// A range of size m needs ceil(log2(m + 1)) comparisons to fully resolve.
function comparisonsFor(rangeSize: number): number {
  if (rangeSize <= 0) return 0;
  return Math.max(1, Math.ceil(Math.log2(rangeSize + 1)));
}

export function startCompare(productId: string, shelfLength: number): CompareSession {
  return {
    productId,
    lo: 0,
    hi: shelfLength,
    done: 0,
    estimate: comparisonsFor(shelfLength),
  };
}

// A quick gut reaction when adding a product. It seeds WHERE in the category the binary search
// starts — fewer comparisons and an emotional anchor. Not shown as a number to the user.
export type Reaction = 'love' | 'like' | 'fine' | 'dislike' | 'never';

// Map a reaction to a starting [lo, hi) sub-range of the category. Ranges overlap slightly so a
// misjudged reaction self-corrects within a comparison or two (the list stays the source of truth).
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

// Start a comparison session already narrowed to [lo, hi) (from a reaction).
export function startCompareInRange(productId: string, lo: number, hi: number): CompareSession {
  const l = Math.max(0, Math.min(lo, hi));
  const h = Math.max(l, hi);
  return { productId, lo: l, hi: h, done: 0, estimate: comparisonsFor(h - l) };
}

export function isCompareDone(s: CompareSession): boolean {
  return s.lo >= s.hi;
}

// The index in the current shelf to show as the opponent, or null if finished.
export function compareTargetIndex(s: CompareSession): number | null {
  if (isCompareDone(s)) return null;
  return Math.floor((s.lo + s.hi) / 2);
}

// newWins === true  -> the inserted product "did more for my skin" -> it ranks ABOVE mid.
export function applyCompare(s: CompareSession, newWins: boolean): CompareSession {
  const mid = Math.floor((s.lo + s.hi) / 2);
  const next = newWins ? { ...s, hi: mid } : { ...s, lo: mid + 1 };
  return { ...next, done: s.done + 1 };
}

// Where the product lands once the session is done.
export function insertionIndex(s: CompareSession): number {
  return s.lo;
}

// Comparisons still expected — drives the "how many left" progress dots.
export function remainingComparisons(s: CompareSession): number {
  return comparisonsFor(s.hi - s.lo);
}

// ---------- Reference: the spec's synchronous version (used in unit tests) ----------
// Kept faithful to §4 for clarity and testing; the UI uses the resumable API above.
export function insertProductSync<T>(
  newItem: T,
  ranked: T[],
  // returns true if newItem "did more for my skin" than the existing item
  prefersNew: (a: T, b: T) => boolean,
): T[] {
  let lo = 0;
  let hi = ranked.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (prefersNew(newItem, ranked[mid])) hi = mid;
    else lo = mid + 1;
  }
  const out = ranked.slice();
  out.splice(lo, 0, newItem);
  return out;
}

// UI helper: the CSS variable for a tier's color (tokens map in tailwind.config.js).
export function tierVar(tier: Tier): string {
  return `rgb(var(--tier-${tier.toLowerCase()}))`;
}
