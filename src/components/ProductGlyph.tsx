import { cn } from '../lib/cn';

// Polished fallback tile shown when a product has no real photo yet (see lib/productImages.ts).
// Every product gets a distinct, on-brand card: a brand monogram over a per-product tinted
// gradient with a soft packaging sheen, plus a tiny category label. Deterministic — the same
// product always renders the same tile. This is the "placeholder layer" real catalog apps ship
// for the products a photo feed doesn't cover.
const STOPWORDS = new Set(['the', 'of', 'and']);

function initials(brand: string): string {
  const words = brand
    .replace(/[^a-zA-Z\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean);
  const meaningful = words.filter((w) => !STOPWORDS.has(w.toLowerCase()));
  const use = meaningful.length ? meaningful : words;
  if (use.length === 1) return use[0].slice(0, 2).toUpperCase();
  return (use[0][0] + use[1][0]).toUpperCase();
}

// Deterministic string hash → stable palette pick per product.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Muted, premium gradient families — kept within Dew's neutral/sage/clay palette (no neon), so a
// wall of these still reads as one cohesive system while every product stays visually distinct.
const PALETTES: { from: string; to: string; ink: string }[] = [
  { from: '#E8EFE9', to: '#D2E1D5', ink: '#566E5E' }, // sage
  { from: '#F5EAE1', to: '#E9D5C7', ink: '#96654F' }, // clay / peach
  { from: '#F1ECE2', to: '#E4D8C6', ink: '#847354' }, // sand
  { from: '#ECEBE8', to: '#DAD8D0', ink: '#6B685F' }, // stone
  { from: '#F0E7E7', to: '#E1D1D1', ink: '#876666' }, // rose
  { from: '#E7EDF1', to: '#D3DFE7', ink: '#5B6D77' }, // muted slate-blue
  { from: '#EDEAF0', to: '#DCD5E4', ink: '#6C6379' }, // muted lilac
];

export const GLYPH_SIZE = {
  sm: 'h-11 w-11 text-[13px] rounded-[14px]',
  md: 'h-14 w-14 text-[15px] rounded-2xl',
  lg: 'h-20 w-20 text-lg rounded-[20px]',
  xl: 'h-28 w-28 text-2xl rounded-[22px]',
} as const;

export type GlyphSize = keyof typeof GLYPH_SIZE;

export function ProductGlyph({
  seed,
  brand,
  category,
  size = 'md',
  className,
}: {
  seed?: string; // stable id used to pick the tint (falls back to brand)
  brand: string;
  category?: string; // human-readable category label, shown at md+ sizes
  size?: GlyphSize;
  className?: string;
}) {
  const pal = PALETTES[hash(seed || brand) % PALETTES.length];
  const showLabel = size !== 'sm' && !!category;

  return (
    <div
      aria-hidden
      className={cn(
        'relative flex shrink-0 flex-col items-center justify-center overflow-hidden ring-1 ring-line',
        GLYPH_SIZE[size],
        className,
      )}
      style={{ backgroundImage: `linear-gradient(145deg, ${pal.from}, ${pal.to})` }}
    >
      {/* soft top-left highlight — reads like a sheen on packaging */}
      <span className="pointer-events-none absolute -left-1/4 -top-1/3 h-2/3 w-2/3 rounded-full bg-white/30 blur-md" />
      <span className="relative font-semibold leading-none tracking-tight" style={{ color: pal.ink }}>
        {initials(brand)}
      </span>
      {showLabel && (
        <span
          className="relative mt-1 max-w-[86%] truncate text-[8px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: pal.ink, opacity: 0.72 }}
        >
          {category}
        </span>
      )}
    </div>
  );
}
