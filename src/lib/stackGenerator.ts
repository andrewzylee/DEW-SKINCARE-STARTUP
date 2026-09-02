// src/lib/stackGenerator.ts
// STACK — turns a resolved quiz profile into a personalized AM/PM routine.
// Rules: 3-4 steps max, one targeted active, always SPF in the AM. Beginners get the
// simplest possible routine with a ramp-up note. Explainable > clever.

import { catalog, type Product, type Category, type Concern, type PriceTier } from '../data/mockCatalog';
import type { UserProfile } from '../data/quiz';

export interface GeneratedStack {
  am: Product[];
  pm: Product[];
  notes: string[];
}

const TIER_RANK: Record<PriceTier, number> = { $: 1, $$: 2, $$$: 3 };

// Score a product for a given profile + the concern we're matching against.
function score(p: Product, profile: UserProfile, concern: Concern): number {
  let s = 0;
  if (p.concernTags.includes(concern)) s += 3; // matches what they want to fix
  if (p.skinTypes.includes(profile.skinType)) s += 2; // safe for their skin
  s -= Math.abs(TIER_RANK[p.priceTier] - TIER_RANK[profile.budget]); // near their budget
  if (p.concernTags.includes('starter')) s += 0.5; // gentle tiebreak toward approachable picks
  return s;
}

function pickBest(pool: Product[], category: Category, profile: UserProfile, concern: Concern): Product | undefined {
  return pool
    .filter((p) => p.category === category)
    .sort((a, b) => score(b, profile, concern) - score(a, profile, concern))[0];
}

export function generateStack(profile: UserProfile): GeneratedStack {
  // Only ever recommend products safe for this skin type.
  const pool = catalog.filter((p) => p.skinTypes.includes(profile.skinType));
  const goal = profile.goal;

  const cleanser = pickBest(pool, 'cleanser', profile, goal);
  const moisturizer = pickBest(pool, 'moisturizer', profile, goal);
  const spf = pickBest(pool, 'spf', profile, goal);

  // Targeted active: best treatment/serum matching the goal. Skip for "starter" goal.
  const wantsActive = goal !== 'starter';
  const activePool = pool.filter(
    (p) => (p.category === 'treatment' || p.category === 'serum') && p.concernTags.includes(goal),
  );
  // For the active slot, prefer true targeted treatments (adapalene, BPO, BHA) over
  // supportive serums (niacinamide, hydration) so the flagship acne case leads with the
  // dermatologically strongest pick. Beginners still get the ramp-up note below.
  const activeScore = (p: Product) => score(p, profile, goal) + (p.category === 'treatment' ? 0.75 : 0);
  const active = wantsActive
    ? activePool.sort((a, b) => activeScore(b) - activeScore(a))[0]
    : undefined;

  const am: Product[] = [];
  const pm: Product[] = [];
  const notes: string[] = [];

  // AM: cleanser -> (AM-only active, e.g. Vitamin C) -> moisturizer -> SPF
  if (cleanser) am.push(cleanser);
  if (active && active.timeOfDay === 'am') am.push(active);
  if (moisturizer) am.push(moisturizer);
  if (spf) am.push(spf);

  // PM: cleanser -> active (anything not AM-locked) -> moisturizer
  if (cleanser) pm.push(cleanser);
  if (active && active.timeOfDay !== 'am') pm.push(active);
  if (moisturizer) pm.push(moisturizer);

  // Beginners: introduce the active slowly.
  if (profile.depth === 'none' && active) {
    notes.push(
      `Introduce ${active.brand} ${active.name} slowly \u2014 2\u20133 nights a week for the first few weeks, then build up as your skin adjusts.`,
    );
  }

  // "Just build a basic routine" for a total beginner = keep it dead simple.
  if (goal === 'starter' && profile.depth === 'none') {
    notes.push('Master these basics first. Once it\u2019s a habit, add one targeted product for your top concern.');
  }

  // Universal reminder.
  notes.push('Same cleanser and moisturizer work morning and night \u2014 you only need one of each.');

  return { am, pm, notes };
}
