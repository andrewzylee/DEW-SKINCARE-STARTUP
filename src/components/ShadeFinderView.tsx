import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Pencil, Plus, Wand2, X } from 'lucide-react';
import { TONES, UNDERTONES, type Tone, type Undertone } from '../data/mockCatalog';
import { TONE_LABEL, UNDERTONE_LABEL } from '../lib/shadeMatch';
import { buildShadeRows } from '../lib/shadeFinder';
import { useStore } from '../state/store';
import { spring } from '../lib/motion';
import { cn } from '../lib/cn';
import { ProductImage } from './ProductImage';

// Shade Finder — the cross-brand shade translator. You self-submit the shade you already know is a
// match in one brand; from your tone + undertone we estimate your shade in every other foundation
// and concealer. No AI, no selfie — you're the source of truth, and each logged shade sharpens the
// picture. Renders into #stack-overlay at z-[45] so a product sheet layers on top and returns here.
export function ShadeFinderView({
  open,
  onClose,
  onOpenProduct,
}: {
  open: boolean;
  onClose: () => void;
  onOpenProduct: (productId: string) => void;
}) {
  const root = typeof document !== 'undefined' ? document.getElementById('stack-overlay') : null;
  const { state, updateProfile } = useStore();
  const tone = state.profile?.tone;
  const undertone = state.profile?.undertone;
  const saved = state.profile?.shades;

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const rows = useMemo(() => buildShadeRows(saved, tone, undertone), [saved, tone, undertone]);
  const loggedCount = rows.filter((r) => r.recorded).length;
  if (!root) return null;

  const set = (patch: { tone?: Tone; undertone?: Undertone }) => updateProfile(patch);

  const beginEdit = (productId: string, current: string) => {
    setEditing(productId);
    setDraft(current);
  };
  const commit = (productId: string) => {
    const trimmed = draft.trim();
    const next = (saved ?? []).filter((s) => s.productId !== productId);
    if (trimmed) next.push({ productId, shade: trimmed });
    updateProfile({ shades: next });
    setEditing(null);
    setDraft('');
  };
  const clear = (productId: string) => {
    updateProfile({ shades: (saved ?? []).filter((s) => s.productId !== productId) });
    setEditing(null);
    setDraft('');
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-auto absolute inset-0 z-[45] flex flex-col overflow-y-auto no-scrollbar bg-bg pb-12"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={spring}
        >
          {/* Cover — coral (makeup identity) */}
          <div
            className="relative px-5 pb-6 pt-6"
            style={{
              backgroundImage:
                'linear-gradient(160deg, rgb(var(--makeup)), rgb(var(--makeup) / 0.72))',
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
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
              <Wand2 size={12} /> Cross-brand
            </div>
            <h1 className="mt-3 font-display text-[31px] font-semibold leading-tight text-white">
              Shade Finder
            </h1>
            <p className="mt-1 text-[14px] font-medium text-white/85">
              Know your shade in one brand? Log it. We'll translate it to every other foundation &
              concealer — no guessing at the counter.
            </p>
          </div>

          {/* Your skin — editable tone + undertone (powers the estimates) */}
          <div className="px-5 pt-5">
            <div className="rounded-[20px] border border-line bg-surface p-4">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                  Your skin
                </div>
                <div className="num text-[11px] font-semibold text-makeup-ink">
                  {loggedCount} logged
                </div>
              </div>

              <div className="mt-2.5 text-[12.5px] font-semibold text-ink">Tone</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {TONES.map((t) => (
                  <Chip key={t} on={tone === t} onClick={() => set({ tone: t })} label={TONE_LABEL[t]} />
                ))}
              </div>

              <div className="mt-3 text-[12.5px] font-semibold text-ink">Undertone</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {UNDERTONES.map((u) => (
                  <Chip
                    key={u}
                    on={undertone === u}
                    onClick={() => set({ undertone: u })}
                    label={UNDERTONE_LABEL[u]}
                  />
                ))}
              </div>

              <p className="mt-3 text-[12.5px] leading-snug text-muted">
                {tone
                  ? 'Estimates come from your tone & undertone. Log a shade you already wear to lock that one in — you tell us, not an algorithm.'
                  : 'Pick your tone & undertone to see estimates. You can log an exact shade on any product below.'}
              </p>
            </div>
          </div>

          {/* Per-product matches */}
          <div className="mt-5 px-5">
            <h2 className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
              Your matches
            </h2>
            <div className="flex flex-col gap-2">
              {rows.map((row) => {
                const isEditing = editing === row.product.id;
                return (
                  <div
                    key={row.product.id}
                    className="rounded-[18px] bg-surface p-2.5 shadow-card"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenProduct(row.product.id)}
                        className="shrink-0 transition-transform active:scale-[0.97]"
                        aria-label={`Open ${row.product.name}`}
                      >
                        <ProductImage
                          id={row.product.id}
                          brand={row.product.brand}
                          name={row.product.name}
                          size="md"
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14.5px] font-semibold leading-tight">
                          {row.product.name}
                        </div>
                        <div className="num text-[12px] text-muted">{row.product.brand}</div>
                        {!isEditing && (
                          <div className="mt-1 flex items-center gap-1.5">
                            {row.shade ? (
                              <>
                                <span
                                  className={cn(
                                    'num rounded-full px-2 py-0.5 text-[12px] font-bold',
                                    row.recorded
                                      ? 'bg-makeup text-white'
                                      : 'border border-makeup/40 text-makeup-ink',
                                  )}
                                >
                                  {row.recorded ? row.shade : `≈ ${row.shade}`}
                                </span>
                                <span className="text-[11px] text-muted">
                                  {row.recorded ? 'your match' : 'estimate'}
                                </span>
                              </>
                            ) : (
                              <span className="text-[12px] text-muted">Set your tone to estimate</span>
                            )}
                          </div>
                        )}
                      </div>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => beginEdit(row.product.id, row.recorded ? row.shade ?? '' : '')}
                          className="flex shrink-0 items-center gap-1 rounded-full border border-line px-2.5 py-1.5 text-[12px] font-semibold text-ink transition-transform active:scale-95"
                        >
                          {row.recorded ? <Pencil size={13} /> : <Plus size={13} />}
                          {row.recorded ? 'Edit' : 'Log'}
                        </button>
                      )}
                    </div>

                    {/* Inline self-submit editor */}
                    {isEditing && (
                      <div className="mt-2.5 border-t border-line pt-2.5">
                        <label className="text-[12px] font-semibold text-ink">
                          Your shade in {row.product.brand}
                        </label>
                        <div className="mt-1.5 flex items-center gap-2">
                          <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') commit(row.product.id);
                              if (e.key === 'Escape') setEditing(null);
                            }}
                            placeholder="e.g. 290W, Custard, Medium 3"
                            className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 text-[14px] outline-none focus:border-makeup"
                          />
                          <button
                            type="button"
                            onClick={() => commit(row.product.id)}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-makeup text-white transition-transform active:scale-95"
                            aria-label="Save shade"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => (row.recorded ? clear(row.product.id) : setEditing(null))}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-muted transition-transform active:scale-95"
                            aria-label={row.recorded ? 'Remove shade' : 'Cancel'}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-center text-[11.5px] text-muted">
              You submit your own shades — no AI, no selfie. Translations are a starting point; always
              test in daylight. Prototype data.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  );
}

function Chip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
        on ? 'bg-makeup text-white' : 'bg-ink/[0.05] text-ink',
      )}
    >
      {label}
    </button>
  );
}
