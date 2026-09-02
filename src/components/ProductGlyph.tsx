import { cn } from '../lib/cn';

// Fallback tile shown until a real product photo is added (see lib/productImages.ts):
// a clean brand monogram in mono on a faint emerald tint. Sizes match <ProductImage>.
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

export const GLYPH_SIZE = {
  sm: 'h-11 w-11 text-[13px] rounded-[14px]',
  md: 'h-14 w-14 text-[15px] rounded-2xl',
  lg: 'h-20 w-20 text-lg rounded-[20px]',
  xl: 'h-28 w-28 text-2xl rounded-[22px]',
} as const;

export type GlyphSize = keyof typeof GLYPH_SIZE;

export function ProductGlyph({
  brand,
  size = 'md',
  className,
}: {
  brand: string;
  size?: GlyphSize;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'num flex shrink-0 items-center justify-center bg-accent-soft font-semibold tracking-tight text-accent-ink ring-1 ring-line',
        GLYPH_SIZE[size],
        className,
      )}
    >
      {initials(brand)}
    </div>
  );
}
