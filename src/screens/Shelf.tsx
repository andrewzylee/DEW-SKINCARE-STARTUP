import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, Reorder, useDragControls } from 'framer-motion';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  FlaskConical,
  GripVertical,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  catalog,
  getProduct,
  categoriesForDomain,
  productDomain,
  type Category,
  type Domain,
} from '../data/mockCatalog';
import { useStore } from '../state/store';
import { Stack } from './Stack';
import { useUI } from '../state/ui';
import {
  applyCompare,
  compareTargetIndex,
  insertionIndex,
  isCompareDone,
  reactionRange,
  startCompareInRange,
  tierVar,
  type CompareSession,
  type Reaction,
  type Strength,
  type Tier,
} from '../lib/ranking';
import { cn } from '../lib/cn';
import { PillButton } from '../components/PillButton';
import { TierBadge } from '../components/TierBadge';
import { CompareCard } from '../components/CompareCard';
import { Sheet } from '../components/Sheet';
import { ProductImage } from '../components/ProductImage';
import { CategoryTag, categoryLabel, categoryPlural } from '../components/CategoryTag';
import { SegmentedToggle } from '../components/SegmentedToggle';

interface Flow {
  productId: string;
  domain: Domain;
  phase: 'reaction' | 'compare' | 'done';
  shelf: string[]; // snapshot of same-category shelf ids the product is compared against
  wasRanked: boolean; // re-ranking an existing product vs. adding a new one
  oldRank?: number; // its category rank before re-ranking (for the ↑/↓ result)
  reaction?: Reaction;
  session?: CompareSession;
  landed?: number; // final local index within the category once done
}

const REACTIONS: { key: Reaction; emoji: string; label: string }[] = [
  { key: 'love', emoji: '😍', label: 'Love it' },
  { key: 'like', emoji: '🙂', label: 'Like it' },
  { key: 'fine', emoji: '😐', label: "It's fine" },
  { key: 'dislike', emoji: '🙁', label: "Don't like it" },
  { key: 'never', emoji: '💀', label: 'Never again' },
];

function dayNumber(start: string, today: string): number {
  const [ya, ma, da] = start.split('-').map(Number);
  const [yb, mb, db] = today.split('-').map(Number);
  return Math.max(
    1,
    Math.round((new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime()) / 86400000) + 1,
  );
}

