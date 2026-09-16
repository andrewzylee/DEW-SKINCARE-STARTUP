// Shared domain types — ported from the web reference so the ranking/taste logic is identical.
export type Tier = 'S' | 'A' | 'B' | 'C' | 'F';
export type Reaction = 'love' | 'like' | 'fine' | 'dislike' | 'never';
export type Strength = 'tied' | 'close' | 'step';
export type Domain = 'skincare' | 'makeup' | 'fragrance';
export type TimeOfDay = 'am' | 'pm' | 'any';
export type SkinType = 'oily' | 'dry' | 'combination' | 'sensitive';
export type Tone = 'fair' | 'light' | 'medium' | 'tan' | 'deep';
export type Undertone = 'warm' | 'cool' | 'neutral';

export type Category =
  | 'cleanser'
  | 'treatment'
  | 'moisturizer'
  | 'spf'
  | 'serum'
  | 'foundation'
  | 'concealer'
  | 'blush'
  | 'bronzer'
  | 'lip'
  | 'eyeshadow'
  | 'eyeliner'
  | 'mascara'
  | 'brow'
  | 'setting'
  | 'nail'
  | 'fragrance';

export interface Product {
  id: string;
  brand: string;
  name: string;
  category: Category;
  domain?: Domain; // defaults from category via productDomain()
  price?: number;
  image?: string; // remote URL; falls back to the monogram tile
  blurb?: string;
  styleTags?: string[];
  timeOfDay?: TimeOfDay;
}

export interface Person {
  id: string;
  name: string;
  handle: string;
  tint: string; // hex avatar background when there's no photo
  bio?: string;
  location?: string;
  skinType?: SkinType;
  tone?: Tone;
  undertone?: Undertone;
}

export interface FeedActivity {
  id: string;
  personId: string;
  productId: string;
  tier: Tier;
  note?: string;
  standout?: string;
  likes: number;
  timeAgo: string;
  withNames?: string[];
}

export interface RankMove {
  id: string;
  personId: string;
  productId: string;
  fromRank: number | null;
  toRank: number;
  groupSize: number;
  reason?: string;
  timeAgo: string;
}
