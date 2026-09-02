import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Flame,
  Minus,
  Plus,
  Target,
  Trophy,
  X,
} from 'lucide-react';
import { getProduct, type Product } from '../data/mockCatalog';
import { useStore, type LogEntry } from '../state/store';
import {
  MONTH_NAMES,
  isLogged,
  longestStreak,
  monthCells,
  nextMilestone,
  weekKeys,
} from '../lib/progress';
import { cn } from '../lib/cn';
import { spring } from '../lib/motion';
import { SegmentedToggle } from '../components/SegmentedToggle';
import { ProductImage } from '../components/ProductImage';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Skin-rating heat-map ramp (0 Rough → 4 Great): coral → orange → gold → green → emerald.
const RATING_LABELS = ['Rough', 'Off', 'Okay', 'Good', 'Great'];
const RATING_COLORS = ['#ec6a5a', '#e8935a', '#d7a13a', '#2fb985', '#0c8f62'];

type CalMode = 'skin' | 'streak';

export function CalendarView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const root = typeof document !== 'undefined' ? document.getElementById('stack-overlay') : null;
  const { state, streak, today } = useStore();

  const [ty, tm] = useMemo(() => {
    const [y, m] = today.split('-').map(Number);
    return [y, m - 1] as const;
  }, [today]);
  const [view, setView] = useState({ year: ty, month: tm });
  const [mode, setMode] = useState<CalMode>('skin');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setSelected(null);
  }, [open]);

  if (!root) return null;

  const longest = longestStreak(state.logs);
  const totalLogged = Object.values(state.logs).filter((e) => isLogged(e)).length;
  const cells = monthCells(view.year, view.month);
  const monthLogged = cells.filter((c) => c.key && isLogged(state.logs[c.key])).length;

  const goTo = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };
  const isCurrentMonth = view.year === ty && view.month === tm;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-auto absolute inset-0 z-[60] flex flex-col bg-bg"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={spring}
        >
          <div className="flex items-center gap-3 px-5 pb-2 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-ink/5"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-[22px] font-bold tracking-tight">Progress</h1>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8">
            <div className="grid grid-cols-3 gap-2.5">
              <StatTile icon={Flame} tint="rgb(var(--accent-bright))" value={streak} label="Day streak" />
              <StatTile icon={Trophy} tint="rgb(var(--tier-s))" value={longest} label="Longest" />
              <StatTile icon={Target} tint="rgb(var(--accent))" value={totalLogged} label="Check-ins" />
            </div>

            <WeeklyGoal />

            {/* Month calendar */}
            <div className="mt-4 rounded-card bg-surface p-4 shadow-card">
              <SegmentedToggle<CalMode>
                layoutId="cal-mode"
                value={mode}
                onChange={setMode}
                className="mb-3"
                options={[
                  { value: 'skin', label: 'Skin' },
                  { value: 'streak', label: 'Streak' },
                ]}
              />

              <div className="mb-3 flex items-center justify-between">
                <div className="text-[16px] font-semibold">
                  {MONTH_NAMES[view.month]} <span className="num text-muted">{view.year}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => goTo(-1)}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-ink/5"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo(1)}
                    disabled={isCurrentMonth}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-ink/5 disabled:opacity-30"
                    aria-label="Next month"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((w, i) => (
                  <div key={i} className="text-center text-[11px] font-semibold text-muted">
                    {w}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((c, i) => {
                  if (!c.key) return <div key={i} className="aspect-square" />;
                  const entry = state.logs[c.key];
                  const logged = isLogged(entry);
                  const rating = entry?.skinRating ?? null;
                  const isToday = c.key === today;
                  const future = c.key > today;
                  const fill = logged
                    ? mode === 'skin' && rating !== null
                      ? RATING_COLORS[rating]
                      : 'rgb(var(--accent))'
                    : undefined;
                  return (
                    <div key={i} className="aspect-square">
                      <button
                        type="button"
                        disabled={future}
                        onClick={() => setSelected(c.key)}
                        className={cn(
                          'num grid h-full w-full place-items-center rounded-full text-[13px] font-semibold transition-transform active:scale-90',
                          !logged && isToday && 'ring-2 ring-accent text-accent',
                          !logged && !isToday && !future && 'text-ink hover:bg-ink/5',
                          future && 'text-muted/50',
                          isToday && logged && 'ring-2 ring-offset-2 ring-offset-surface ring-accent',
                        )}
                        style={fill ? { backgroundColor: fill, color: '#fff' } : undefined}
                      >
                        {c.day}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              {mode === 'skin' ? (
                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                  <span className="text-[11px] text-muted">Rough</span>
                  <div className="flex flex-1 gap-1">
                    {RATING_COLORS.map((c) => (
                      <span key={c} className="h-2.5 flex-1 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted">Great</span>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[12.5px] text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded-full bg-accent" /> Logged
                  </span>
                  <span>
                    <span className="num font-semibold text-ink">{monthLogged}</span> in{' '}
                    {MONTH_NAMES[view.month]}
                  </span>
                </div>
              )}
            </div>

            <Milestone streak={streak} />
          </div>

          {/* Day detail */}
          <AnimatePresence>
            {selected && (
              <DayDetail dateKey={selected} entry={state.logs[selected]} onClose={() => setSelected(null)} />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>,
    root,
  );
}

function StatTile({
  icon: Icon,
  tint,
  value,
  label,
}: {
  icon: typeof Flame;
  tint: string;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-[18px] bg-surface p-3 text-center shadow-card">
      <Icon size={18} className="mx-auto" style={{ color: tint }} />
      <div className="num mt-1 text-[22px] font-bold leading-none">{value}</div>
      <div className="mt-1 text-[11px] text-muted">{label}</div>
    </div>
  );
}

function WeeklyGoal() {
  const { state, today, setGoalPerWeek } = useStore();
  const goal = state.goalPerWeek;
  const week = weekKeys(today);
  const loggedThisWeek = week.filter((k) => isLogged(state.logs[k])).length;
  const hit = loggedThisWeek >= goal;

  return (
    <div className="mt-4 rounded-card bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[15px] font-semibold">Weekly goal</div>
          <p className="text-[12.5px] text-muted">
            <span className="num font-semibold text-ink">{loggedThisWeek}</span> of{' '}
            <span className="num">{goal}</span> days this week{hit ? ' — hit it! 🎉' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setGoalPerWeek(goal - 1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted hover:bg-ink/5"
            aria-label="Lower goal"
          >
            <Minus size={15} />
          </button>
          <span className="num w-6 text-center text-[16px] font-bold">{goal}</span>
          <button
            type="button"
            onClick={() => setGoalPerWeek(goal + 1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-line text-muted hover:bg-ink/5"
            aria-label="Raise goal"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        {week.map((k, i) => {
          const logged = isLogged(state.logs[k]);
          const isToday = k === today;
          return (
            <div key={k} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  'h-8 w-full rounded-lg transition-colors',
                  logged ? 'bg-accent' : 'bg-ink/[0.06]',
                  isToday && !logged && 'ring-2 ring-accent',
                )}
              />
              <span className="text-[10px] text-muted">{WEEKDAYS[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Milestone({ streak }: { streak: number }) {
  const next = nextMilestone(streak);
  if (next === null) {
    return (
      <div className="mt-4 rounded-card bg-accent-soft p-4 text-center">
        <p className="text-[14px] font-semibold text-accent-ink">
          You've passed every streak milestone. Legend. 🏆
        </p>
      </div>
    );
  }
  const pct = Math.round((streak / next) * 100);
  return (
    <div className="mt-4 rounded-card bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-semibold">Next milestone</div>
        <span className="num text-[13px] font-semibold text-muted">{next} days</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink/[0.06]">
        <motion.div
          className="h-full rounded-full bg-accent-bright"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={spring}
        />
      </div>
      <p className="mt-2 text-[12.5px] text-muted">
        <span className="num font-semibold text-ink">{Math.max(0, next - streak)}</span> more day
        {next - streak === 1 ? '' : 's'} to hit a <span className="num">{next}</span>-day streak.
      </p>
    </div>
  );
}

function DayDetail({
  dateKey,
  entry,
  onClose,
}: {
  dateKey: string;
  entry: LogEntry | undefined;
  onClose: () => void;
}) {
  const label = useMemo(() => {
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [dateKey]);

  const rating = entry?.skinRating ?? null;
  const rated = rating !== null && rating !== undefined;
  const used = entry
    ? Array.from(new Set([...entry.usedAM, ...entry.usedPM]))
        .map(getProduct)
        .filter((p): p is Product => !!p)
    : [];

  return (
    <div className="absolute inset-0 z-[70] flex flex-col justify-end">
      <motion.div
        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative max-h-[80%] overflow-y-auto no-scrollbar rounded-t-[28px] bg-surface px-5 pb-7 pt-4 shadow-pop"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={spring}
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line" />
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[18px] font-bold leading-tight">{label}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-ink/5"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {rated ? (
          <div className="mt-3 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span
                className="rounded-full px-3.5 py-1.5 text-[14px] font-semibold text-white"
                style={{ backgroundColor: RATING_COLORS[rating] }}
              >
                {RATING_LABELS[rating]}
              </span>
              <div className="flex items-end gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-full"
                    style={{
                      height: 8 + i * 4,
                      backgroundColor: i <= rating ? RATING_COLORS[rating] : 'rgb(var(--ink) / 0.12)',
                    }}
                  />
                ))}
              </div>
              <span className="num ml-auto text-[13px] text-muted">{rating + 1}/5</span>
            </div>

            {entry?.note && (
              <div>
                <div className="text-[12px] font-medium text-muted">Notes</div>
                <p className="mt-0.5 text-[15px] leading-snug">{entry.note}</p>
              </div>
            )}

            <div>
              <div className="text-[12px] font-medium text-muted">
                Used {used.length > 0 && <span className="num">({used.length})</span>}
              </div>
              {used.length > 0 ? (
                <div className="mt-2 flex flex-col gap-2">
                  {used.map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <ProductImage id={p.id} brand={p.brand} name={p.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-semibold leading-tight">{p.name}</div>
                        <div className="truncate text-[12px] text-muted">{p.brand}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-0.5 text-[13.5px] text-muted">No products checked off.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-3 pb-2 text-[14px] text-muted">
            No check-in logged this day. Rate your skin in Log to fill it in.
          </p>
        )}
      </motion.div>
    </div>
  );
}
