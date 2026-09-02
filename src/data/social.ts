// DEW — mock social graph for the Feed & Profile (PLACEHOLDER DATA, prototype only).
// Adapts Beli's friend-activity model to beauty: friends rank products (S–F tiers) the same
// way you do on your Shelf, that shows up in your feed, and their skin/shade phenotype powers
// Taste Match (phenotype-gated for skincare) and Shade Match ("people with your skin").
import type { Domain, SkinType, Tone, Undertone } from './mockCatalog';
import type { Tier } from '../lib/ranking';

export interface Person {
  id: string;
  name: string;
  handle: string;
  tint: string; // avatar background tint when there's no photo (rgb triplet)
  bio: string;
  location: string;
  skinType: SkinType; // for phenotype-gated Skincare Match
  tone: Tone; // for Shade Match + "people with your skin"
  undertone: Undertone;
}

// A deliberately co-ed, multi-tone cast (all genders, Gen-Z) so Taste Match and Shade Match
// have real variety to compute against.
export const people: Person[] = [
  { id: 'emily', name: 'Emily Rker', handle: 'emilyskin', tint: '12 143 98', bio: 'oily & acne-prone · glowy minimalist', location: 'Brooklyn, NY', skinType: 'oily', tone: 'light', undertone: 'neutral' },
  { id: 'marcus', name: 'Marcus Vale', handle: 'marcusv', tint: '75 131 240', bio: 'combination skin · SPF + skin tint everyday', location: 'Austin, TX', skinType: 'combination', tone: 'tan', undertone: 'warm' },
  { id: 'devon', name: 'Devon Lee', handle: 'devonglow', tint: '215 161 58', bio: 'budget beauty, big results', location: 'Chicago, IL', skinType: 'oily', tone: 'deep', undertone: 'warm' },
  { id: 'priya', name: 'Priya N', handle: 'priyaderm', tint: '236 106 90', bio: 'sensitive skin · fragrance-free only', location: 'London, UK', skinType: 'sensitive', tone: 'medium', undertone: 'warm' },
  { id: 'theo', name: 'Theo Park', handle: 'theoclears', tint: '23 181 127', bio: 'K-beauty dewy · lashes + lip masks', location: 'Seoul, KR', skinType: 'oily', tone: 'light', undertone: 'cool' },
  { id: 'sam', name: 'Sam Ortiz', handle: 'samo', tint: '138 143 153', bio: 'dry skin · bold glam era', location: 'Denver, CO', skinType: 'dry', tone: 'fair', undertone: 'cool' },
];

export const getPerson = (id: string) => people.find((p) => p.id === id);

// Each friend's ranked shelf across BOTH domains, ordered best → worst overall (per-category
// ranks are derived from order-of-appearance). Hand-authored to fit each persona so profiles and
// Taste Match feel real. Everyone wears makeup + skincare — beauty is co-ed here by design.
export const friendShelves: Record<string, string[]> = {
  emily: [
    'rare-beauty-blush',
    'glossier-skin-tint',
    'rhode-peptide-lip',
    'cerave-foaming-cleanser',
    'boj-relief-sun',
    'maybelline-sky-high',
    'ordinary-niacinamide',
    'saie-dew-blush',
    'glossier-you',
    'phlur-missing-person',
  ],
  marcus: [
    'boj-relief-sun',
    'elf-power-grip',
    'kosas-revealer',
    'summer-fridays-lip',
    'cerave-foaming-cleanser',
    'ilia-limitless-lash',
    'fenty-eaze-drop',
    'chanel-bleu',
    'dior-sauvage',
  ],
  devon: [
    'elf-halo-glow',
    'maybelline-sky-high',
    'nyx-butter-gloss',
    'elf-halo-blush',
    'maybelline-age-rewind',
    'ordinary-niacinamide',
    'panoxyl-bpo-wash',
    'cerave-daily-lotion',
    'ariana-cloud',
    'sol-cheirosa-62',
  ],
  priya: [
    'ilia-limitless-lash',
    'kosas-revealer',
    'rhode-peptide-lip',
    'vanicream-cleanser',
    'lrp-toleriane-moist',
    'saie-dew-blush',
    'cerave-mineral-spf',
    'lelabo-santal33',
    'glossier-you',
  ],
  theo: [
    'laneige-lip-mask',
    'glossier-skin-tint',
    'rhode-pocket-blush',
    'boj-relief-sun',
    'roundlab-birch-sun',
    'paulas-choice-bha',
    'rare-setting-spray',
    'ilia-limitless-lash',
    'replica-fireplace',
    'sol-cheirosa-62',
  ],
  sam: [
    'ctilbury-flawless-filter',
    'ctilbury-pillowtalk',
    'dior-lip-glow',
    'nars-radiant-concealer',
    'benefit-they-real',
    'krave-barrier',
    'cerave-hydrating-cleanser',
    'lancome-lash-idole',
    'tomford-tobacco-vanille',
    'mfk-br540',
    'replica-jazz-club',
  ],
};

