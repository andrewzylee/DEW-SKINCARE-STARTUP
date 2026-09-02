// Skin Match — a personalized "is this right for MY skin?" score.
//
// The memo's killer feature, but it can't wait for a big outcome dataset. So this is
// ingredient/attribute-SEEDED: a deterministic score from the catalog's structured data
// (skin types, concern tags, price) vs. the user's profile — useful at n=0 — nudged by the
// mock community signal (lookalikeStats) where we have it. Real outcome data would blend in
// later. Everything here is explainable (we return the reasons), never a black box.
import { lookalikeStats, productDomain, type Finish, type Product, type ScentFamily } from '../data/mockCatalog';
import type { Concern, PriceTier, SkinType } from '../data/mockCatalog';
import type { UserProfile } from '../data/quiz';

const TIER_RANK: Record<PriceTier, number> = { $: 1, $$: 2, $$$: 3 };

const FINISH_NOTE: Record<Finish, string> = {
  dewy: 'Glazed, dewy finish',
  glowy: 'Lit-from-within glow',
  natural: 'Skin-like, natural finish',
  satin: 'Soft satin finish',
  matte: 'Long-wear matte finish',
};

const SCENT_LABEL: Record<ScentFamily, string> = {
  fresh: 'Fresh & aromatic',
  citrus: 'Bright citrus',
  woody: 'Woody',
  floral: 'Floral',
  gourmand: 'Sweet gourmand',
  amber: 'Warm amber',
  aquatic: 'Clean aquatic',
  spicy: 'Warm spicy',
};

const GOAL_LABEL: Record<Concern, string> = {
  acne: 'breakouts',
  oil: 'oil & shine',
  texture: 'rough texture',
  darkspots: 'dark spots',
  starter: 'a simple routine',
};

const SKIN_LABEL: Record<SkinType, string> = {
  oily: 'oily',
  combination: 'combination',
  dry: 'dry',
  sensitive: 'sensitive',
};

export interface MatchReason {
  text: string;
  positive: boolean;
}

export interface SkinMatch {
  score: number; // 0–100
  reasons: MatchReason[];
}

