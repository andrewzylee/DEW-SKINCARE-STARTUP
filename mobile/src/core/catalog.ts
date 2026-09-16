// Category helpers + the full catalog (~1,164 products) ported from the web demo. In production
// this comes from Supabase `products`; data access goes through getProduct() so swapping is localized.
import type { Category, Domain, Product } from './types';
import { fullCatalog } from './catalog-full.generated';

const CATEGORY_LABEL: Record<Category, string> = {
  cleanser: 'Cleanser',
  treatment: 'Treatment',
  moisturizer: 'Moisturizer',
  spf: 'SPF',
  serum: 'Serum',
  foundation: 'Foundation',
  concealer: 'Concealer',
  blush: 'Blush',
  bronzer: 'Bronzer',
  lip: 'Lip',
  eyeshadow: 'Eyeshadow',
  eyeliner: 'Eyeliner',
  mascara: 'Mascara',
  brow: 'Brow',
  setting: 'Setting',
  nail: 'Nail',
  fragrance: 'Fragrance',
};

const CATEGORY_PLURAL: Record<Category, string> = {
  cleanser: 'cleansers',
  treatment: 'treatments',
  moisturizer: 'moisturizers',
  spf: 'SPFs',
  serum: 'serums',
  foundation: 'foundations',
  concealer: 'concealers',
  blush: 'blushes',
  bronzer: 'bronzers',
  lip: 'lip products',
  eyeshadow: 'eyeshadows',
  eyeliner: 'eyeliners',
  mascara: 'mascaras',
  brow: 'brow products',
  setting: 'setting products',
  nail: 'nail polishes',
  fragrance: 'fragrances',
};

const MAKEUP_CATEGORIES = new Set<Category>([
  'foundation', 'concealer', 'blush', 'bronzer', 'lip', 'eyeshadow', 'eyeliner', 'mascara', 'brow', 'setting', 'nail',
]);

export const categoryLabel = (c: Category): string => CATEGORY_LABEL[c];
export const categoryPlural = (c: Category): string => CATEGORY_PLURAL[c];
export const categoryDomain = (c: Category): Domain =>
  c === 'fragrance' ? 'fragrance' : MAKEUP_CATEGORIES.has(c) ? 'makeup' : 'skincare';
export const productDomain = (p: Product): Domain => p.domain ?? categoryDomain(p.category);

// Ordered categories per domain (drives the Shelf's grouped sections + Browse filters).
const DOMAIN_CATEGORIES: Record<Domain, Category[]> = {
  skincare: ['cleanser', 'treatment', 'serum', 'moisturizer', 'spf'],
  makeup: ['foundation', 'concealer', 'blush', 'bronzer', 'lip', 'eyeshadow', 'eyeliner', 'mascara', 'brow', 'setting', 'nail'],
  fragrance: ['fragrance'],
};
export const categoriesForDomain = (d: Domain): Category[] => DOMAIN_CATEGORIES[d];

export const catalog: Product[] = fullCatalog;

const byId = new Map(catalog.map((p) => [p.id, p] as const));

// Community "add a product" — registered at runtime so getProduct resolves customs everywhere.
const customRegistry = new Map<string, Product>();
export const registerCustomProduct = (p: Product): void => {
  customRegistry.set(p.id, p);
};
export const getProduct = (id: string): Product | undefined => byId.get(id) ?? customRegistry.get(id);
