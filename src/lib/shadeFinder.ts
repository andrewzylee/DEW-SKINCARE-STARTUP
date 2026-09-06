// Shade Finder — the cross-brand shade translator. You self-submit the shade you already know is a
// match in one brand ("NARS Custard", "Fenty 290W"); we estimate your shade in every other
// foundation/concealer from your tone + undertone so switching brands isn't trial-and-error.
//
// The estimates here are a deterministic MOCK keyed to tone/undertone. A real product needs a
// curated shade-equivalence dataset (Findation-style) that gets sharper as the community submits
// its own matches — that community graph is the actual moat.
import { catalog, type Product, type Tone, type Undertone } from '../data/mockCatalog';

const TONE_INDEX: Record<Tone, number> = { fair: 0, light: 1, medium: 2, tan: 3, deep: 4 };
const DEPTH = ['Fair', 'Light', 'Medium', 'Tan', 'Deep'];
const UT_LETTER: Record<Undertone, string> = { cool: 'C', neutral: 'N', warm: 'W' };

// Foundation + concealer are the shade-critical categories (the ones people get wrong).
export const SHADE_PRODUCTS: Product[] = catalog.filter(
  (p) => p.category === 'foundation' || p.category === 'concealer',
);

// Plausible per-brand shade naming, so the output reads like a real shade code.
type Fmt = (t: number, u: Undertone) => string;
const SCHEME: Record<string, Fmt> = {
  'fenty-eaze-drop': (t, u) => `${[110, 200, 290, 370, 440][t]}${UT_LETTER[u]}`,
  'glossier-skin-tint': (t) => `G${[2, 5, 8, 11, 14][t]}`,
  'ctilbury-flawless-filter': (t) => `${t + 1} ${DEPTH[t]}`,
  'elf-halo-glow': (t) => `${[2, 4, 7, 10, 13][t]} ${DEPTH[t]}`,
  'nars-radiant-concealer': (t) => ['Chantilly', 'Vanilla', 'Custard', 'Cannelle', 'Café'][t],
  'kosas-revealer': (t) => `Tone ${[2, 4, 6, 8, 10][t]}`,
  'maybelline-age-rewind': (t) => ['Fair', 'Light', 'Medium', 'Honey', 'Deep'][t],
};

export function suggestShade(product: Product, tone?: Tone, undertone?: Undertone): string | null {
  if (!tone) return null;
  const t = TONE_INDEX[tone];
  const u = undertone ?? 'neutral';
  const fmt = SCHEME[product.id];
  return fmt ? fmt(t, u) : `${DEPTH[t]}${undertone ? ` · ${undertone}` : ''}`;
}

export interface ShadeRow {
  product: Product;
  shade: string | null; // your recorded shade, or the estimate
  recorded: boolean;
}

export function buildShadeRows(
  saved: { productId: string; shade: string }[] | undefined,
  tone?: Tone,
  undertone?: Undertone,
): ShadeRow[] {
  const byId = new Map((saved ?? []).map((s) => [s.productId, s.shade] as const));
  return SHADE_PRODUCTS.map((product) => {
    const rec = byId.get(product.id);
    return rec != null
      ? { product, shade: rec, recorded: true }
      : { product, shade: suggestShade(product, tone, undertone), recorded: false };
  });
}
