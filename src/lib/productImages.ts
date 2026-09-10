// Drop-in product photos.
//
// To add a real photo for a product, drop an image named after its `id` into
//   src/assets/products/<id>.<jpg|jpeg|png|webp|avif>
// e.g.  src/assets/products/differin-adapalene.jpg
// It is picked up automatically here — no catalog edits needed. (You can also set an
// explicit `image` URL/path on a product in mockCatalog.ts, which takes priority.)
import { getProduct } from '../data/mockCatalog';
import { OBF_IMAGES } from '../data/obfImages.generated';

const files = import.meta.glob('../assets/products/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const byId: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const id = path.split('/').pop()!.replace(/\.[^.]+$/, '');
  byId[id] = url;
}

/**
 * Resolved image URL for a product, or undefined if none provided yet. Priority:
 *   1. explicit `image` on the product (manually curated — always wins)
 *   2. a bundled asset in src/assets/products/<id>.*
 *   3. a manually-verified Open Beauty Facts photo (last resort; see obfImages.generated.ts)
 * Anything with no source falls back to the polished <ProductGlyph> placeholder.
 */
export function productImage(id: string): string | undefined {
  return getProduct(id)?.image ?? byId[id] ?? OBF_IMAGES[id];
}

export function hasProductImage(id: string): boolean {
  return !!productImage(id);
}
