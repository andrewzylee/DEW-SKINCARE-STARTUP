// Sample Discover content (production comes from Supabase). Featured lists + "works for skin
// like yours" cohort stats, mirroring the web reference.
import type { Domain } from './types';

export interface FeaturedList {
  id: string;
  title: string;
  subtitle: string;
  tint: string; // hex cover wash
  productIds: string[];
  blurb: string; // the evidence-based rationale
  domain?: Domain;
}

export const featuredLists: FeaturedList[] = [
  {
    id: 'budget-acne',
    title: 'Best Budget Acne Kit',
    subtitle: 'Clear skin under $60',
    tint: '#0C8F62',
    productIds: ['cerave-foaming-cleanser', 'differin-adapalene', 'paulas-choice-bha', 'cerave-daily-lotion', 'lrp-anthelios-clear'],
    blurb: 'Acne has four drivers at once — clogged pores, C. acnes bacteria, excess oil, and inflammation. This kit targets all four for under $60: a gentle cleanser, an OTC retinoid, an exfoliant, a light moisturizer, and daily SPF (non-negotiable with actives).',
  },
  {
    id: 'oily-spf',
    title: 'Top Oily-Skin SPFs',
    subtitle: 'No shine, no white cast',
    tint: '#4B83F0',
    productIds: ['boj-relief-sun', 'lrp-anthelios-clear'],
    blurb: 'Daily broad-spectrum SPF is the highest-evidence step for preventing photoaging and post-acne dark spots. For oily skin the best sunscreen is the one you will actually reapply — lightweight, non-comedogenic, no white cast.',
  },
  {
    id: 'holy-grail-serums',
    title: 'Holy-Grail Serums',
    subtitle: 'What moved the needle',
    tint: '#D7A13A',
    productIds: ['ordinary-niacinamide', 'lrp-vitamin-c', 'krave-barrier'],
    blurb: 'A serum delivers one active at high concentration. These cover the best-evidence concerns without conflicting: niacinamide (oil + barrier), vitamin C (AM antioxidant + brightening), and a barrier-repair serum for when actives push too far.',
  },
  {
    id: 'clean-lips',
    title: 'Clean-Girl Lips',
    subtitle: 'The glazed-lip lineup',
    tint: '#C27C60',
    productIds: ['rhode-peptide-lip', 'summer-fridays-lip', 'nyx-butter-gloss'],
    blurb: 'The glazed-lip formula: hydrating, glossy, your-lips-but-better. Layer a peptide treatment under a tinted balm or gloss for that lit-from-within clean-girl finish that lasts.',
  },
];

export interface LookalikeStat {
  productId: string;
  pctSTier: number; // % of the cohort who rank it S-tier
  cohortLabel: string;
}

export const lookalikeStats: LookalikeStat[] = [
  { productId: 'boj-relief-sun', pctSTier: 78, cohortLabel: 'oily & acne-prone' },
  { productId: 'cerave-foaming-cleanser', pctSTier: 71, cohortLabel: 'oily & acne-prone' },
  { productId: 'ordinary-niacinamide', pctSTier: 64, cohortLabel: 'oily & acne-prone' },
  { productId: 'paulas-choice-bha', pctSTier: 59, cohortLabel: 'oily & acne-prone' },
];