export interface FeedActivity {
  id: string;
  personId: string;
  productId: string;
  tier: Tier; // how they ranked it
  note?: string;
  standout?: string; // a highlighted takeaway
  likes: number;
  timeAgo: string;
  withNames?: string[]; // "with Theo, Me"
}

export interface Comment {
  id: string;
  personId: string;
  text: string;
  timeAgo: string;
}

// Seed comment threads for feed posts (mock).
export const seedComments: Record<string, Comment[]> = {
  a1: [
    { id: 'a1c1', personId: 'marcus', text: 'Been eyeing this — does it pill under sunscreen?', timeAgo: '1m' },
    { id: 'a1c2', personId: 'devon', text: 'Same, my T-zone is way less shiny with it.', timeAgo: '5m' },
    { id: 'a1c3', personId: 'priya', text: 'Underrated for the price 👏', timeAgo: '30m' },
  ],
  a2: [
    { id: 'a2c1', personId: 'theo', text: 'Week 3 is the turning point every single time.', timeAgo: '20m' },
    { id: 'a2c2', personId: 'sam', text: 'Did you buffer it with moisturizer or go straight on?', timeAgo: '45m' },
  ],
  a3: [{ id: 'a3c1', personId: 'emily', text: 'Holy-grail SPF, no notes.', timeAgo: '2h' }],
  a4: [{ id: 'a4c1', personId: 'marcus', text: 'For $6 it earns its spot.', timeAgo: '3h' }],
  a5: [
    { id: 'a5c1', personId: 'priya', text: "Careful not to overdo BHA though — 2x a week max for me.", timeAgo: '1d' },
    { id: 'a5c2', personId: 'emily', text: 'This convinced me to finally try it.', timeAgo: '1d' },
  ],
};

export const feed: FeedActivity[] = [
  {
    id: 'a1',
    personId: 'emily',
    productId: 'cerave-foaming-cleanser',
    tier: 'S',
    standout: 'Cut my oil without the tight, squeaky feeling.',
    likes: 2,
    timeAgo: '2 minutes ago',
    withNames: ['Theo', 'Me'],
  },
  {
    id: 'a2',
    personId: 'priya',
    productId: 'differin-adapalene',
    tier: 'S',
    note: 'Slow start, but it cleared my forehead in about 3 weeks.',
    likes: 8,
    timeAgo: '1 hour ago',
  },
  {
    id: 'a3',
    personId: 'marcus',
    productId: 'boj-relief-sun',
    tier: 'A',
    note: 'No white cast, feels like nothing. Wear it daily now.',
    likes: 5,
    timeAgo: '4 hours ago',
  },
  {
    id: 'a4',
    personId: 'devon',
    productId: 'ordinary-niacinamide',
    tier: 'B',
    note: 'Helped the shine a bit — not magic, but for $6 I keep it around.',
    likes: 12,
    timeAgo: '12 hours ago',
  },
  {
    id: 'a5',
    personId: 'theo',
    productId: 'paulas-choice-bha',
    tier: 'S',
    standout: 'Smoothed the bumps on my nose in a week.',
    likes: 21,
    timeAgo: 'Yesterday',
  },
];