export function Shelf() {
  const {
    rankedShelf,
    insertShelfInCategory,
    reorderCategory,
    removeFromShelf,
    updateShelfNote,
    isOnShelf,
    today,
    activeTrials,
    startTrial,
    trialForProduct,
  } = useStore();
  const { openTrial } = useUI();
  const [domain, setDomain] = useState<Domain>('makeup');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [trialPickerOpen, setTrialPickerOpen] = useState(false);
  const [detailFor, setDetailFor] = useState<string | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [section, setSection] = useState<'products' | 'routines' | 'trials'>('products');

  // Ranking flow: quick reaction (seeds the search range) → pairwise compares → result screen.
  const startRank = (productId: string) => {
    const p = getProduct(productId);
    if (!p) return;
    // Only compare against products in the SAME category — you rank blushes against blushes.
    const sameCat = rankedShelf
      .filter((it) => it.productId !== productId && it.category === p.category)
      .map((it) => it.productId);
    setPickerOpen(false);
    setDetailFor(null);
    setFlow({
      productId,
      domain: productDomain(p),
      phase: 'reaction',
      shelf: sameCat,
      wasRanked: isOnShelf(productId),
      oldRank: rankedShelf.find((it) => it.productId === productId)?.groupRank,
    });
  };

  const onReaction = (reaction: Reaction) => {
    if (!flow) return;
    const { lo, hi } = reactionRange(reaction, flow.shelf.length);
    const session = startCompareInRange(flow.productId, lo, hi);
    if (isCompareDone(session)) {
      setFlow({ ...flow, phase: 'done', reaction, session, landed: insertionIndex(session) });
    } else {
      setFlow({ ...flow, phase: 'compare', reaction, session });
    }
  };

  const answer = (newWins: boolean) => {
    if (!flow || !flow.session) return;
    const session = applyCompare(flow.session, newWins);
    if (isCompareDone(session)) {
      setFlow({ ...flow, phase: 'done', session, landed: insertionIndex(session) });
    } else {
      setFlow({ ...flow, session });
    }
  };

  const finishRank = (reason?: string, strength?: Strength) => {
    if (!flow || flow.landed == null) return;
    insertShelfInCategory(flow.productId, flow.landed, {
      reaction: flow.reaction,
      reason,
      strength,
    });
    setFlow(null);
  };

  const grouped = useMemo(
    () =>
      categoriesForDomain(domain)
        .map((category) => ({
          category,
          items: rankedShelf.filter((it) => it.category === category),
        }))
        .filter((g) => g.items.length > 0),
    [rankedShelf, domain],
  );

  const detailItem = detailFor ? rankedShelf.find((it) => it.productId === detailFor) : null;

  return (
    <div className="pb-8">
      <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-6">
        <div>
          <h1 className="font-display text-[34px] font-semibold leading-none">Shelf</h1>
          <p className="mt-2 text-[15px] text-muted">Everything you've tried, saved and use.</p>
        </div>
      </div>

      <div className="px-5 pb-1">
        <SegmentedToggle<'products' | 'routines' | 'trials'>
          layoutId="shelf-section"
          value={section}
          onChange={setSection}
          options={[
            { value: 'products', label: 'Products' },
            { value: 'routines', label: 'Routines' },
            { value: 'trials', label: 'Trials' },
          ]}
        />
      </div>

      {section === 'routines' && <Stack embedded />}

      {section === 'trials' && (
        <div className="mt-3 px-5">
          <PillButton size="lg" fullWidth onClick={() => setTrialPickerOpen(true)}>
            <FlaskConical size={18} />
            Start a trial
          </PillButton>
          {activeTrials.length === 0 ? (
            <p className="mt-6 text-center text-[13.5px] leading-snug text-muted">
              No active trials yet. Track a product over time to see if it actually works for you.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {activeTrials.map((t) => {
                const p = getProduct(t.productId);
                if (!p) return null;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => openTrial(t.id)}
                    className="flex items-center gap-3 rounded-[18px] bg-surface p-2.5 text-left shadow-card transition-transform active:scale-[0.99]"
                  >
                    <ProductImage id={p.id} brand={p.brand} name={p.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14.5px] font-semibold leading-tight">{p.name}</div>
                      <div className="num text-[12px] text-muted">
                        Day {dayNumber(t.startDate, today)} · {t.checkins.length} check-in
                        {t.checkins.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    <FlaskConical size={15} className="text-accent" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {section === 'products' && (
        <>
          <div className="mt-3 px-5">
            <SegmentedToggle<Domain>
              layoutId="shelf-domain"
              value={domain}
              onChange={setDomain}
              options={[
                { value: 'makeup', label: 'Makeup' },
                { value: 'skincare', label: 'Skincare' },
                { value: 'fragrance', label: 'Fragrance' },
              ]}
            />
          </div>

          {/* Primary CTA — ranking is the whole point of the Shelf */}
          <div className="mt-3 px-5">
            <PillButton size="lg" fullWidth onClick={() => setPickerOpen(true)}>
              <Plus size={18} />
              Rank a product
            </PillButton>
          </div>

          {grouped.length > 0 ? (
            <div className="mt-5 px-5">
          {grouped.map((g) => (
            <div key={g.category} className="mb-5">
              <div className="flex items-baseline justify-between pb-2.5">
                <h2 className="font-display text-[23px] font-semibold text-ink">
                  {categoryLabel(g.category)}
                </h2>
                <span className="num text-[12.5px] font-medium text-muted">
                  {g.items.length} ranked
                </span>
              </div>
              <Reorder.Group
                axis="y"
                values={g.items.map((it) => it.productId)}
                onReorder={(ids) => reorderCategory(g.category, ids)}
                className="flex flex-col gap-2"
              >
                {g.items.map((it) => {
                  const p = getProduct(it.productId);
                  if (!p) return null;
                  return (
                    <ShelfRow
                      key={it.productId}
                      id={it.productId}
                      rank={it.groupRank}
                      size={it.groupSize}
                      tier={it.tier}
                      name={p.name}
                      brand={p.brand}
                      reaction={it.reaction}
                      category={it.category}
                      onOpen={() => setDetailFor(it.productId)}
                    />
                  );
                })}
              </Reorder.Group>
            </div>
          ))}
            </div>
          ) : (
            <EmptyState domain={domain} />
          )}
        </>
      )}

      {/* Pick a product to rank */}
      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Rank a product">
        <ProductPicker onPick={startRank} exclude={isOnShelf} initialDomain={domain} />
      </Sheet>

      {/* Pick a product to trial */}
      <Sheet open={trialPickerOpen} onClose={() => setTrialPickerOpen(false)} title="Start a trial">
        <ProductPicker
          onPick={(id) => {
            const tid = startTrial(id);
            setTrialPickerOpen(false);
            openTrial(tid);
          }}
          exclude={(id) => !!trialForProduct(id)}
          initialDomain={domain}
        />
      </Sheet>

      {/* Row detail: re-rank / note / remove */}
      <Sheet open={!!detailItem} onClose={() => setDetailFor(null)} title="Edit ranking">
        {detailItem && (
          <RowDetail
            productId={detailItem.productId}
            note={detailItem.note ?? ''}
            groupRank={detailItem.groupRank}
            groupSize={detailItem.groupSize}
            tier={detailItem.tier}
            onNote={(n) => updateShelfNote(detailItem.productId, n)}
            onReRank={() => startRank(detailItem.productId)}
            onRemove={() => {
              removeFromShelf(detailItem.productId);
              setDetailFor(null);
            }}
          />
        )}
      </Sheet>

      {/* Ranking flow: reaction → compares → result (full-frame focus) */}
      {flow && (
        <RankFlow
          flow={flow}
          onReaction={onReaction}
          onAnswer={answer}
          onFinish={finishRank}
          onCancel={() => setFlow(null)}
        />
      )}
    </div>
  );
}

const REACTION_VIEW: Record<Reaction, { e: string; l: string }> = {
  love: { e: '😍', l: 'Love' },
  like: { e: '🙂', l: 'Like' },
  fine: { e: '😐', l: 'Fine' },
  dislike: { e: '🙁', l: 'Meh' },
  never: { e: '💀', l: 'Never' },
};

// Rank-first card: the big two-digit position (tier-colored) is the hero, then image, name, brand,
// reaction, and "#n of N blushes".
function ShelfRow({
  id,
  rank,
  size,
  tier,
  name,
  brand,
  reaction,
  category,
  onOpen,
}: {
  id: string;
  rank: number;
  size: number;
  tier: Tier;
  name: string;
  brand: string;
  reaction?: Reaction;
  category: Category;
  onOpen: () => void;
}) {
  const controls = useDragControls();
  const rx = reaction ? REACTION_VIEW[reaction] : null;
  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-2.5 overflow-hidden rounded-[20px] bg-surface p-3 shadow-card"
    >
      <span
        onPointerDown={(e) => controls.start(e)}
        className="shrink-0 cursor-grab touch-none text-muted/50 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </span>
      <span
        className="num w-9 shrink-0 text-center font-display text-[27px] font-semibold leading-none"
        style={{ color: tierVar(tier) }}
      >
        {String(rank).padStart(2, '0')}
      </span>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <ProductImage id={id} brand={brand} name={name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15.5px] font-semibold leading-tight">{name}</div>
          <div className="truncate text-[12.5px] text-muted">{brand}</div>
          {rx && (
            <div className="mt-1 text-[12.5px] text-ink">
              {rx.e} <span className="font-medium">{rx.l}</span>
            </div>
          )}
          <div className="num mt-0.5 text-[11.5px] text-muted">
            #{rank} of {size} {categoryPlural(category)}
          </div>
        </div>
      </button>
    </Reorder.Item>
  );
}

function EmptyState({ domain }: { domain: Domain }) {
  const noun = domain === 'makeup' ? 'makeup' : 'skincare';
  return (
    <div className="px-5 pt-10 text-center">
      <div className="mx-auto flex max-w-[18rem] flex-col items-center">
        <div className="mb-4 flex gap-1.5">
          {(['S', 'A', 'B', 'C', 'F'] as Tier[]).map((t) => (
            <TierBadge key={t} tier={t} size="sm" />
          ))}
        </div>
        <h2 className="text-[19px] font-semibold">Rank your first {noun} products</h2>
        <p className="mt-2 text-[14px] leading-snug text-muted">
          Add something you've used and we'll ask a couple quick head-to-heads to slot it into your
          tier list. It gets sharper with every product.
        </p>
      </div>
    </div>
  );
}

function ProductPicker({
  onPick,
  exclude,
  initialDomain,
}: {
  onPick: (id: string) => void;
  exclude: (id: string) => boolean;
  initialDomain: Domain;
}) {
  const { state } = useStore();
  const [q, setQ] = useState('');
  const [domain, setDomain] = useState<Domain>(initialDomain);
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...catalog, ...state.customProducts]
      .filter((p) => productDomain(p) === domain)
      .filter((p) => !exclude(p.id))
      .filter(
        (p) =>
          !term || p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term),
      );
  }, [q, exclude, domain, state.customProducts]);

  return (
    <div className="pb-2">
      <div className="sticky top-[52px] z-10 -mx-5 bg-surface px-5 pb-2">
        <SegmentedToggle<Domain>
          layoutId="picker-domain"
          value={domain}
          onChange={setDomain}
          options={[
            { value: 'makeup', label: 'Makeup' },
            { value: 'skincare', label: 'Skin' },
            { value: 'fragrance', label: 'Scent' },
          ]}
        />
        <div className="mt-2 flex items-center gap-2 rounded-full border border-line bg-bg px-4">
          <Search size={16} className="text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products you've tried"
            className="w-full bg-transparent py-2.5 text-[15px] outline-none placeholder:text-muted"
          />
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {results.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p.id)}
            className="flex items-center gap-3 rounded-[18px] bg-surface p-2.5 text-left shadow-card transition-transform active:scale-[0.99]"
          >
            <ProductImage id={p.id} brand={p.brand} name={p.name} size="md" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold leading-tight">{p.name}</div>
              <div className="truncate text-[12.5px] text-muted">{p.brand}</div>
            </div>
            <CategoryTag category={p.category} />
          </button>
        ))}
        {results.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">
            Nothing left to add — you've ranked everything matching that.
          </p>
        )}
      </div>
    </div>
  );
}

