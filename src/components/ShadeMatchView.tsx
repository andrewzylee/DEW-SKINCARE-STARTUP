import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Sparkles } from 'lucide-react';
import { TONES, UNDERTONES, type Tone, type Undertone } from '../data/mockCatalog';
import {
  shadeMatch,
  TONE_LABEL,
  UNDERTONE_LABEL,
} from '../lib/shadeMatch';
import { useStore } from '../state/store';
import { spring } from '../lib/motion';
import { cn } from '../lib/cn';
import { Avatar } from './Avatar';
import { ProductImage } from './ProductImage';
import { categoryLabel } from './CategoryTag';

// Shade Match — the acquisition wedge. Set your tone + undertone (works with zero social graph),
// get shade-aware picks for color makeup, and see people with your skin. Renders into
// #stack-overlay at z-[45] so tapping a product opens its sheet on top and returns here.
export function ShadeMatchView({
  open,
  onClose,
  onOpenProduct,
  onOpenFriend,
}: {
  open: boolean;
  onClose: () => void;
  onOpenProduct: (productId: string) => void;
  onOpenFriend: (personId: string) => void;
}) {
  const root = typeof document !== 'undefined' ? document.getElementById('stack-overlay') : null;
  const { state, updateProfile } = useStore();
  const tone = state.profile?.tone;
  const undertone = state.profile?.undertone;

  const result = useMemo(() => shadeMatch(tone, undertone), [tone, undertone]);
  if (!root) return null;

  const set = (patch: { tone?: Tone; undertone?: Undertone }) => updateProfile(patch);

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
              <Sparkles size={12} /> The wedge
            </div>
            <h1 className="mt-3 text-[26px] font-bold leading-tight text-white">Shade Match</h1>
            <p className="mt-1 text-[14px] font-medium text-white/85">
              Color that actually suits your skin — foundation, concealer, blush & lip.
            </p>
          </div>

          {/* Your skin — editable tone + undertone */}
          <div className="px-5 pt-5">
            <div className="rounded-[20px] border border-line bg-surface p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                Your skin
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

              {!tone && (
                <p className="mt-3 text-[12.5px] leading-snug text-muted">
                  Pick your tone & undertone to see shade-matched picks. (In the full app, a selfie
                  sets these automatically.)
                </p>
              )}
            </div>
          </div>

          {/* People with your skin */}
          {result.fans.length > 0 && (
            <div className="mt-5">
              <h2 className="px-5 text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
                People with your skin
              </h2>
              <div className="no-scrollbar mt-3 flex gap-4 overflow-x-auto px-5 pb-1">
                {result.fans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpenFriend(p.id)}
                    className="flex w-[64px] shrink-0 flex-col items-center"
                  >
                    <Avatar name={p.name} tint={p.tint} size="lg" />
                    <span className="mt-2 w-full truncate text-center text-[12px] font-medium">
                      {p.name.split(' ')[0]}
                    </span>
                    <span className="text-[10.5px] capitalize text-muted">
                      {TONE_LABEL[p.tone].toLowerCase()} · {p.undertone}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Shade-matched picks by category */}
          {tone && (
            <div className="mt-5 px-5">
              <h2 className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.12em] text-muted">
                Your matches
              </h2>
              <div className="flex flex-col gap-4">
                {result.byCategory.map(({ category, picks }) => (
                  <div key={category}>
                    <div className="mb-1.5 text-[12.5px] font-bold text-ink">
                      {categoryLabel(category)}
                    </div>
                    <div className="flex flex-col gap-2">
                      {picks.map((pick) => (
                        <button
                          key={pick.product.id}
                          type="button"
                          onClick={() => onOpenProduct(pick.product.id)}
                          className="flex w-full items-center gap-3 rounded-[18px] bg-surface p-2.5 text-left shadow-card transition-transform active:scale-[0.99]"
                        >
                          <ProductImage
                            id={pick.product.id}
                            brand={pick.product.brand}
                            name={pick.product.name}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[14.5px] font-semibold leading-tight">
                              {pick.product.name}
                            </div>
                            <div className="num text-[12px] text-muted">
                              {pick.product.brand} · ${pick.product.price}
                            </div>
                            <div className="mt-1 text-[12px] leading-snug text-makeup-ink">
                              {pick.reason}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span
                              className="num rounded-full px-2 py-0.5 text-[12px] font-bold text-white"
                              style={{ backgroundColor: 'rgb(var(--makeup))' }}
                            >
                              {pick.fit}
                            </span>
                            <ChevronRight size={16} className="text-muted" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-center text-[11.5px] text-muted">
                Shade fit is a guide, not a guarantee — always test in daylight. Prototype data.
              </p>
            </div>
          )}
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
