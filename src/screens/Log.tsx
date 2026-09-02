import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { getProduct, type Product } from '../data/mockCatalog';
import { useStore } from '../state/store';
import { cn } from '../lib/cn';
import type { TabKey } from '../components/TabBar';
import { StreakRing } from '../components/StreakRing';
import { SkinRating } from '../components/SkinRating';
import { ProductImage } from '../components/ProductImage';
import { PillButton } from '../components/PillButton';

export function Log({ go }: { go: (t: TabKey) => void }) {
  const {
    state,
    today,
    streak,
    todayLog,
    toggleUsedToday,
    setUsedToday,
    setSkinRating,
    setTodayNote,
    isUsing,
  } = useStore();
  const [celebrate, setCelebrate] = useState(false);
  const celebrateTimer = useRef<number | null>(null);

  const stack = state.stack;

  const dateLabel = useMemo(() => {
    const [y, m, d] = today.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, [today]);

  if (!stack) return null;

  const amProducts = stack.am.map(getProduct).filter((p): p is Product => !!p && isUsing(p.id));
  const pmProducts = stack.pm.map(getProduct).filter((p): p is Product => !!p && isUsing(p.id));
  const rating = todayLog?.skinRating ?? null;

  const onRate = (v: number) => {
    const wasRated = rating !== null;
    setSkinRating(v);
    if (!wasRated) {
      setCelebrate(true);
      if (celebrateTimer.current) window.clearTimeout(celebrateTimer.current);
      celebrateTimer.current = window.setTimeout(() => setCelebrate(false), 700);
    }
  };

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-6">
        <div>
          <h1 className="text-[28px] font-bold leading-none tracking-tight">Today</h1>
          <p className="mt-2 text-[15px] text-muted">{dateLabel}</p>
        </div>
        <StreakRing count={streak} celebrate={celebrate} />
      </div>

      {/* Skin today */}
      <div className="px-5 pt-3">
        <div className="rounded-card bg-surface p-5 shadow-card">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[17px] font-semibold">How's your skin today?</h2>
          </div>
          <SkinRating value={rating} onChange={onRate} />
        </div>
      </div>

      {/* Checklists */}
      <div className="mt-3 flex flex-col gap-3 px-5">
        <Checklist
          title="Morning"
          products={amProducts}
          used={todayLog?.usedAM ?? []}
          onToggle={(id) => toggleUsedToday('am', id)}
          onMarkAll={(v) => setUsedToday('am', v ? amProducts.map((p) => p.id) : [])}
        />
        <Checklist
          title="Night"
          products={pmProducts}
          used={todayLog?.usedPM ?? []}
          onToggle={(id) => toggleUsedToday('pm', id)}
          onMarkAll={(v) => setUsedToday('pm', v ? pmProducts.map((p) => p.id) : [])}
        />

        {amProducts.length === 0 && pmProducts.length === 0 && (
          <div className="rounded-card bg-surface p-5 text-center shadow-card">
            <p className="text-sm text-muted">
              Nothing marked as “using” yet. Turn products on in your Routine to log them here.
            </p>
            <div className="mt-3">
              <PillButton size="sm" variant="secondary" onClick={() => go('stack')}>
                Go to Routine
              </PillButton>
            </div>
          </div>
        )}
      </div>

      {/* Note */}
      <div className="px-5 pt-3">
        <input
          value={todayLog?.note ?? ''}
          onChange={(e) => setTodayNote(e.target.value)}
          placeholder="Add a note (optional)"
          maxLength={140}
          className="w-full rounded-[20px] border border-line bg-surface px-4 py-3.5 text-[15px] outline-none placeholder:text-muted focus:border-ink/25"
        />
      </div>
    </div>
  );
}

function Checklist({
  title,
  products,
  used,
  onToggle,
  onMarkAll,
}: {
  title: string;
  products: Product[];
  used: string[];
  onToggle: (id: string) => void;
  onMarkAll: (value: boolean) => void;
}) {
  if (products.length === 0) return null;
  const doneCount = products.filter((p) => used.includes(p.id)).length;
  const allDone = doneCount === products.length;

  return (
    <div className="rounded-card bg-surface p-4 shadow-card">
      <div className="mb-1.5 flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
            {title}
          </h2>
          <span className={cn('num text-[13px] font-semibold', allDone ? 'text-accent' : 'text-muted')}>
            {doneCount}/{products.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onMarkAll(!allDone)}
          className="rounded-full px-2.5 py-1 text-[12.5px] font-medium text-accent-ink transition-colors hover:bg-accent-soft"
        >
          {allDone ? 'Clear' : 'Mark all'}
        </button>
      </div>
      <div className="flex flex-col">
        {products.map((p) => {
          const isUsed = used.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              className="flex items-center gap-3 border-t border-line py-2.5 text-left first:border-t-0"
            >
              <ProductImage id={p.id} brand={p.brand} name={p.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    'truncate text-[15px] font-medium leading-tight transition-colors',
                    isUsed && 'text-muted',
                  )}
                >
                  {p.name}
                </div>
                <div className="truncate text-[12.5px] text-muted">{p.brand}</div>
              </div>
              <motion.span
                whileTap={{ scale: 0.82 }}
                className={cn(
                  'grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors',
                  isUsed ? 'border-accent bg-accent text-white' : 'border-line text-transparent',
                )}
              >
                <Check size={16} strokeWidth={3} />
              </motion.span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
