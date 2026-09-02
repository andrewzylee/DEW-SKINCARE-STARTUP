import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Share2, X } from 'lucide-react';
import { useStore } from '../state/store';
import { computeWrapped } from '../lib/wrapped';
import { spring } from '../lib/motion';
import { ProductImage } from '../components/ProductImage';

export function WrappedCard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const root = typeof document !== 'undefined' ? document.getElementById('stack-overlay') : null;
  const { state, streak, rankedShelf, today } = useStore();
  if (!root) return null;

  const w = computeWrapped({
    ranked: rankedShelf,
    trials: state.trials,
    logs: state.logs,
    using: state.using,
    streak,
    today,
  });
  const handle = state.account.handle;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-auto absolute inset-0 z-[70] flex flex-col text-white"
          style={{ backgroundImage: 'linear-gradient(160deg, #0c8f62 0%, #17c88b 46%, #d7a13a 100%)' }}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={spring}
        >
          <div className="flex items-center justify-between px-5 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/15"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <span className="text-[12px] font-bold uppercase tracking-[0.22em] opacity-90">
              Skin Wrapped
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15">
              <Share2 size={17} />
            </span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-4">
            <div className="mt-2">
              <div className="num text-[64px] font-black leading-none">{w.year}</div>
              <div className="text-[15px] opacity-90">@{handle}'s skin, wrapped.</div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Hero big={w.streak} unit="day streak 🔥" />
              <Hero big={w.holyGrails} unit="holy grails 🏆" />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Chip label="Products tried" value={w.tried} />
              <Chip label="Trials finished" value={w.trialsCompleted} />
              <Chip label="Check-ins" value={w.checkIns} />
              <Chip label="Longest streak" value={w.longest} />
              <Chip label="Spent" value={`$${w.spent}`} />
              <Chip label="Avg skin" value={`${w.avgSkin || '—'}/5`} />
            </div>

            {w.topProduct && (
              <div className="mt-3 rounded-[20px] bg-white/15 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                  Your #1 product
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <ProductImage
                    id={w.topProduct.id}
                    brand={w.topProduct.brand}
                    name={w.topProduct.name}
                    size="md"
                    className="ring-white/60"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-bold">{w.topProduct.name}</div>
                    <div className="truncate text-[13px] opacity-85">{w.topProduct.brand}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Tile label="Top brand" value={w.topBrand} />
              <Tile label="Best skin month" value={w.bestMonth ?? '—'} />
            </div>

            <div className="mt-5 text-center">
              <div className="font-display text-[20px] font-semibold">Dew</div>
              <p className="text-[11px] opacity-80">skinmaxx · your skin, sorted</p>
            </div>
          </div>

          <div className="safe-b px-5 pb-6 pt-2">
            <button
              type="button"
              className="w-full rounded-full bg-white py-3.5 text-[15px] font-bold text-accent-ink active:scale-[0.99]"
            >
              Share your Wrapped
            </button>
            <p className="mt-2 text-center text-[11px] opacity-80">Screenshot to share (stubbed).</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  );
}

function Hero({ big, unit }: { big: number; unit: string }) {
  return (
    <div className="rounded-[20px] bg-white/15 p-4">
      <div className="num text-[40px] font-black leading-none">{big}</div>
      <div className="mt-1 text-[13px] font-medium opacity-90">{unit}</div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[16px] bg-white/15 px-3.5 py-3">
      <div className="num text-[20px] font-bold leading-none">{value}</div>
      <div className="mt-1 text-[11.5px] opacity-85">{label}</div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-white/15 px-3.5 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{label}</div>
      <div className="mt-1 truncate text-[15px] font-bold">{value}</div>
    </div>
  );
}