function RowDetail({
  productId,
  note,
  groupRank,
  groupSize,
  tier,
  onNote,
  onReRank,
  onRemove,
}: {
  productId: string;
  note: string;
  groupRank: number;
  groupSize: number;
  tier: Tier;
  onNote: (n: string) => void;
  onReRank: () => void;
  onRemove: () => void;
}) {
  const p = getProduct(productId);
  if (!p) return null;
  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center gap-3">
        <ProductImage id={p.id} brand={p.brand} name={p.name} size="md" />
        <div className="min-w-0 flex-1">
          <CategoryTag category={p.category} />
          <div className="text-[16px] font-semibold leading-tight">{p.name}</div>
          <div className="text-[13px] text-muted">{p.brand}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <TierBadge tier={tier} />
          <span className="num text-[12px] text-muted">
            #{groupRank} of {groupSize}
          </span>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-medium text-muted">Note</label>
        <input
          defaultValue={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder="e.g. best everyday blush, blends like a dream"
          maxLength={80}
          className="w-full rounded-[16px] border border-line bg-bg px-4 py-3 text-[15px] outline-none placeholder:text-muted focus:border-ink/25"
        />
      </div>

      <div className="flex gap-2">
        <PillButton variant="secondary" fullWidth onClick={onReRank}>
          Re-rank
        </PillButton>
        <PillButton variant="ghost" onClick={onRemove} className="text-tier-f">
          <Trash2 size={16} />
          Remove
        </PillButton>
      </div>
    </div>
  );
}