// Friends' ranking CHANGES — the feed content only a ranking-native app can produce.
export interface RankMove {
  id: string;
  personId: string;
  productId: string;
  fromRank: number | null; // null = new to their ranking
  toRank: number;
  groupSize: number;
  reason?: string;
  timeAgo: string;
}

export const rankMoves: RankMove[] = [
  { id: 'rm1', personId: 'emily', productId: 'saie-dew-blush', fromRank: 3, toRank: 1, groupSize: 7, reason: 'Finally edged out Rare Beauty after months.', timeAgo: '40m' },
  { id: 'rm2', personId: 'marcus', productId: 'chanel-bleu', fromRank: null, toRank: 1, groupSize: 5, timeAgo: '2h' },
  { id: 'rm3', personId: 'devon', productId: 'nyx-butter-gloss', fromRank: 2, toRank: 6, groupSize: 9, reason: 'Got too sticky in the summer heat.', timeAgo: '6h' },
  { id: 'rm4', personId: 'priya', productId: 'lelabo-santal33', fromRank: null, toRank: 1, groupSize: 4, timeAgo: '1d' },
  { id: 'rm5', personId: 'sam', productId: 'tomford-tobacco-vanille', fromRank: 2, toRank: 1, groupSize: 8, reason: 'My scent of the winter.', timeAgo: '1d' },
  { id: 'rm6', personId: 'theo', productId: 'paulas-choice-bha', fromRank: 4, toRank: 2, groupSize: 6, timeAgo: '2d' },
];

export interface FeaturedList {
  id: string;
  title: string;
  subtitle: string;
  productIds: string[];
  tint: string; // rgb triplet for the cover wash
  blurb: string; // the evidence-based rationale for the list
  roles: Record<string, string>; // productId -> its accurate role in this routine
  domain?: Domain; // gates the list to an interest (undefined = always shown)
}

