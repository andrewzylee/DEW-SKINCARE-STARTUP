import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, Plus, RotateCcw, Settings2, Shuffle, Trash2 } from 'lucide-react';
import { catalog, getProduct, productDomain, type Product, type SkinType } from '../data/mockCatalog';
import { useStore } from '../state/store';
import { cn } from '../lib/cn';
import { listContainer, listItem, spring } from '../lib/motion';
import { Chip } from '../components/Chip';
import { SegmentedToggle } from '../components/SegmentedToggle';
import { CategoryTag } from '../components/CategoryTag';
import { ProductImage } from '../components/ProductImage';
import { PillButton } from '../components/PillButton';
import { Sheet } from '../components/Sheet';

const SKIN_LABEL: Record<string, string> = {
  oily: 'Oily',
  combination: 'Combination',
  dry: 'Dry',
  sensitive: 'Sensitive',
};

export function Stack({ embedded = false }: { embedded?: boolean }) {
  const { state, streak, isUsing, toggleUsing, swapProduct, addToRoutine, removeFromRoutine, resetAll } =
    useStore();
  const [period, setPeriod] = useState<'am' | 'pm'>('am');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [swapFor, setSwapFor] = useState<Product | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const periodLabel = period === 'am' ? 'morning' : 'night';

  const profile = state.profile;
  const stack = state.stack;
  const ids = stack ? stack[period] : [];
  const products = ids.map(getProduct).filter(Boolean) as Product[];

  if (!profile || !stack) return null;

  return (
    <div className="pb-8">
      {/* Header (the big title is hidden when embedded inside the Shelf's Routines tab) */}
      <div className={cn('flex items-start justify-between gap-3 px-5', embedded ? 'pt-3' : 'pb-1 pt-6')}>
        {embedded ? (
          <div />
        ) : (
          <div className="min-w-0">
            <h1 className="font-display text-[34px] font-semibold leading-none">Your Routine</h1>
            <div className="mt-3 flex items-center gap-2">
              <Chip>{SKIN_LABEL[profile.skinType]} skin</Chip>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.5 text-[13px] shadow-card">
                <span className="num font-semibold text-ink">{streak}</span>
                <span className="text-muted">day{streak === 1 ? '' : 's'}</span>
                <span aria-hidden="true">🔥</span>
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink"
          aria-label="Settings"
        >
          <Settings2 size={19} />
        </button>
      </div>

      <div className="px-5 pt-4">
        <SegmentedToggle<'am' | 'pm'>
          layoutId="stack-period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'am', label: 'Morning' },
            { value: 'pm', label: 'Night' },
          ]}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          variants={listContainer}
          initial="initial"
          animate="animate"
          exit={{ opacity: 0 }}
          className="mt-4 flex flex-col gap-3 px-5"
        >
          {products.map((p, i) => {
            const using = isUsing(p.id);
            return (
              <motion.div
                key={p.id}
                variants={listItem}
                transition={spring}
                className={cn(
                  'rounded-card bg-surface p-4 shadow-card transition-opacity',
                  !using && 'opacity-55',
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div className="relative shrink-0">
                    <ProductImage id={p.id} brand={p.brand} name={p.name} size="lg" />
                    <span className="num absolute -left-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-accent text-[12px] font-bold text-white ring-2 ring-surface">
                      {i + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <CategoryTag category={p.category} />
                    <h3 className="mt-0.5 text-[15.5px] font-semibold leading-tight">{p.name}</h3>
                    <p className="text-[13px] text-muted">{p.brand}</p>
                    <p className="mt-1.5 text-[13px] leading-snug text-muted">{p.blurb}</p>
                  </div>
                  <span className="num shrink-0 text-[15px] font-semibold">${p.price}</span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
                  <UsingSwitch on={using} onToggle={() => toggleUsing(p.id)} />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSwapFor(p)}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium text-muted hover:bg-ink/[0.04] hover:text-ink"
                    >
                      <Shuffle size={14} />
                      Swap
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromRoutine(period, p.id)}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium text-muted hover:bg-tier-f/10 hover:text-tier-f"
                      aria-label={`Remove ${p.name} from ${periodLabel} routine`}
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          <motion.button
            variants={listItem}
            transition={spring}
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center justify-center gap-2 rounded-card border border-dashed border-line bg-surface/60 py-3.5 text-[14px] font-semibold text-muted transition-colors hover:border-accent hover:text-accent active:scale-[0.99]"
          >
            <Plus size={17} />
            Add a product to {periodLabel}
          </motion.button>

          {stack.notes.length > 0 && (
            <motion.div variants={listItem} transition={spring} className="mt-1 flex flex-col gap-2">
              {stack.notes.map((note, i) => (
                <div key={i} className="flex gap-2.5 rounded-[18px] bg-accent-soft px-4 py-3">
                  <Info size={15} className="mt-0.5 shrink-0 text-accent-ink" />
                  <p className="text-[12.5px] leading-snug text-accent-ink">{note}</p>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Swap sheet */}
      <Sheet
        open={!!swapFor}
        onClose={() => setSwapFor(null)}
        title={swapFor ? `Swap ${swapFor.category}` : 'Swap'}
      >
        {swapFor && (
          <SwapList
            target={swapFor}
            skinType={profile.skinType}
            onSwap={(alt) => {
              swapProduct(swapFor.id, alt.id);
              setSwapFor(null);
            }}
          />
        )}
      </Sheet>

      {/* Add-product sheet */}
      <Sheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={`Add to ${periodLabel}`}
      >
        <AddList
          period={period}
          skinType={profile.skinType}
          existingIds={ids}
          onAdd={(p) => {
            addToRoutine(period, p.id);
            setAddOpen(false);
          }}
        />
      </Sheet>

      {/* Settings sheet */}
      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Profile">
        <SettingsPanel onReset={resetAll} />
      </Sheet>
    </div>
  );
}

function UsingSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2"
      aria-pressed={on}
    >
      <span
        className={cn(
          'relative h-6 w-10 rounded-full transition-colors',
          on ? 'bg-accent' : 'bg-ink/15',
        )}
      >
        <motion.span
          layout
          transition={spring}
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
          style={{ left: on ? 18 : 2 }}
        />
      </span>
      <span className={cn('text-[13px] font-medium', on ? 'text-ink' : 'text-muted')}>
        {on ? 'Using' : 'Not using'}
      </span>
    </button>
  );
}

function SwapList({
  target,
  skinType,
  onSwap,
}: {
  target: Product;
  skinType: SkinType;
  onSwap: (p: Product) => void;
}) {
  const alternates = useMemo(() => {
    const rank = (p: Product) => Math.abs(p.price - target.price);
    return catalog
      .filter(
        (p) =>
          p.category === target.category &&
          p.id !== target.id &&
          p.skinTypes.includes(skinType),
      )
      .sort((a, b) => rank(a) - rank(b));
  }, [target, skinType]);

  return (
    <div className="flex flex-col gap-2 pb-2">
      <p className="pb-1 text-[13px] text-muted">
        Alternates for {skinType} skin, closest in price first.
      </p>
      {alternates.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSwap(p)}
          className="flex items-center gap-3 rounded-[18px] bg-surface p-2.5 text-left shadow-card transition-transform active:scale-[0.99]"
        >
          <ProductImage id={p.id} brand={p.brand} name={p.name} size="md" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold leading-tight">{p.name}</div>
            <div className="truncate text-[13px] text-muted">{p.brand}</div>
          </div>
          <span className="num text-[14px] font-semibold">${p.price}</span>
        </button>
      ))}
      {alternates.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">No alternates in this category.</p>
      )}
    </div>
  );
}

function AddList({
  period,
  skinType,
  existingIds,
  onAdd,
}: {
  period: 'am' | 'pm';
  skinType: SkinType;
  existingIds: string[];
  onAdd: (p: Product) => void;
}) {
  const [q, setQ] = useState('');
  const options = useMemo(() => {
    const query = q.trim().toLowerCase();
    return catalog
      .filter((p) => productDomain(p) === 'skincare' && !existingIds.includes(p.id))
      .filter(
        (p) =>
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query),
      )
      .sort((a, b) => {
        // Products suited to your skin type first, then group by category, then cheapest.
        const aFit = a.skinTypes.includes(skinType) ? 0 : 1;
        const bFit = b.skinTypes.includes(skinType) ? 0 : 1;
        if (aFit !== bFit) return aFit - bFit;
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.price - b.price;
      });
  }, [q, existingIds, skinType]);

  return (
    <div className="flex flex-col gap-2 pb-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products, brands, categories"
        className="w-full rounded-[14px] border border-line bg-bg px-4 py-3 text-[15px] outline-none focus:border-ink/25"
      />
      <p className="px-0.5 pb-1 text-[12.5px] text-muted">
        Picks for your {SKIN_LABEL[skinType]?.toLowerCase() ?? skinType} skin come first — it lands in
        your {period === 'am' ? 'morning' : 'night'} routine.
      </p>
      {options.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onAdd(p)}
          className="flex items-center gap-3 rounded-[18px] bg-surface p-2.5 text-left shadow-card transition-transform active:scale-[0.99]"
        >
          <ProductImage id={p.id} brand={p.brand} name={p.name} size="md" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-semibold leading-tight">{p.name}</div>
            <div className="truncate text-[13px] text-muted">{p.brand}</div>
            <div className="mt-1">
              <CategoryTag category={p.category} />
            </div>
          </div>
          <span className="num shrink-0 text-[14px] font-semibold">${p.price}</span>
        </button>
      ))}
      {options.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">
          {q ? 'No products match your search.' : "Everything's already in this routine."}
        </p>
      )}
    </div>
  );
}

