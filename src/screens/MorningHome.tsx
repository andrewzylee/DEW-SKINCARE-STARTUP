import { useMemo } from 'react';
import { Bell, Calendar, Check, Menu } from 'lucide-react';
import { catalog, getProduct, productDomain } from '../data/mockCatalog';
import { greeting } from '../lib/date';
import { weeklyScore } from '../lib/progress';
import { skinMatch } from '../lib/skinMatch';
import { useStore } from '../state/store';
import { useUI } from '../state/ui';
import { cn } from '../lib/cn';
import type { TabKey } from '../components/TabBar';
import { ProductImage } from '../components/ProductImage';
import { CategoryTag } from '../components/CategoryTag';

// Premium greeting home — the calm first impression: a warm greeting, a skin-score card with a
// friendly dew-drop, today's routine to check off, and one personalized recommendation.
const STEP_LABEL: Record<string, string> = {
  cleanser: 'Cleanse',
  serum: 'Treat',
  treatment: 'Treat',
  moisturizer: 'Hydrate',
  spf: 'Protect',
};

export function MorningHome({
  go,
  onOpenMenu,
  onOpenCalendar,
}: {
  go: (t: TabKey) => void;
  onOpenMenu: () => void;
  onOpenCalendar: () => void;
}) {
  const { state, today, streak, todayLog, toggleUsedToday } = useStore();
  const { openProduct } = useUI();
  const firstName = state.account.displayName.split(' ')[0];
  const period: 'am' | 'pm' = new Date().getHours() < 16 ? 'am' : 'pm';

  const { score, label, delta } = useMemo(() => weeklyScore(state.logs, today), [state.logs, today]);

  const routineIds = useMemo(() => {
    const src = period === 'am' ? state.stack?.am : state.stack?.pm;
    const seen = new Set<string>();
    const out: string[] = [];
    (src ?? []).forEach((id) => {
      if (state.using.includes(id) && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    });
    return out.slice(0, 5);
  }, [state.stack, state.using, period]);
  const usedList = period === 'am' ? todayLog?.usedAM ?? [] : todayLog?.usedPM ?? [];

  const rec = useMemo(() => {
    const owned = new Set([...state.using, ...state.shelf.map((s) => s.productId)]);
    return catalog
      .filter((p) => productDomain(p) === 'skincare' && !owned.has(p.id))
      .map((p) => ({ p, m: skinMatch(state.profile, p) }))
      .sort((a, b) => b.m.score - a.m.score)[0];
  }, [state.using, state.shelf, state.profile]);

  return (
    <div className="px-5 pt-7">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <h1 className="font-display text-[32px] font-semibold leading-[1.06] tracking-tight text-ink">
          {greeting()},
          <br />
          {firstName} <span className="text-[26px]">✨</span>
        </h1>
        <div className="flex items-center gap-3 pt-1.5 text-muted">
          <button type="button" onClick={onOpenCalendar} aria-label="Progress calendar">
            <Calendar size={20} />
          </button>
          <button type="button" className="relative" aria-label="Notifications">
            <Bell size={21} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-tier-f" />
          </button>
          <button type="button" onClick={onOpenMenu} aria-label="Menu">
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Skin score */}
      <button
        type="button"
        onClick={onOpenCalendar}
        className="mt-5 flex w-full items-center gap-3 overflow-hidden rounded-card bg-accent-soft p-5 text-left transition-transform active:scale-[0.99]"
      >
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-medium uppercase tracking-[0.12em] text-accent-ink/70">
            Your skin score
          </div>
          <div className="mt-1.5 font-display text-[54px] font-semibold leading-none text-accent-ink">
            {score ?? '—'}
          </div>
          <div className="mt-2 text-[16px] font-semibold text-accent-ink">{label}</div>
          <div className="mt-0.5 text-[12.5px] text-accent-ink/70">
            {delta != null && delta !== 0
              ? `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta)} pts this week`
              : streak > 0
                ? `${streak}-day streak`
                : 'Log daily to track it'}
          </div>
        </div>
        <DewFace />
      </button>

      {/* Daily routine */}
      {routineIds.length > 0 && (
        <div className="mt-7">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[21px] font-semibold text-ink">Daily routine</h2>
            <button
              type="button"
              onClick={() => go('shelf')}
              className="text-[13.5px] font-medium text-accent-ink"
            >
              Edit
            </button>
          </div>
          <div className="no-scrollbar mt-3 flex gap-3.5 overflow-x-auto pb-1">
            {routineIds.map((id) => {
              const p = getProduct(id);
              if (!p) return null;
              const done = usedList.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleUsedToday(period, id)}
                  className="flex w-[84px] shrink-0 flex-col items-center"
                >
                  <span className="mb-2 text-[11px] font-medium text-muted">
                    {STEP_LABEL[p.category] ?? 'Step'}
                  </span>
                  <div
                    className={cn(
                      'relative grid h-[84px] w-[84px] place-items-center rounded-[22px] bg-surface p-2.5 shadow-card transition-all',
                      done && 'ring-2 ring-accent',
                    )}
                  >
                    <ProductImage
                      id={p.id}
                      brand={p.brand}
                      name={p.name}
                      size="md"
                      className="!bg-transparent !ring-0"
                    />
                    <span
                      className={cn(
                        'absolute -bottom-2 grid h-6 w-6 place-items-center rounded-full border-2 border-bg transition-colors',
                        done ? 'bg-accent text-white' : 'bg-surface text-transparent shadow-card',
                      )}
                    >
                      <Check size={13} strokeWidth={3} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended for you */}
      {rec && (
        <div className="mt-7">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[21px] font-semibold text-ink">Recommended for you</h2>
            <button
              type="button"
              onClick={() => go('shelf')}
              className="text-[13.5px] font-medium text-accent-ink"
            >
              See all
            </button>
          </div>
          <button
            type="button"
            onClick={() => openProduct(rec.p.id)}
            className="mt-3 flex w-full items-center gap-3 overflow-hidden rounded-card bg-surface p-4 text-left shadow-card transition-transform active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <CategoryTag category={rec.p.category} />
              <div className="mt-0.5 font-display text-[20px] font-semibold leading-tight text-ink">
                {rec.p.name}
              </div>
              <div className="text-[13px] text-muted">{rec.p.brand}</div>
              {rec.m.reasons[0] && (
                <div className="mt-1.5 text-[12.5px] text-accent-ink">{rec.m.reasons[0].text}</div>
              )}
            </div>
            <ProductImage id={rec.p.id} brand={rec.p.brand} name={rec.p.name} size="lg" />
            <MatchRing score={rec.m.score} />
          </button>
        </div>
      )}
    </div>
  );
}

function DewFace() {
  return (
    <svg width="92" height="92" viewBox="0 0 92 92" fill="none" className="shrink-0">
      <defs>
        <radialGradient id="dewg" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="58%" stopColor="rgb(var(--accent-bright))" stopOpacity="0.6" />
          <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      <circle cx="46" cy="48" r="31" fill="url(#dewg)" />
      <ellipse cx="35" cy="35" rx="9" ry="7" fill="#fff" opacity="0.6" />
      <circle cx="75" cy="30" r="5" fill="url(#dewg)" />
      <circle cx="69" cy="63" r="3.5" fill="url(#dewg)" />
      <circle cx="39" cy="49" r="2.5" fill="rgb(var(--accent-ink))" />
      <circle cx="53" cy="49" r="2.5" fill="rgb(var(--accent-ink))" />
      <path
        d="M39 56 Q46 61 53 56"
        stroke="rgb(var(--accent-ink))"
        strokeWidth="2.3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function MatchRing({ score }: { score: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  return (
    <div className="relative grid h-[54px] w-[54px] shrink-0 place-items-center">
      <svg width="54" height="54" className="-rotate-90">
        <circle cx="27" cy="27" r={r} fill="none" stroke="rgb(var(--line))" strokeWidth="4" />
        <circle
          cx="27"
          cy="27"
          r={r}
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute text-center">
        <div className="num text-[13.5px] font-bold leading-none text-accent-ink">{score}</div>
        <div className="text-[8px] uppercase tracking-wide text-muted">match</div>
      </div>
    </div>
  );
}
