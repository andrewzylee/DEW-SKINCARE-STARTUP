import type { Category } from '../data/mockCatalog';

const LABEL: Record<Category, string> = {
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

// Plural form for "#2 of 8 blushes"-style copy.
const PLURAL: Record<Category, string> = {
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
export const categoryPlural = (c: Category) => PLURAL[c];

// Tiny tracked uppercase label — reads technical/sorted, not decorative.
export function CategoryTag({ category }: { category: Category }) {
  return (
    <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted">
      {LABEL[category]}
    </span>
  );
}

export const categoryLabel = (c: Category) => LABEL[c];