// Rationales are written to be dermatologically accurate (mechanism-based, evidence-aligned),
// not marketing copy. Educational, not medical advice.
export const featuredLists: FeaturedList[] = [
  {
    id: 'budget-acne',
    title: 'Best Budget Acne Kit',
    subtitle: 'Clear skin under $60',
    productIds: [
      'cerave-foaming-cleanser',
      'differin-adapalene',
      'panoxyl-bpo-wash',
      'cerave-oil-control',
      'lrp-anthelios-clear',
    ],
    tint: '12 143 98',
    blurb:
      'Acne has four drivers at once: clogged pores, C. acnes bacteria, excess oil, and inflammation. This kit targets all four for under $60 — a gentle cleanser, an OTC retinoid to keep pores clear, benzoyl peroxide to cut bacteria, a light moisturizer to protect the barrier, and daily SPF (non-negotiable — retinoids and BPO raise sun sensitivity).',
    roles: {
      'cerave-foaming-cleanser': 'Cleanse — lifts oil without stripping the barrier.',
      'differin-adapalene':
        'Retinoid — the OTC gold standard; normalizes skin-cell turnover to prevent new clogs. Give it 8–12 weeks.',
      'panoxyl-bpo-wash':
        'Antibacterial — benzoyl peroxide lowers C. acnes; start 2–3×/week to limit dryness.',
      'cerave-oil-control':
        'Moisturize — ceramides + niacinamide keep the barrier intact so actives are tolerated.',
      'lrp-anthelios-clear': 'Protect — SPF prevents UV damage and post-acne dark marks.',
    },
  },
  {
    id: 'oily-spf',
    title: 'Top Oily-Skin SPFs',
    subtitle: 'No shine, no white cast',
    productIds: ['boj-relief-sun', 'lrp-anthelios-clear', 'eltamd-uv-clear', 'supergoop-unseen'],
    tint: '75 131 240',
    blurb:
      'Daily broad-spectrum sunscreen is the highest-evidence step for preventing photoaging and post-acne dark spots. For oily, acne-prone skin the best SPF is the one you will actually reapply — lightweight, non-comedogenic, no white cast. All four are broad-spectrum SPF 40+ with cosmetically elegant finishes.',
    roles: {
      'boj-relief-sun': 'Chemical filter; dewy-but-light finish — the cult daily pick.',
      'lrp-anthelios-clear': 'Oil-free and built for breakout-prone skin; soft matte finish.',
      'eltamd-uv-clear':
        'Derm-favorite; niacinamide + transparent zinc, excellent worn over actives.',
      'supergoop-unseen': 'Invisible gel; doubles as a smoothing makeup base.',
    },
  },
  {
    id: 'holy-grail-serums',
    title: 'Holy-Grail Serums',
    subtitle: 'What actually moved the needle',
    productIds: [
      'ordinary-niacinamide',
      'lrp-vitamin-c',
      'good-molecules-tranexamic',
      'ordinary-hyaluronic',
    ],
    tint: '215 161 58',
    blurb:
      'A serum delivers a high concentration of one active. These four cover the best-evidence concerns without conflicting: niacinamide (oil + barrier), vitamin C (AM antioxidant + brightening), tranexamic acid (post-acne marks), and hyaluronic acid (lightweight hydration).',
    roles: {
      'ordinary-niacinamide':
        'Niacinamide — regulates oil, supports the barrier, softens the look of pores.',
      'lrp-vitamin-c': 'Vitamin C — an AM antioxidant that fades dullness and dark spots over time.',
      'good-molecules-tranexamic':
        'Tranexamic acid — targets stubborn post-acne pigmentation and uneven tone.',
      'ordinary-hyaluronic': 'Hyaluronic acid — humectant hydration; apply to damp skin.',
    },
  },
  {
    id: 'beginner-set',
    title: 'Beginner Starter Set',
    subtitle: 'Three steps, zero guesswork',
    productIds: ['cerave-hydrating-cleanser', 'cerave-daily-lotion', 'boj-relief-sun'],
    tint: '23 181 127',
    blurb:
      'The minimum effective routine is three steps — cleanse, moisturize, protect. Nail consistency here for a few weeks before adding any active; more products is not better skin.',
    roles: {
      'cerave-hydrating-cleanser': 'Cleanse — non-foaming; leaves skin comfortable, not tight.',
      'cerave-daily-lotion': 'Moisturize — lightweight, oil-free; layers cleanly under SPF.',
      'boj-relief-sun': 'Protect — the single daily habit that does the most for your skin.',
    },
  },
  {
    id: 'fragrance-starter',
    title: 'Starter Fragrance Wardrobe',
    subtitle: 'Five scents, every occasion',
    productIds: [
      'chanel-bleu',
      'glossier-you',
      'replica-fireplace',
      'mfk-br540',
      'sol-cheirosa-62',
    ],
    tint: '215 161 58',
    domain: 'fragrance',
    blurb:
      'A wardrobe beats a signature: cover the bases by scent family and occasion rather than chasing one “perfect” bottle. One clean daily driver, one skin-scent for close-up, one cozy for cold weather, one bold statement, one fun everyday. Fragrance is deeply personal — always test on skin (not paper) and give it 30 minutes to dry down before you judge it.',
    roles: {
      'chanel-bleu': 'Daily driver — woody-aromatic, works literally anywhere.',
      'glossier-you': 'Skin scent — clean musk for close-up, everyday wear.',
      'replica-fireplace': 'Cold-weather cozy — smoky, gourmand warmth.',
      'mfk-br540': 'Statement — the bold amber for a night out.',
      'sol-cheirosa-62': 'Fun & cheap — the crowd-pleasing gourmand mist.',
    },
  },
];
