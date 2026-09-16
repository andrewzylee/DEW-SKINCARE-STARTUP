// Shade Match — Dew's acquisition wedge, ported verbatim in spirit from the web reference
// (src/lib/shadeMatch.ts). Shade/undertone-aware picks for the makeup categories where color
// actually depends on your skin: foundation, concealer, blush, lip. Content-based, so it works for
// a brand-new solo user on day one with no social graph (solves cold-start at n=1), and layers in
// "people with your skin" as honest social proof where a graph exists. Deterministic + explainable.
import { catalog } from './catalog';
import { people } from './social';
import { friendRankedShelf } from './taste';
import type { Category, Person, Product, Tone, Undertone } from './types';

// The categories where shade/undertone matters. Mascara, setting, brow are shade-agnostic.
export const SHADE_CATEGORIES: Category[] = ['foundation', 'concealer', 'blush', 'lip'];

export const TONES: Tone[] = ['fair', 'light', 'medium', 'tan', 'deep'];
export const UNDERTONES: Undertone[] = ['cool', 'neutral', 'warm'];

const TONE_INDEX: Record<Tone, number> = { fair: 0, light: 1, medium: 2, tan: 3, deep: 4 };
export const TONE_LABEL: Record<Tone, string> = {
  fair: 'Fair',
  light: 'Light',
  medium: 'Medium',
  tan: 'Tan',
  deep: 'Deep',
};
export const UNDERTONE_LABEL: Record<Undertone, string> = {
  cool: 'Cool',
  neutral: 'Neutral',
  warm: 'Warm',
};

// Brands with genuinely wide, inclusive shade ranges → higher confidence of a match at any tone.
const WIDE_RANGE = new Set(['Fenty Beauty', 'NARS', 'Maybelline', 'e.l.f.', 'Charlotte Tilbury']);

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const toneDistance = (a: Tone, b: Tone) => Math.abs(TONE_INDEX[a] - TONE_INDEX[b]);

// A product's stable "undertone lean" — from its style tags where meaningful, else a stable hash.
function productUndertone(p: Product): Undertone {
  const tags = p.styleTags ?? [];
  if (tags.includes('glowy') || tags.includes('kbeauty')) return 'warm';
  if (tags.includes('matte') || tags.includes('bold')) return 'cool';
  return (['cool', 'neutral', 'warm'] as Undertone[])[hash(p.id) % 3];
}

// People whose tone + undertone are close to yours — "your skin". Powers social proof + the
// "people with your skin" strip. Distance blends tone steps and an undertone mismatch penalty.
export function similarSkinPeople(tone?: Tone, undertone?: Undertone): Person[] {
  if (!tone) return [];
  return people
    .filter((p): p is Person & { tone: Tone } => !!p.tone)
    .map((p) => {
      const und =
        undertone && p.undertone && p.undertone !== undertone && undertone !== 'neutral' && p.undertone !== 'neutral';
      return { p, d: toneDistance(tone, p.tone) + (und ? 1.2 : 0) };
    })
    .filter((x) => x.d <= 1.5)
    .sort((a, b) => a.d - b.d)
    .map((x) => x.p);
}

// How many people with skin like yours rank a product in the top third of its category.
function fansLikeYou(productId: string, category: Category, fans: Person[]): number {
  let n = 0;
  for (const person of fans) {
    const hit = friendRankedShelf(person.id).find(
      (r) => r.productId === productId && r.category === category,
    );
    if (!hit) continue;
    const topThird = hit.groupSize <= 1 ? true : (hit.groupRank - 1) / (hit.groupSize - 1) <= 0.34;
    if (topThird) n += 1;
  }
  return n;
}

export interface ShadePick {
  product: Product;
  fit: number; // 0..100 shade-fit confidence
  reason: string;
  fansLikeYou: number; // people with similar skin who rank it highly
}

// Best shade-matched picks for one category, given the user's tone/undertone.
export function shadePicksForCategory(
  category: Category,
  tone: Tone | undefined,
  undertone: Undertone | undefined,
  fans: Person[],
  limit = 2,
): ShadePick[] {
  const items = catalog.filter((p) => p.category === category);
  const scored = items.map((p) => {
    let fit = 62;
    const reasons: string[] = [];

    if (undertone) {
      const lean = productUndertone(p);
      if (lean === undertone) {
        fit += 16;
        reasons.push(`Flatters ${UNDERTONE_LABEL[undertone].toLowerCase()} undertones`);
      } else if (lean === 'neutral' || undertone === 'neutral') {
        fit += 6;
        reasons.push('Undertone-flexible');
      } else {
        fit -= 8;
      }
    }

    const wide = WIDE_RANGE.has(p.brand);
    if (wide) {
      fit += 10;
      reasons.push('Wide, inclusive shade range');
    }
    // Ranges are often thin at the extremes — a non-inclusive brand is a riskier match there.
    if (tone && (tone === 'fair' || tone === 'deep') && !wide) fit -= 9;

    const fans2 = fansLikeYou(p.id, category, fans);
    fit += Math.min(fans2 * 4, 12);
    if (fans2 > 0) reasons.unshift(`${fans2} with your skin rank it top`);

    fit += (hash(p.id + (tone ?? '') + (undertone ?? '')) % 7) - 3;
    return {
      product: p,
      fit: Math.round(clamp(fit, 40, 99)),
      reason: reasons[0] ?? 'Popular, easy-to-wear pick',
      fansLikeYou: fans2,
    };
  });
  return scored.sort((a, b) => b.fit - a.fit).slice(0, limit);
}

export interface ShadeResult {
  tone?: Tone;
  undertone?: Undertone;
  fans: Person[];
  byCategory: { category: Category; picks: ShadePick[] }[];
}

export function shadeMatch(tone?: Tone, undertone?: Undertone): ShadeResult {
  const fans = similarSkinPeople(tone, undertone);
  const byCategory = SHADE_CATEGORIES.map((category) => ({
    category,
    picks: shadePicksForCategory(category, tone, undertone, fans),
  }));
  return { tone, undertone, fans, byCategory };
}
