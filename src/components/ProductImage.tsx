import { useState } from 'react';
import { cn } from '../lib/cn';
import { productImage } from '../lib/productImages';
import { GLYPH_SIZE, ProductGlyph, type GlyphSize } from './ProductGlyph';

// A product's photo, with a clean monogram fallback until one is provided. Add photos by
// dropping files into src/assets/products/<id>.jpg (see lib/productImages.ts).
export function ProductImage({
  id,
  brand,
  name,
  size = 'md',
  className,
}: {
  id: string;
  brand: string;
  name?: string;
  size?: GlyphSize;
  className?: string;
}) {
  const src = productImage(id);
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return <ProductGlyph brand={brand} size={size} className={className} />;
  }

  return (
    <img
      src={src}
      alt={name ? `${brand} ${name}` : brand}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className={cn('shrink-0 bg-white object-cover ring-1 ring-line', GLYPH_SIZE[size], className)}
    />
  );
}
