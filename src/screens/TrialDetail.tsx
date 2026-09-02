import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowUp, Check, FlaskConical, Minus, Trash2 } from 'lucide-react';
import { getProduct } from '../data/mockCatalog';
import { useStore, type Trial, type TrialCheckin } from '../state/store';
import { skinMatch } from '../lib/skinMatch';
import { cn } from '../lib/cn';
import { spring } from '../lib/motion';
import { ProductImage } from '../components/ProductImage';
import { PillButton } from '../components/PillButton';

const DIMS: { key: keyof Pick<TrialCheckin, 'texture' | 'breakouts' | 'dryness' | 'redness'>; label: string }[] = [
  { key: 'texture', label: 'Texture' },
  { key: 'breakouts', label: 'Breakouts' },
  { key: 'dryness', label: 'Dryness' },
  { key: 'redness', label: 'Redness' },
];

function daysBetween(a: string, b: string): number {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  return Math.round(
    (new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime()) / 86400000,
  );
}
const shortDate = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function TrialDetail({ trialId, onClose }: { trialId: string | null; onClose: () => void }) {
  const root = typeof document !== 'undefined' ? document.getElementById('stack-overlay') : null;
  const { state, today, addTrialCheckin, completeTrial, abandonTrial } = useStore();
  const [mode, setMode] = useState<'view' | 'checkin' | 'verdict'>('view');

  useEffect(() => {
    setMode('view');
  }, [trialId]);

  if (!root) return null;
  const trial = trialId ? state.trials.find((t) => t.id === trialId) : undefined;
  const product = trial ? getProduct(trial.productId) : undefined;

  return createPortal(
    <AnimatePresence>
      {trial && product && (
        <motion.div
          className="pointer-events-auto absolute inset-0 z-[60] flex flex-col bg-bg"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={spring}
        >
          <div className="flex items-center justify-between px-5 pb-2 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ink/5"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-[18px] font-bold tracking-tight">Trial</h1>
            <button
              type="button"
              onClick={() => {
                abandonTrial(trial.id);
                onClose();
              }}
              className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ink/5"
              aria-label="Abandon trial"
            >
              <Trash2 size={17} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8">
            <Header trial={trial} product={product} profile={state.profile} today={today} />

            {mode === 'view' && (
              <>
                <Timeline trial={trial} />
                <div className="mt-5 flex flex-col gap-2">
                  <PillButton fullWidth onClick={() => setMode('checkin')}>
                    Log this week's progress
                  </PillButton>
                  <PillButton variant="secondary" fullWidth onClick={() => setMode('verdict')}>
                    Finish &amp; give a verdict
                  </PillButton>
                </div>
              </>
            )}

            {mode === 'checkin' && (
              <CheckinForm
                today={today}
                onCancel={() => setMode('view')}
                onSave={(c) => {
                  addTrialCheckin(trial.id, c);
                  setMode('view');
                }}
              />
            )}

            {mode === 'verdict' && (
              <VerdictForm
                onCancel={() => setMode('view')}
                onComplete={(v) => {
                  completeTrial(trial.id, v);
                  onClose();
                }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  );
}

function Header({
  trial,
  product,
  profile,
  today,
}: {
  trial: Trial;
  product: NonNullable<ReturnType<typeof getProduct>>;
  profile: Parameters<typeof skinMatch>[0];
  today: string;
}) {
  const dayN = Math.max(1, daysBetween(trial.startDate, today) + 1);
  const pct = Math.min(100, Math.round((dayN / trial.targetDays) * 100));
  const match = skinMatch(profile, product);
  return (
    <div className="rounded-card bg-surface p-4 shadow-card">
      <div className="flex items-center gap-3">
        <ProductImage id={product.id} brand={product.brand} name={product.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-semibold leading-tight">{product.name}</div>
          <div className="text-[13px] text-muted">{product.brand}</div>
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-semibold text-accent-ink">
            <FlaskConical size={12} /> Match {match.score}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
          <span className="font-semibold">
            Day <span className="num">{dayN}</span>
          </span>
          <span className="num text-muted">of {trial.targetDays}-day trial</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={spring}
          />
        </div>
      </div>
    </div>
  );
}

const ARROW = { '-1': ArrowDown, '0': Minus, '1': ArrowUp } as const;
const DIM_COLOR = (v: number) =>
  v > 0 ? 'text-accent' : v < 0 ? 'text-tier-f' : 'text-muted';

function Timeline({ trial }: { trial: Trial }) {
  const entries = [...trial.checkins].reverse();
  return (
    <div className="mt-4">
      <div className="mb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-muted">Progress</div>
      {entries.length === 0 ? (
        <div className="rounded-card border border-line p-5 text-center text-[13px] text-muted">
          No check-ins yet. Log how your skin's doing every few days to build the picture.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((c) => (
            <div key={c.date} className="rounded-[18px] bg-surface p-3.5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="num text-[13px] font-semibold">{shortDate(c.date)}</span>
                <div className="flex items-center gap-3">
                  {DIMS.map((d) => {
                    const v = c[d.key];
                    const Icon = ARROW[String(v) as '-1' | '0' | '1'];
                    return (
                      <span key={d.key} className={cn('flex items-center gap-0.5 text-[11.5px]', DIM_COLOR(v))}>
                        {d.label.slice(0, 4)}
                        <Icon size={13} />
                      </span>
                    );
                  })}
                </div>
              </div>
              {c.note && <p className="mt-1.5 text-[13px] text-muted">{c.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DimPicker({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const opts = [
    { v: -1, l: 'Worse', Icon: ArrowDown },
    { v: 0, l: 'Same', Icon: Minus },
    { v: 1, l: 'Better', Icon: ArrowUp },
  ];
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-medium">{label}</div>
      <div className="flex gap-2">
        {opts.map((o) => {
          const on = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1 rounded-xl border py-2 text-[13px] font-medium transition-colors',
                on && o.v > 0 && 'border-accent bg-accent-soft text-accent-ink',
                on && o.v < 0 && 'border-tier-f bg-tier-f/10 text-tier-f',
                on && o.v === 0 && 'border-ink/25 bg-ink/[0.04] text-ink',
                !on && 'border-line text-muted',
              )}
            >
              <o.Icon size={14} /> {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckinForm({
  today,
  onSave,
  onCancel,
}: {
  today: string;
  onSave: (c: TrialCheckin) => void;
  onCancel: () => void;
}) {
  const [dims, setDims] = useState({ texture: 0, breakouts: 0, dryness: 0, redness: 0 });
  const [note, setNote] = useState('');
  return (
    <div className="mt-4 flex flex-col gap-4 rounded-card bg-surface p-4 shadow-card">
      <div className="text-[15px] font-semibold">How's your skin vs. when you started?</div>
      {DIMS.map((d) => (
        <DimPicker
          key={d.key}
          label={d.label}
          value={dims[d.key]}
          onChange={(v) => setDims((s) => ({ ...s, [d.key]: v }))}
        />
      ))}
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        maxLength={120}
        className="w-full rounded-[14px] border border-line bg-bg px-4 py-3 text-[15px] outline-none focus:border-ink/25"
      />
      <div className="flex gap-2">
        <PillButton variant="ghost" onClick={onCancel}>
          Cancel
        </PillButton>
        <PillButton fullWidth onClick={() => onSave({ date: today, ...dims, note: note || undefined })}>
          <Check size={16} /> Save check-in
        </PillButton>
      </div>
    </div>
  );
}

function VerdictForm({
  onComplete,
  onCancel,
}: {
  onComplete: (v: { overall: number; repurchase: boolean; note?: string }) => void;
  onCancel: () => void;
}) {
  const [overall, setOverall] = useState(7);
  const [repurchase, setRepurchase] = useState(true);
  const [note, setNote] = useState('');
  return (
    <div className="mt-4 flex flex-col gap-4 rounded-card bg-surface p-4 shadow-card">
      <div className="text-[15px] font-semibold">Your verdict</div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[13px] font-medium">Overall</span>
          <span className="num text-[15px] font-bold text-accent">{overall}/10</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setOverall(n)}
              className={cn(
                'num h-9 flex-1 rounded-lg text-[13px] font-semibold transition-colors',
                n <= overall ? 'bg-accent text-white' : 'bg-ink/[0.06] text-muted',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-[13px] font-medium">Would you repurchase?</div>
        <div className="flex gap-2">
          {[
            { v: true, l: 'Yes' },
            { v: false, l: 'No' },
          ].map((o) => (
            <button
              key={o.l}
              type="button"
              onClick={() => setRepurchase(o.v)}
              className={cn(
                'flex-1 rounded-xl border py-2.5 text-[14px] font-semibold transition-colors',
                repurchase === o.v ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line text-muted',
              )}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="One-line takeaway (optional)"
        maxLength={120}
        className="w-full rounded-[14px] border border-line bg-bg px-4 py-3 text-[15px] outline-none focus:border-ink/25"
      />

      <div className="flex gap-2">
        <PillButton variant="ghost" onClick={onCancel}>
          Cancel
        </PillButton>
        <PillButton fullWidth onClick={() => onComplete({ overall, repurchase, note: note || undefined })}>
          Complete trial
        </PillButton>
      </div>
      <p className="text-center text-[12px] text-muted">Completing adds it to your Shelf, ranked by your score.</p>
    </div>
  );
}
