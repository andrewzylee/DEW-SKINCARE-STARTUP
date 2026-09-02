import { motion } from 'framer-motion';
import type { Product } from '../data/mockCatalog';
import { spring } from '../lib/motion';
import { Card } from './Card';
import { CategoryTag } from './CategoryTag';
import { PillButton } from './PillButton';
import { ProductImage } from './ProductImage';

// One side of the pairwise "which did more for your skin?" question (§4). Two of these sit
// side by side in the Shelf compare flow.
export function CompareCard({
  product,
  onChoose,
}: {
  product: Product;
  onChoose: () => void;
}) {
  return (
    <motion.div
      className="flex flex-1"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
    >
      <Card className="flex flex-1 flex-col items-center gap-3 p-4 text-center">
        <ProductImage id={product.id} brand={product.brand} name={product.name} size="lg" />
        <div className="min-h-[64px]">
          <CategoryTag category={product.category} />
          <h3 className="mt-1 text-[17px] font-semibold leading-tight">{product.name}</h3>
          <p className="text-[13px] text-muted">{product.brand}</p>
        </div>
        <p className="text-[13px] leading-snug text-muted">{product.blurb}</p>
        <div className="mt-auto w-full pt-2">
          <PillButton fullWidth size="sm" onClick={onChoose}>
            Did more
          </PillButton>
        </div>
      </Card>
    </motion.div>
  );
}
