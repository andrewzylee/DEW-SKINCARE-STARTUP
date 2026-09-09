import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { people } from '../data/social';
import { tasteItemsFromRanked, tasteMatchWithFriend } from '../lib/taste';
import { useStore } from '../state/store';
import { spring } from '../lib/motion';
import { Avatar } from './Avatar';

// "See all" for Your taste twins — every friend ranked by how much your beauty taste lines up.
// Renders into #stack-overlay at z-[45]; tapping a friend opens their profile on top.
export function TwinsView({
  open,
  onClose,
  onOpenFriend,
}: {
  open: boolean;
  onClose: () => void;
  onOpenFriend: (id: string) => void;
}) {
  const root = typeof document !== 'undefined' ? document.getElementById('stack-overlay') : null;
  const { rankedShelf } = useStore();
  const mine = useMemo(() => tasteItemsFromRanked(rankedShelf), [rankedShelf]);
  const twins = useMemo(
    () =>
      people
        .map((p) => ({ p, m: tasteMatchWithFriend(mine, p.id) }))
        .sort((a, b) => b.m.score - a.m.score),
    [mine],
  );
  if (!root) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-auto absolute inset-0 z-[45] flex flex-col overflow-y-auto no-scrollbar bg-bg pb-10"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={spring}
        >
          <div className="flex items-center gap-3 px-5 pb-1 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-ink/5"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-display text-[23px] font-semibold">Your taste twins</h1>
          </div>
          <p className="px-5 pb-3 pl-[68px] text-[13px] leading-snug text-muted">
            Everyone you follow, ranked by how much your beauty taste lines up.
          </p>

          <div className="flex flex-col gap-2 px-5">
            {twins.map(({ p, m }, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onOpenFriend(p.id)}
                className="flex items-center gap-3 rounded-[18px] bg-surface p-2.5 text-left shadow-card transition-transform active:scale-[0.99]"
              >
                <span className="num w-5 shrink-0 text-center text-[14px] font-bold text-muted">
                  {i + 1}
                </span>
                <Avatar name={p.name} tint={p.tint} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold leading-tight">{p.name}</div>
                  <div className="num truncate text-[12.5px] text-muted">@{p.handle}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end leading-none">
                  <span className="num text-[17px] font-bold" style={{ color: matchColor(m.score) }}>
                    {m.score}%
                  </span>
                  <span className="mt-0.5 text-[11px] text-muted">match</span>
                </div>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  );
}

function matchColor(score: number): string {
  if (score >= 80) return 'rgb(var(--accent))';
  if (score >= 55) return 'rgb(var(--ink))';
  return 'rgb(var(--muted))';
}