// tiny deterministic string hash → stable per-product pseudo-randomness
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function skinMatch(profile: UserProfile | null, p: Product): SkinMatch {
  const reasons: MatchReason[] = [];
  let score = 58;

  // Fragrance isn't a skin match at all — it's scent family, budget, and popularity. The real
  // personalization is Taste Match on people (fragrance is aesthetic, no phenotype/shade gating).
  if (productDomain(p) === 'fragrance') {
    score = 64;
    if (p.scentFamily) {
      score += 5;
      reasons.push({ text: SCENT_LABEL[p.scentFamily], positive: true });
    }
    if ((p.styleTags ?? []).includes('viral')) {
      score += 3;
      reasons.push({ text: 'Going viral right now', positive: true });
    }
    if (profile) {
      const diff = Math.abs(TIER_RANK[p.priceTier] - TIER_RANK[profile.budget]);
      if (diff === 0) {
        score += 6;
        reasons.push({ text: 'Right in your budget', positive: true });
      } else if (diff >= 2) {
        score -= 8;
        reasons.push({ text: 'Pricier than your budget', positive: false });
      }
    }
    const c = communityResults(p);
    score += (c.lovedPct - 66) * 0.4;
    if (c.lovedPct >= 74) reasons.push({ text: `${c.lovedPct}% of people loved it`, positive: true });
    score += (hash(p.id) % 7) - 3;
    return { score: Math.round(clamp(score, 44, 98)), reasons: reasons.slice(0, 3) };
  }

  // Makeup isn't matched to skin type — it's matched to finish, budget, and popularity (the
  // ranking-driven "taste" signal lives in Taste Match on people, not here).
  if (productDomain(p) === 'makeup') {
    score = 62;
    if (p.finish) {
      score += 6;
      reasons.push({ text: FINISH_NOTE[p.finish], positive: true });
    }
    if ((p.styleTags ?? []).includes('viral')) {
      score += 3;
      reasons.push({ text: 'Going viral right now', positive: true });
    }
    if (profile) {
      const diff = Math.abs(TIER_RANK[p.priceTier] - TIER_RANK[profile.budget]);
      if (diff === 0) {
        score += 6;
        reasons.push({ text: 'Right in your budget', positive: true });
      } else if (diff >= 2) {
        score -= 8;
        reasons.push({ text: 'Pricier than your budget', positive: false });
      }
    }
    const c = communityResults(p);
    score += (c.lovedPct - 66) * 0.4;
    if (c.lovedPct >= 74) reasons.push({ text: `${c.lovedPct}% of people loved it`, positive: true });
    score += (hash(p.id) % 7) - 3;
    return { score: Math.round(clamp(score, 44, 98)), reasons: reasons.slice(0, 3) };
  }

  if (profile) {
    if (p.skinTypes.includes(profile.skinType)) {
      score += 22;
      reasons.push({ text: `Made for ${SKIN_LABEL[profile.skinType]} skin`, positive: true });
    } else {
      score -= 15;
      reasons.push({ text: `Not aimed at ${SKIN_LABEL[profile.skinType]} skin`, positive: false });
    }

    if (p.concernTags.includes(profile.goal)) {
      score += 16;
      reasons.push({ text: `Targets ${GOAL_LABEL[profile.goal]}`, positive: true });
    }

    const diff = Math.abs(TIER_RANK[p.priceTier] - TIER_RANK[profile.budget]);
    if (diff === 0) {
      score += 6;
      reasons.push({ text: 'Right in your budget', positive: true });
    } else if (diff >= 2) {
      score -= 9;
      reasons.push({ text: 'Pricier than your budget', positive: false });
    }

    if (profile.skinType === 'sensitive' && p.concernTags.includes('starter')) {
      score += 5;
      reasons.push({ text: 'Gentle enough for reactive skin', positive: true });
    }
    if (profile.depth === 'none' && p.concernTags.includes('starter')) {
      score += 5;
      reasons.push({ text: 'Beginner-friendly', positive: true });
    }
  } else if (p.concernTags.includes('starter')) {
    score += 8;
    reasons.push({ text: 'A safe, well-liked starting point', positive: true });
  }

  // Nudge toward the mock community signal where we have it.
  const stat = lookalikeStats.find((s) => s.productId === p.id);
  if (stat) score += (stat.pctSTier - 70) * 0.25;

  // Stable per-product jitter so scores feel distinct, not clustered.
  score += (hash(p.id) % 7) - 3;

  return { score: Math.round(clamp(score, 41, 98)), reasons: reasons.slice(0, 3) };
}

// ---- Mock community results (deterministic per product) ----
export interface CommunityResults {
  tried: number;
  lovedPct: number;
  neutralPct: number;
  stoppedPct: number;
  repurchasePct: number;
  avgWeeks: number;
}

export function communityResults(p: Product): CommunityResults {
  const h = hash(p.id);
  const tried = 120 + (h % 880);
  let loved = 55 + (h % 24);
  const stat = lookalikeStats.find((s) => s.productId === p.id);
  if (stat) loved = Math.max(loved, stat.pctSTier - 4);
  loved = clamp(loved, 46, 92);
  const stopped = clamp(5 + ((h >> 3) % 12), 4, 18);
  const neutral = clamp(100 - loved - stopped, 0, 100);
  const repurchase = clamp(loved + 4 - ((h >> 5) % 7), 42, 95);
  const avgWeeks = 3 + ((h >> 7) % 8);
  return { tried, lovedPct: loved, neutralPct: neutral, stoppedPct: stopped, repurchasePct: repurchase, avgWeeks };
}

// Repurchase rate among people who share the user's skin type (cohort-adjusted).
export function cohortRepurchase(profile: UserProfile | null, p: Product): number {
  const base = communityResults(p).repurchasePct;
  if (!profile) return base;
  const match = p.skinTypes.includes(profile.skinType);
  return clamp(base + (match ? 6 : -9), 40, 96);
}
