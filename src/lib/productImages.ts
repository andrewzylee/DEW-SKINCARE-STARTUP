// Drop-in product photos.
//
// To add a real photo for a product, drop an image named after its `id` into
//   src/assets/products/<id>.<jpg|jpeg|png|webp|avif>
// e.g.  src/assets/products/differin-adapalene.jpg
// It is picked up automatically here — no catalog edits needed. (You can also set an
// explicit `image` URL/path on a product in mockCatalog.ts, which takes priority.)
import { getProduct } from '../data/mockCatalog';

const files = import.meta.glob('../assets/products/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const byId: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const id = path.split('/').pop()!.replace(/\.[^.]+$/, '');
  byId[id] = url;
}

/** Resolved image URL for a product, or undefined if none provided yet. */
export function productImage(id: string): string | undefined {
  return getProduct(id)?.image ?? byId[id];
}

export function hasProductImage(id: string): boolean {
  return !!productImage(id);
}
