import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { AVOID_CATEGORIES, avoidIngredients } from '../data/ingredients';
import { useStore } from '../state/store';
import { cn } from '../lib/cn';
import { spring } from '../lib/motion';

export function IngredientsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const root = typeof document !== 'undefined' ? document.getElementById('stack-overlay') : null;
  const { state, updateAccount } = useStore();
  const avoid = state.account.avoid ?? [];
  if (!root) return null;

  const toggle = (id: string) => {
    const next = avoid.includes(id) ? avoid.filter((x) => x !== id) : [...avoid, id];
    updateAccount({ avoid: next });
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-auto absolute inset-0 z-[80] flex flex-col bg-bg"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={spring}
        >
          <div className="flex items-center gap-3 px-5 pb-1 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ink/5"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-[19px] font-bold tracking-tight">Ingredients to avoid</h1>
          </div>
          <p className="px-5 pb-2 pl-[68px] text-[13px] leading-snug text-muted">
            Flag anything your skin reacts to. Kept on your profile — educational, not medical advice.
          </p>

          <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-24">
            {AVOID_CATEGORIES.map((cat) => (
              <div key={cat} className="mt-4">
                <h2 className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-muted">
                  {cat}
                </h2>
                <div className="overflow-hidden rounded-card bg-surface shadow-card">
                  {avoidIngredients
                    .filter((i) => i.category === cat)
                    .map((ing, idx) => {
                      const on = avoid.includes(ing.id);
                      return (
                        <button
                          key={ing.id}
                          type="button"
                          onClick={() => toggle(ing.id)}
                          className={cn(
                            'flex w-full items-start gap-3 px-4 py-3 text-left active:bg-ink/[0.02]',
                            idx > 0 && 'border-t border-line',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors',
                              on ? 'border-accent bg-accent text-white' : 'border-line text-transparent',
                            )}
                          >
                            <Check size={14} strokeWidth={3} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[15px] font-semibold leading-tight">{ing.name}</div>
                            {ing.aka && (
                              <div className="num mt-0.5 text-[11.5px] leading-tight text-muted">
                                {ing.aka}
                              </div>
                            )}
                            <p className="mt-1 text-[12.5px] leading-snug text-muted">{ing.note}</p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          <div className="safe-b absolute inset-x-0 bottom-0 border-t border-line bg-surface/95 px-5 py-3 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted">
                <span className="num font-semibold text-ink">{avoid.length}</span> flagged
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-accent px-6 py-2.5 text-[14px] font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  );
}