function SettingsPanel({ onReset }: { onReset: () => void }) {
  const { state, streak, rankedShelf } = useStore();
  const profile = state.profile!;
  const daysLogged = Object.values(state.logs).filter(
    (e) => e.skinRating !== null && e.skinRating !== undefined,
  ).length;

  const stats: { label: string; value: string | number }[] = [
    { label: 'Streak', value: `${streak}d` },
    { label: 'Days logged', value: daysLogged },
    { label: 'Ranked', value: rankedShelf.length },
  ];

  const rows: [string, string][] = [
    ['Skin type', SKIN_LABEL[profile.skinType]],
    ['Goal', profile.goal],
    ['Budget', profile.budget],
  ];

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-bg px-3 py-3 text-center">
            <div className="num text-xl font-bold">{s.value}</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wide text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-line">
        {rows.map(([k, v], i) => (
          <div
            key={k}
            className={cn(
              'flex items-center justify-between px-4 py-3',
              i > 0 && 'border-t border-line',
            )}
          >
            <span className="text-sm text-muted">{k}</span>
            <span className="text-sm font-medium capitalize">{v}</span>
          </div>
        ))}
      </div>

      <PillButton variant="secondary" fullWidth onClick={onReset}>
        <RotateCcw size={16} />
        Start over
      </PillButton>
      <p className="text-center text-[12px] text-muted">
        Placeholder catalog &amp; mock data — prototype only.
      </p>
    </div>
  );
}
