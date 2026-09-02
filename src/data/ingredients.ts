// Common cosmetic irritants & contact allergens, framed the way a dermatologist would — with
// INCI synonyms and a short clinical note. Sourced conceptually from ACDS/NACDG core cosmetic
// allergens + frequent barrier irritants. Educational, not medical advice.
export type AvoidCategory =
  | 'Fragrance & botanicals'
  | 'Preservatives'
  | 'Surfactants & solvents'
  | 'Actives (can irritate)';

export interface AvoidIngredient {
  id: string;
  name: string;
  aka?: string; // INCI names / synonyms to look for on a label
  note: string; // brief clinical note
  category: AvoidCategory;
}

export const avoidIngredients: AvoidIngredient[] = [
  // ---- Fragrance & botanicals ----
  {
    id: 'fragrance',
    name: 'Fragrance / Parfum',
    aka: 'Parfum, Aroma',
    note: 'The single most common cause of cosmetic contact allergy.',
    category: 'Fragrance & botanicals',
  },
  {
    id: 'essential-oils',
    name: 'Essential oils',
    aka: 'Limonene, Linalool, Citrus/Lavender oils',
    note: 'Natural does not mean gentle — frequent sensitizers, especially citrus.',
    category: 'Fragrance & botanicals',
  },
  {
    id: 'balsam-peru',
    name: 'Balsam of Peru',
    aka: 'Myroxylon pereirae',
    note: 'A fragrance-marker allergen that cross-reacts with many scented products.',
    category: 'Fragrance & botanicals',
  },
  // ---- Preservatives ----
  {
    id: 'mi-mci',
    name: 'Methylisothiazolinone (MI/MCI)',
    aka: 'Methylchloroisothiazolinone',
    note: 'A leading preservative allergen; watch for it in cleansers and wipes.',
    category: 'Preservatives',
  },
  {
    id: 'formaldehyde',
    name: 'Formaldehyde releasers',
    aka: 'DMDM hydantoin, Quaternium-15, Imidazolidinyl urea',
    note: 'Slowly release formaldehyde — a common, often-missed contact allergen.',
    category: 'Preservatives',
  },
  {
    id: 'parabens',
    name: 'Parabens',
    aka: 'Methyl-/Propylparaben',
    note: 'Low-risk for most, but a common preference for reactive skin.',
    category: 'Preservatives',
  },
  // ---- Surfactants & solvents ----
  {
    id: 'sls',
    name: 'Sodium lauryl sulfate (SLS)',
    aka: 'Sodium laureth sulfate',
    note: 'A harsh surfactant that can strip and disrupt the skin barrier.',
    category: 'Surfactants & solvents',
  },
  {
    id: 'cocamidopropyl',
    name: 'Cocamidopropyl betaine',
    aka: 'CAPB',
    note: 'Coconut-derived surfactant; a notable allergen in cleansers.',
    category: 'Surfactants & solvents',
  },
  {
    id: 'denatured-alcohol',
    name: 'Denatured alcohol',
    aka: 'Alcohol denat., SD alcohol, Ethanol',
    note: 'A drying solvent that can compromise a fragile barrier.',
    category: 'Surfactants & solvents',
  },
  {
    id: 'propylene-glycol',
    name: 'Propylene glycol',
    aka: 'PG',
    note: 'Common humectant/solvent; an occasional irritant and allergen.',
    category: 'Surfactants & solvents',
  },
  {
    id: 'lanolin',
    name: 'Lanolin',
    aka: 'Wool alcohols, Amerchol',
    note: 'A wool-derived emollient that can sensitize compromised skin.',
    category: 'Surfactants & solvents',
  },
  // ---- Actives ----
  {
    id: 'benzoyl-peroxide',
    name: 'Benzoyl peroxide',
    aka: 'BPO',
    note: 'Effective for acne but a frequent irritant — introduce slowly.',
    category: 'Actives (can irritate)',
  },
  {
    id: 'retinoids',
    name: 'Retinoids',
    aka: 'Retinol, Adapalene, Tretinoin',
    note: 'Gold-standard actives, but expect dryness and peeling early on.',
    category: 'Actives (can irritate)',
  },
  {
    id: 'chemical-spf',
    name: 'Chemical UV filters',
    aka: 'Oxybenzone, Avobenzone, Octinoxate',
    note: 'Can sting eyes or sensitize; mineral (zinc/titanium) SPF is an alternative.',
    category: 'Actives (can irritate)',
  },
  {
    id: 'strong-acids',
    name: 'High-strength AHA/BHA',
    aka: 'Glycolic, Lactic, Salicylic acid',
    note: 'Over-exfoliation damages the barrier — limit strength and frequency.',
    category: 'Actives (can irritate)',
  },
];

export const AVOID_CATEGORIES: AvoidCategory[] = [
  'Fragrance & botanicals',
  'Preservatives',
  'Surfactants & solvents',
  'Actives (can irritate)',
];

export const getAvoidIngredient = (id: string) => avoidIngredients.find((i) => i.id === id);