function RankFlow({
  flow,
  onReaction,
  onAnswer,
  onFinish,
  onCancel,
}: {
  flow: Flow;
  onReaction: (r: Reaction) => void;
  onAnswer: (newWins: boolean) => void;
  onFinish: (reason?: string, strength?: Strength) => void;
  onCancel: () => void;
}) {
  const root = document.getElementById('stack-overlay');
  const [reason, setReason] = useState('');
  const [strength, setStrength] = useState<Strength>('close');
  const p = getProduct(flow.productId);
  if (!root || !p) return null;

  // Makeup & fragrance are preference; skincare is a skin-effect judgment.
  const preference = flow.domain !== 'skincare';
  const catLabel = categoryLabel(p.category);
  const newRank = (flow.landed ?? 0) + 1;
  const total = flow.shelf.length + 1;
  const targetIndex = flow.session ? compareTargetIndex(flow.session) : null;
  const opponent = targetIndex !== null ? getProduct(flow.shelf[targetIndex]) : undefined;
  const dots = flow.session ? Math.max(flow.session.estimate, flow.session.done + 1) : 0;

  return createPortal(
    <motion.div
      className="pointer-events-auto absolute inset-0 z-[60] flex flex-col bg-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ink/5"
          aria-label="Cancel"
        >
          <ArrowLeft size={20} />
        </button>
        {flow.phase === 'compare' && flow.session ? (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: dots }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i < flow.session!.done ? 'w-5 bg-accent' : 'w-1.5 bg-ink/15',
                )}
              />
            ))}
          </div>
        ) : (
          <span className="text-[13px] font-semibold uppercase tracking-[0.16em] text-muted">
            {flow.phase === 'done' ? 'Ranked' : 'Rank'}
          </span>
        )}
        <div className="w-9" />
      </div>

      {/* Reaction — seeds where the search starts */}
      {flow.phase === 'reaction' && (
        <div className="flex flex-1 flex-col justify-center px-5">
          <div className="mb-6 text-center">
            <div className="flex justify-center">
              <ProductImage id={p.id} brand={p.brand} name={p.name} size="xl" />
            </div>
            <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-muted">
              {p.name}
            </p>
            <h1 className="mt-2 font-display text-[31px] font-semibold leading-tight">
              First impression?
            </h1>
            <p className="mt-1 text-[14px] text-muted">
              Sets a starting point — you’ll fine-tune with a couple of quick picks.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            {REACTIONS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => onReaction(r.key)}
                className="flex items-center gap-3 rounded-[20px] border border-line bg-surface px-5 py-3.5 text-left transition-colors active:scale-[0.99] hover:border-ink/20"
              >
                <span className="text-[24px]">{r.emoji}</span>
                <span className="text-[16px] font-semibold">{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pairwise compare */}
      {flow.phase === 'compare' && opponent && (
        <div className="flex flex-1 flex-col justify-center px-5">
          <div className="mb-6 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-muted">
              Ranking {p.name}
            </p>
            <h1 className="mt-2 font-display text-[31px] font-semibold leading-tight">
              {preference ? 'Which one do you like more?' : 'Which did more for your skin?'}
            </h1>
          </div>
          <div className="flex items-stretch gap-3">
            <CompareCard product={p} onChoose={() => onAnswer(true)} />
            <div className="flex items-center">
              <span className="num text-[13px] font-bold text-muted">vs</span>
            </div>
            <CompareCard product={opponent} onChoose={() => onAnswer(false)} />
          </div>
          <p className="mt-6 text-center text-[13px] text-muted">
            {preference ? 'Tap the one you reach for more.' : 'Tap the one that did more.'}
          </p>
        </div>
      )}

      {/* Result — the shareable "#n of N" moment + optional reason */}
      {flow.phase === 'done' && (
        <div className="flex flex-1 flex-col justify-center px-5 text-center">
          <div className="flex justify-center">
            <ProductImage id={p.id} brand={p.brand} name={p.name} size="xl" />
          </div>
          {flow.wasRanked && flow.oldRank && flow.oldRank !== newRank && (
            <div
              className={cn(
                'mx-auto mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-bold',
                newRank < flow.oldRank ? 'bg-accent-soft text-accent-ink' : 'bg-tier-f/10 text-tier-f',
              )}
            >
              {newRank < flow.oldRank ? <ArrowUp size={14} /> : <ArrowDown size={14} />}#{flow.oldRank} → #
              {newRank}
            </div>
          )}
          <h1 className="mt-3 font-display text-[30px] font-semibold leading-tight">
            {p.name} is your #{newRank} {catLabel.toLowerCase()}
          </h1>
          <p className="num mt-1 text-[15px] text-muted">
            #{newRank} of {total} {categoryPlural(p.category)} you’ve tried
          </p>

          {/* Optional "how close?" — refines the gap to the item just above (barely-#2 vs runaway). */}
          {newRank >= 2 && (
            <div className="mt-5">
              <p className="mb-2 text-[13px] font-medium text-muted">How close to your #{newRank - 1}?</p>
              <div className="flex gap-2">
                {(
                  [
                    { k: 'tied', l: 'Basically tied' },
                    { k: 'close', l: 'A bit behind' },
                    { k: 'step', l: 'Well behind' },
                  ] as { k: Strength; l: string }[]
                ).map((o) => (
                  <button
                    key={o.k}
                    type="button"
                    onClick={() => setStrength(o.k)}
                    className={cn(
                      'flex-1 rounded-full border px-2 py-2 text-[12.5px] font-semibold transition-colors',
                      strength === o.k
                        ? 'border-accent bg-accent/[0.06] text-accent-ink'
                        : 'border-line text-muted',
                    )}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={flow.wasRanked ? 'Why did it move? (optional)' : 'Add a note (optional)'}
            maxLength={90}
            className="mt-4 w-full rounded-[16px] border border-line bg-surface px-4 py-3 text-[15px] outline-none placeholder:text-muted focus:border-ink/25"
          />
          <PillButton
            fullWidth
            className="mt-3"
            onClick={() => onFinish(reason, newRank >= 2 ? strength : undefined)}
          >
            Done
          </PillButton>
        </div>
      )}
    </motion.div>,
    root,
  );
}
