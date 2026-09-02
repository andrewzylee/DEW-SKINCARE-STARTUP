import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, ChevronRight, FlaskConical, Info } from 'lucide-react';
import { getProduct, type Product } from '../data/mockCatalog';
import { featuredLists } from '../data/social';
import { useStore } from '../state/store';
import { spring } from '../lib/motion';
import { ProductImage } from './ProductImage';

// Full-screen detail for a Featured List: the evidence-based rationale + every product with its
// accurate role in the routine. Renders into #stack-overlay at z-[45] — below the ProductSheet
// (z-50) so tapping a product opens its Skin Match sheet on top and returns here on close.
export function FeaturedListView({
  listId,
  onClose,
  onOpenProduct,
}: {
  listId: string | null;
  onClose: () => void;
  onOpenProduct: (productId: string) => void;
}) {
  const root = typeof document !== 'undefined' ? document.getElementById('stack-overlay') : null;
  const { state } = useStore();
  if (!root) return null;

  const list = listId ? featuredLists.find((l) => l.id === listId) : undefined;

  const owned = new Set<string>();
  state.using.forEach((id) => owned.add(id));
  state.shelf.forEach((it) => owned.add(it.productId));

  const products = list ? list.productIds.map(getProduct).filter((p): p is Product => !!p) : [];
  const total = list ? list.productIds.length : 0;
  const used = list ? list.productIds.filter((id) => owned.has(id)).length : 0;

  return createPortal(
    <AnimatePresence>
      {list && (
        <motion.div
          className="pointer-events-auto absolute inset-0 z-[45] flex flex-col overflow-y-auto no-scrollbar bg-bg pb-12"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={spring}
        >
          {/* Cover */}
          <div
            className="relative px-5 pb-6 pt-6"
            style={{
              backgroundImage: `linear-gradient(160deg, rgb(${list.tint}), rgb(${list.tint} / 0.7))`,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition-transform active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="mt-5 flex -space-x-2.5">
              {products.slice(0, 5).map((p) => (
                <ProductImage
                  key={p.id}
                  id={p.id}
                  brand={p.brand}
                  size="sm"
                  className="h-10 w-10 rounded-full ring-2 ring-white/80"
                />
              ))}
            </div>
            <h1 className="mt-4 text-[26px] font-bold leading-tight text-white">{list.title}</h1>
            <p className="mt-1 text-[14px] font-medium text-white/85">{list.subtitle}</p>
            <div className="mt-3 inline-flex items-center rounded-full bg-white/20 px-3 py-1 backdrop-blur">
              <span className="num text-[12.5px] font-semibold text-white">
                You use {used} of {total}
              </span>
            </div>
          </div>

          {/* Why this works */}
          <div className="px-5 pt-5">
            <div className="rounded-[20px] border border-line bg-surface p-4">
              <div className="flex items-center gap-2 text-accent">
                <Info size={15} />
                <span className="text-[12px] font-bold uppercase tracking-[0.1em]">
                  Why this works
                </span>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-ink">{list.blurb}</p>
            </div>
          </div>

          {/* The lineup */}
          <div className="mt-5 px-5">
            <h2 className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
              The lineup · {total} steps
            </h2>
            <div className="flex flex-col gap-2.5">
              {products.map((p, i) => {
                const role = list.roles[p.id];
                const has = owned.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpenProduct(p.id)}
                    className="flex w-full items-start gap-3 rounded-[18px] bg-surface p-3 text-left shadow-card transition-transform active:scale-[0.99]"
                  >
                    <div className="relative shrink-0">
                      <ProductImage id={p.id} brand={p.brand} name={p.name} size="md" />
                      <span className="num absolute -left-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">
                        {i + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[15px] font-semibold leading-tight">
                          {p.name}
                        </span>
                        {has && (
                          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent-ink">
                            <Check size={10} /> yours
                          </span>
                        )}
                      </div>
                      <div className="num text-[12.5px] text-muted">
                        {p.brand} · ${p.price}
                      </div>
                      {role && (
                        <p className="mt-1.5 text-[13px] leading-snug text-ink/80">{role}</p>
                      )}
                    </div>
                    <ChevronRight size={18} className="mt-0.5 shrink-0 text-muted" />
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-[16px] bg-ink/[0.04] px-3.5 py-3">
              <FlaskConical size={15} className="mt-0.5 shrink-0 text-muted" />
              <p className="text-[12.5px] leading-snug text-muted">
                Educational, not medical advice. Introduce one active at a time and patch-test first.
                Tap any product for your personal Skin Match.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  );
}
