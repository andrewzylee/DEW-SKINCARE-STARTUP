import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, CheckCircle2 } from 'lucide-react';
import { catalog, type Product } from '../data/mockCatalog';
import { useStore } from '../state/store';
import { cn } from '../lib/cn';
import { spring } from '../lib/motion';
import { ProductImage } from './ProductImage';
import { PillButton } from './PillButton';

const EXAMPLE = 'CeraVe Foaming Cleanser\nThe Ordinary Niacinamide\nBeauty of Joseon sunscreen\nPaula’s Choice BHA\nrandom serum from tiktok';

interface Results {
  matched: Product[];
  unmatched: string[];
}

export function ImportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const root = typeof document !== 'undefined' ? document.getElementById('stack-overlay') : null;
  const { insertShelfInCategory, isOnShelf } = useStore();
  const [text, setText] = useState('');
  const [results, setResults] = useState<Results | null>(null);
  const [added, setAdded] = useState<number | null>(null);

  if (!root) return null;

  const reset = () => {
    setText('');
    setResults(null);
    setAdded(null);
  };
  const close = () => {
    onClose();
    // small delay-free reset for next open
    reset();
  };

  const findMatches = () => {
    const terms = text
      .split(/[\n,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const matched: Product[] = [];
    const unmatched: string[] = [];
    const norm = (s: string) => s.toLowerCase().replace(/[’'`]/g, "'").replace(/\s+/g, ' ').trim();
    terms.forEach((term) => {
      const low = norm(term);
      // Pick the best-scoring product (not just the first brand match).
      let best: Product | null = null;
      let bestScore = 0;
      for (const p of catalog) {
        const hay = norm(`${p.brand} ${p.name}`);
        const nm = norm(p.name);
        const br = norm(p.brand);
        let score = 0;
        if (hay.includes(low) || low.includes(hay)) score = 6;
        else if (low.includes(nm)) score = 5;
        else {
          const overlap = nm.split(' ').filter((w) => w.length > 2 && low.includes(w)).length;
          if (br.length > 3 && low.includes(br)) score = 2 + overlap * 2; // brand + matching product words
          else if (overlap >= 2) score = overlap;
        }
        if (score > bestScore) {
          bestScore = score;
          best = p;
        }
      }
      if (best && bestScore >= 2) {
        if (!seen.has(best.id)) {
          seen.add(best.id);
          matched.push(best);
        }
      } else {
        unmatched.push(term);
      }
    });
    setResults({ matched, unmatched });
  };

  const addAll = () => {
    if (!results) return;
    const toAdd = results.matched.filter((p) => !isOnShelf(p.id));
    toAdd.forEach((p) => insertShelfInCategory(p.id, 0));
    setAdded(toAdd.length);
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
              onClick={close}
              className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ink/5"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-[19px] font-bold tracking-tight">Import your routine</h1>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8">
            {added !== null ? (
              <div className="mt-16 flex flex-col items-center text-center">
                <CheckCircle2 size={56} className="text-accent" />
                <div className="mt-4 text-[20px] font-bold">
                  Added <span className="num">{added}</span> to your Shelf
                </div>
                <p className="mt-2 max-w-[18rem] text-[14px] text-muted">
                  They're on your Shelf now — rank them to slot them into your tiers.
                </p>
                <PillButton className="mt-6" onClick={close}>
                  Done
                </PillButton>
              </div>
            ) : !results ? (
              <>
                <p className="mt-2 text-[14px] leading-snug text-muted">
                  Paste the products you already use — one per line, or comma-separated. We'll match
                  them to the catalog.
                </p>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={'e.g.\nCeraVe Foaming Cleanser\nThe Ordinary Niacinamide\nBeauty of Joseon sunscreen'}
                  rows={8}
                  className="mt-3 w-full resize-none rounded-card border border-line bg-surface p-4 text-[15px] leading-relaxed outline-none focus:border-ink/25"
                />
                <button
                  type="button"
                  onClick={() => setText(EXAMPLE)}
                  className="mt-2 text-[13px] font-semibold text-accent"
                >
                  Paste an example
                </button>
                <PillButton fullWidth className="mt-4" disabled={!text.trim()} onClick={findMatches}>
                  Find matches
                </PillButton>
              </>
            ) : (
              <>
                <div className="mt-3 flex items-center justify-between">
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
                    Matched · <span className="num">{results.matched.length}</span>
                  </h2>
                  <button type="button" onClick={reset} className="text-[13px] font-semibold text-accent">
                    Edit list
                  </button>
                </div>

                {results.matched.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">
                    No matches — try full product names (brand + product).
                  </p>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    {results.matched.map((p) => {
                      const owned = isOnShelf(p.id);
                      return (
                        <div key={p.id} className="flex items-center gap-3 rounded-[18px] bg-surface p-2.5 shadow-card">
                          <ProductImage id={p.id} brand={p.brand} name={p.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[15px] font-semibold leading-tight">{p.name}</div>
                            <div className="truncate text-[12.5px] text-muted">{p.brand}</div>
                          </div>
                          <span
                            className={cn(
                              'flex items-center gap-1 text-[12px] font-semibold',
                              owned ? 'text-muted' : 'text-accent',
                            )}
                          >
                            <Check size={14} />
                            {owned ? 'On shelf' : 'New'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {results.unmatched.length > 0 && (
                  <div className="mt-4">
                    <h2 className="mb-1 text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
                      Couldn't match
                    </h2>
                    <p className="text-[13px] leading-snug text-muted">{results.unmatched.join(' · ')}</p>
                  </div>
                )}

                <PillButton
                  fullWidth
                  className="mt-5"
                  disabled={results.matched.every((p) => isOnShelf(p.id))}
                  onClick={addAll}
                >
                  Add to your Shelf
                </PillButton>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  );
}
