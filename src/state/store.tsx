// STACK — app state. Single-user, on-device. React Context + localStorage so logs,
// shelf, and profile survive a refresh (§8). No backend, no auth.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UserProfile } from '../data/quiz';
import type { Comment } from '../data/social';
import { getProduct, productDomain, type Category, type Domain } from '../data/mockCatalog';
import {
  reactionCap,
  recomputeTiersGrouped,
  strengthGap,
  tierForScore,
  type Reaction,
  type Strength,
  type Tier,
} from '../lib/ranking';
import { shiftKey, todayKey } from '../lib/date';

export interface StackState {
  am: string[]; // product ids, ordered
  pm: string[];
  notes: string[]; // generator guidance (ramp-up, etc.)
}

export interface LogEntry {
  date: string; // 'YYYY-MM-DD'
  usedAM: string[];
  usedPM: string[];
  skinRating: number | null; // 0..4 on a 5-point scale; null = not rated
  note?: string;
  logged?: boolean; // the user tapped "Log today" to commit the check-in
}

export interface ShelfItem {
  productId: string;
  note?: string;
  reaction?: Reaction; // quick gut reaction captured when ranking
  strength?: Strength; // "how close?" gap to the item ranked just above it
}

export interface RankedShelfItem extends ShelfItem {
  rank: number; // global 1-based position on the shelf
  tier: Tier; // within-category quality band
  category: Category;
  domain: Domain;
  groupRank: number; // rank within its category (1 = best blush, etc.)
  groupSize: number; // how many of that category you've ranked
}

// A change to your ranking — powers the "latest moves" feed (new #1, ↑/↓, dropped out of top N).
export interface RankEvent {
  id: string;
  productId: string;
  category: Category;
  fromRank: number | null; // null = newly ranked
  toRank: number;
  groupSize: number;
  reaction?: Reaction;
  reason?: string;
  date: string;
  ts: number;
}

// A Trial = tracking one product over time (the "results, not products" object). Progress
// check-ins score four outcome dimensions vs. baseline; a verdict ends it and flows the
// product into the Shelf ranking.
export interface TrialCheckin {
  date: string;
  texture: number; // -1 worse · 0 same · +1 better (vs. when you started)
  breakouts: number;
  dryness: number;
  redness: number;
  note?: string;
}

export interface TrialVerdict {
  overall: number; // 1–10
  repurchase: boolean;
  note?: string;
}

export interface Trial {
  id: string;
  productId: string;
  startDate: string;
  targetDays: number;
  status: 'active' | 'completed' | 'abandoned';
  checkins: TrialCheckin[];
  verdict?: TrialVerdict;
  endDate?: string;
}

// Editable social/profile account. Avatar is a data URL kept on-device only (never uploaded).
export interface Account {
  displayName: string;
  handle: string;
  bio: string;
  location: string;
  avatar?: string;
  memberSince: string;
  followers: number;
  following: number;
  school?: string;
  avoid?: string[]; // ingredient ids the user is sensitive to (see data/ingredients.ts)
}

const DEFAULT_ACCOUNT: Account = {
  displayName: 'You',
  handle: 'you',
  bio: '',
  location: '',
  memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  followers: 18,
  following: 27,
};

interface PersistedState {
  version: number;
  onboarded: boolean;
  profile: UserProfile | null;
  stack: StackState | null;
  using: string[]; // product ids currently in the active routine
  logs: Record<string, LogEntry>;
  shelf: ShelfItem[]; // ordered best -> worst
  trials: Trial[];
  account: Account;
  goalPerWeek: number; // check-in days targeted per week
  postComments: Record<string, Comment[]>; // comments you've added, keyed by post id
  likedPosts: string[];
  rankEvents: RankEvent[]; // your own ranking changes (newest first)
}

const STORAGE_KEY = 'stack.state.v1';
const VERSION = 1;

const EMPTY: PersistedState = {
  version: VERSION,
  onboarded: false,
  profile: null,
  stack: null,
  using: [],
  logs: {},
  shelf: [],
  trials: [],
  account: DEFAULT_ACCOUNT,
  goalPerWeek: 5,
  postComments: {},
  likedPosts: [],
  rankEvents: [],
};

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as PersistedState;
    if (parsed.version !== VERSION) return EMPTY;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

// A day counts toward the streak once the user commits a skin rating (the check-in).
function isDayComplete(entry: LogEntry | undefined): boolean {
  return !!entry && entry.skinRating !== null && entry.skinRating !== undefined;
}

export function computeStreak(logs: Record<string, LogEntry>, today: string): number {
  // Today not-yet-done doesn't break the streak — count from yesterday in that case.
  let cursor = isDayComplete(logs[today]) ? today : shiftKey(today, -1);
  let streak = 0;
  while (isDayComplete(logs[cursor])) {
    streak += 1;
    cursor = shiftKey(cursor, -1);
  }
  return streak;
}

function uniq(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

// Insert `productId` among its own category on the shelf at `localIndex` (0 = best of that
// category). Keeps categories in their existing relative order; new categories append. This is
// what makes rankings per-category ("#2 of 8 blushes") without a separate list per category.
// Rank of a product within its category on a shelf (1-based), or null if not present.
function categoryRank(shelf: ShelfItem[], productId: string, category: Category): number | null {
  let r = 0;
  for (const it of shelf) {
    if (getProduct(it.productId)?.category !== category) continue;
    r += 1;
    if (it.productId === productId) return r;
  }
  return null;
}
const categoryCount = (shelf: ShelfItem[], category: Category): number =>
  shelf.filter((it) => getProduct(it.productId)?.category === category).length;

// A finished trial has a 1–10 verdict — map it to the same reaction scale so trial-ranked
// products get a meaningful, absolute tier (not a neutral default).
function reactionFromScore(overall: number): Reaction {
  if (overall >= 9) return 'love';
  if (overall >= 7) return 'like';
  if (overall >= 5) return 'fine';
  if (overall >= 3) return 'dislike';
  return 'never';
}

function placeInCategory(
  shelf: ShelfItem[],
  productId: string,
  category: Category,
  localIndex: number,
  note?: string,
  reaction?: Reaction,
  strength?: Strength,
): ShelfItem[] {
  const existing = shelf.find((it) => it.productId === productId);
  const without = shelf.filter((it) => it.productId !== productId);
  const item: ShelfItem = {
    productId,
    note: note ?? existing?.note,
    reaction: reaction ?? existing?.reaction,
    strength: strength ?? existing?.strength,
  };
  const catIdx = without
    .map((it, i) => (getProduct(it.productId)?.category === category ? i : -1))
    .filter((i) => i >= 0);
  const local = Math.max(0, Math.min(localIndex, catIdx.length));
  let globalIndex: number;
  if (catIdx.length === 0) globalIndex = without.length; // first of its category → append
  else if (local === 0) globalIndex = catIdx[0];
  else if (local >= catIdx.length) globalIndex = catIdx[catIdx.length - 1] + 1;
  else globalIndex = catIdx[local];
  return [...without.slice(0, globalIndex), item, ...without.slice(globalIndex)];
}

interface StoreValue {
  state: PersistedState;
  today: string;
  streak: number;
  rankedShelf: RankedShelfItem[];
  todayLog: LogEntry | undefined;

  // onboarding
  completeOnboarding(profile: UserProfile, stack: StackState): void;
  resetAll(): void;
  updateAccount(partial: Partial<Account>): void;
  updateProfile(partial: Partial<UserProfile>): void;
  setGoalPerWeek(n: number): void;

  // stack
  isUsing(productId: string): boolean;
  toggleUsing(productId: string): void;
  swapProduct(oldId: string, newId: string): void;
  addToRoutine(period: 'am' | 'pm', productId: string): void;
  removeFromRoutine(period: 'am' | 'pm', productId: string): void;

  // log
  getLog(dateKey: string): LogEntry | undefined;
  toggleUsedToday(period: 'am' | 'pm', productId: string): void;
  setUsedToday(period: 'am' | 'pm', ids: string[]): void;
  setSkinRating(rating: number): void;
  setTodayNote(note: string): void;
  submitToday(): void;

  // shelf — ranking is per-category (localIndex is the position among same-category items)
  insertShelfInCategory(
    productId: string,
    localIndex: number,
    meta?: { note?: string; reaction?: Reaction; reason?: string; strength?: Strength },
  ): void;
  reorderCategory(category: Category, orderedProductIds: string[]): void;
  removeFromShelf(productId: string): void;
  updateShelfNote(productId: string, note: string): void;
  isOnShelf(productId: string): boolean;

  // trials
  activeTrials: Trial[];
  trialForProduct(productId: string): Trial | undefined;
  startTrial(productId: string, targetDays?: number): string;
  addTrialCheckin(trialId: string, checkin: TrialCheckin): void;
  completeTrial(trialId: string, verdict: TrialVerdict): void;
  abandonTrial(trialId: string): void;

  // social posts
  addComment(postId: string, text: string): void;
  toggleLikePost(postId: string): void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(load);
  // Re-read "today" when the tab regains focus so a next-day session is correct.
  const [today, setToday] = useState<string>(todayKey);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / unavailable — prototype degrades to in-memory */
    }
  }, [state]);

  useEffect(() => {
    const refresh = () => setToday(todayKey());
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const completeOnboarding = useCallback((profile: UserProfile, stack: StackState) => {
    setState((s) => ({
      ...s,
      onboarded: true,
      profile,
      stack,
      using: uniq([...stack.am, ...stack.pm]),
    }));
  }, []);

  const resetAll = useCallback(() => setState({ ...EMPTY }), []);

  const updateAccount = useCallback((partial: Partial<Account>) => {
    setState((s) => ({ ...s, account: { ...s.account, ...partial } }));
  }, []);

  const updateProfile = useCallback((partial: Partial<UserProfile>) => {
    setState((s) => (s.profile ? { ...s, profile: { ...s.profile, ...partial } } : s));
  }, []);

  const setGoalPerWeek = useCallback((n: number) => {
    setState((s) => ({ ...s, goalPerWeek: Math.max(1, Math.min(7, Math.round(n))) }));
  }, []);

  const isUsing = useCallback((id: string) => state.using.includes(id), [state.using]);

  const toggleUsing = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      using: s.using.includes(id) ? s.using.filter((x) => x !== id) : [...s.using, id],
    }));
  }, []);

  // Swap a product wherever it appears in the routine (same physical slot in AM & PM).
  const swapProduct = useCallback((oldId: string, newId: string) => {
    setState((s) => {
      if (!s.stack) return s;
      const replace = (arr: string[]) => uniq(arr.map((x) => (x === oldId ? newId : x)));
      const am = replace(s.stack.am);
      const pm = replace(s.stack.pm);
      const using = uniq(
        s.using.map((x) => (x === oldId ? newId : x)),
      ).filter((x) => am.includes(x) || pm.includes(x) || x === newId);
      return { ...s, stack: { ...s.stack, am, pm }, using };
    });
  }, []);

  // Add a product to a routine period (AM or PM) and mark it in-use. No-op if already there.
  const addToRoutine = useCallback((period: 'am' | 'pm', productId: string) => {
    setState((s) => {
      if (!s.stack || s.stack[period].includes(productId)) return s;
      const stack = { ...s.stack, [period]: [...s.stack[period], productId] };
      return { ...s, stack, using: uniq([...s.using, productId]) };
    });
  }, []);

  // Remove a product from a routine period. Drops it from `using` once it's gone from both.
  const removeFromRoutine = useCallback((period: 'am' | 'pm', productId: string) => {
    setState((s) => {
      if (!s.stack) return s;
      const stack = { ...s.stack, [period]: s.stack[period].filter((x) => x !== productId) };
      const stillInRoutine = stack.am.includes(productId) || stack.pm.includes(productId);
      const using = stillInRoutine ? s.using : s.using.filter((x) => x !== productId);
      return { ...s, stack, using };
    });
  }, []);

  const ensureToday = (s: PersistedState, date: string): LogEntry =>
    s.logs[date] ?? { date, usedAM: [], usedPM: [], skinRating: null };

  const toggleUsedToday = useCallback(
    (period: 'am' | 'pm', productId: string) => {
      setState((s) => {
        const entry = ensureToday(s, today);
        const key = period === 'am' ? 'usedAM' : 'usedPM';
        const list = entry[key];
        const next = list.includes(productId)
          ? list.filter((x) => x !== productId)
          : [...list, productId];
        return { ...s, logs: { ...s.logs, [today]: { ...entry, [key]: next } } };
      });
    },
    [today],
  );

  const setSkinRating = useCallback(
    (rating: number) => {
      setState((s) => {
        const entry = ensureToday(s, today);
        return { ...s, logs: { ...s.logs, [today]: { ...entry, skinRating: rating } } };
      });
    },
    [today],
  );

  const setTodayNote = useCallback(
    (note: string) => {
      setState((s) => {
        const entry = ensureToday(s, today);
        return { ...s, logs: { ...s.logs, [today]: { ...entry, note } } };
      });
    },
    [today],
  );

  // Commit today's check-in (the Log "Log today" submit). Everything already auto-saves; this
  // marks it done so the screen can confirm it.
  const submitToday = useCallback(() => {
    setState((s) => {
      const entry = ensureToday(s, today);
      return { ...s, logs: { ...s.logs, [today]: { ...entry, logged: true } } };
    });
  }, [today]);

  // Set the whole used-list for a period at once (the Log "mark all / clear" affordance).
  const setUsedToday = useCallback(
    (period: 'am' | 'pm', ids: string[]) => {
      setState((s) => {
        const entry = ensureToday(s, today);
        const key = period === 'am' ? 'usedAM' : 'usedPM';
        return { ...s, logs: { ...s.logs, [today]: { ...entry, [key]: ids } } };
      });
    },
    [today],
  );

  const insertShelfInCategory = useCallback(
    (
      productId: string,
      localIndex: number,
      meta?: { note?: string; reaction?: Reaction; reason?: string; strength?: Strength },
    ) => {
      const p = getProduct(productId);
      if (!p) return;
      setState((s) => {
        const from = categoryRank(s.shelf, productId, p.category);
        const shelf = placeInCategory(
          s.shelf,
          productId,
          p.category,
          localIndex,
          meta?.note,
          meta?.reaction,
          meta?.strength,
        );
        const to = categoryRank(shelf, productId, p.category) ?? 1;
        if (from === to) return { ...s, shelf }; // no positional change → no feed event
        const event: RankEvent = {
          id: `re-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId,
          category: p.category,
          fromRank: from,
          toRank: to,
          groupSize: categoryCount(shelf, p.category),
          reaction: meta?.reaction,
          reason: meta?.reason?.trim() || undefined,
          date: today,
          ts: Date.now(),
        };
        return { ...s, shelf, rankEvents: [event, ...s.rankEvents].slice(0, 60) };
      });
    },
    [today],
  );

  // Manual drag-reorder within a category — the user's list is the source of truth. Rebuilds the
  // shelf with that category's items in the new order (preserving each item's note/reaction/
  // strength) and logs a move for the biggest change.
  const reorderCategory = useCallback(
    (category: Category, orderedProductIds: string[]) => {
      setState((s) => {
        const catIds = s.shelf
          .filter((it) => getProduct(it.productId)?.category === category)
          .map((it) => it.productId);
        const byId = new Map(s.shelf.map((it) => [it.productId, it] as const));
        const queue = [...orderedProductIds];
        const shelf = s.shelf.map((it) =>
          getProduct(it.productId)?.category === category
            ? byId.get(queue.shift() as string) ?? it
            : it,
        );
        let moved: string | null = null;
        let bestDelta = 0;
        orderedProductIds.forEach((id, idx) => {
          const fr = catIds.indexOf(id);
          if (fr < 0) return;
          const delta = fr - idx;
          if (Math.abs(delta) > Math.abs(bestDelta)) {
            bestDelta = delta;
            moved = id;
          }
        });
        let rankEvents = s.rankEvents;
        if (moved && bestDelta !== 0) {
          const event: RankEvent = {
            id: `re-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: moved,
            category,
            fromRank: catIds.indexOf(moved) + 1,
            toRank: orderedProductIds.indexOf(moved) + 1,
            groupSize: orderedProductIds.length,
            reason: 'Reordered by hand',
            date: today,
            ts: Date.now(),
          };
          rankEvents = [event, ...s.rankEvents].slice(0, 60);
        }
        return { ...s, shelf, rankEvents };
      });
    },
    [today],
  );

  const removeFromShelf = useCallback((productId: string) => {
    setState((s) => ({ ...s, shelf: s.shelf.filter((it) => it.productId !== productId) }));
  }, []);

  const updateShelfNote = useCallback((productId: string, note: string) => {
    setState((s) => ({
      ...s,
      shelf: s.shelf.map((it) =>
        it.productId === productId ? { ...it, note: note || undefined } : it,
      ),
    }));
  }, []);

  const isOnShelf = useCallback(
    (id: string) => state.shelf.some((it) => it.productId === id),
    [state.shelf],
  );

  // ---- Trials ----
  // Plain function (not memoized) so it always sees the latest state & today, and can return
  // the trial id synchronously.
  const startTrial = (productId: string, targetDays = 42): string => {
    const existing = state.trials.find((t) => t.productId === productId && t.status === 'active');
    if (existing) return existing.id;
    const id = `trial-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const trial: Trial = { id, productId, startDate: today, targetDays, status: 'active', checkins: [] };
    setState((s) => ({ ...s, trials: [trial, ...s.trials] }));
    return id;
  };

  const addTrialCheckin = useCallback((trialId: string, checkin: TrialCheckin) => {
    setState((s) => ({
      ...s,
      trials: s.trials.map((t) =>
        t.id === trialId
          ? {
              ...t,
              checkins: [...t.checkins.filter((c) => c.date !== checkin.date), checkin].sort((a, b) =>
                a.date.localeCompare(b.date),
              ),
            }
          : t,
      ),
    }));
  }, []);

  const completeTrial = useCallback(
    (trialId: string, verdict: TrialVerdict) => {
      setState((s) => {
        const trial = s.trials.find((t) => t.id === trialId);
        const trials = s.trials.map((t) =>
          t.id === trialId ? { ...t, status: 'completed' as const, verdict, endDate: today } : t,
        );
        let shelf = s.shelf;
        let rankEvents = s.rankEvents;
        const p = trial ? getProduct(trial.productId) : undefined;
        if (trial && p) {
          // Place within its category by the verdict: 10/10 → top of category, 1/10 → bottom.
          const from = categoryRank(s.shelf, trial.productId, p.category);
          const catCount = s.shelf.filter(
            (it) => it.productId !== trial.productId && getProduct(it.productId)?.category === p.category,
          ).length;
          const localIdx = Math.round((1 - verdict.overall / 10) * catCount);
          const note = `Trial: ${verdict.overall}/10${verdict.repurchase ? ' · would repurchase' : ''}`;
          shelf = placeInCategory(
            s.shelf,
            trial.productId,
            p.category,
            localIdx,
            note,
            reactionFromScore(verdict.overall),
          );
          const to = categoryRank(shelf, trial.productId, p.category) ?? 1;
          if (from !== to) {
            const event: RankEvent = {
              id: `re-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              productId: trial.productId,
              category: p.category,
              fromRank: from,
              toRank: to,
              groupSize: categoryCount(shelf, p.category),
              reason: `Finished a ${verdict.overall}/10 trial${verdict.repurchase ? ' · would repurchase' : ''}`,
              date: today,
              ts: Date.now(),
            };
            rankEvents = [event, ...s.rankEvents].slice(0, 60);
          }
        }
        return { ...s, trials, shelf, rankEvents };
      });
    },
    [today],
  );

  const abandonTrial = useCallback(
    (trialId: string) => {
      setState((s) => ({
        ...s,
        trials: s.trials.map((t) =>
          t.id === trialId ? { ...t, status: 'abandoned' as const, endDate: today } : t,
        ),
      }));
    },
    [today],
  );

  const activeTrials = useMemo(() => state.trials.filter((t) => t.status === 'active'), [state.trials]);
  const trialForProduct = useCallback(
    (productId: string) => state.trials.find((t) => t.productId === productId && t.status === 'active'),
    [state.trials],
  );

  // ---- Post comments & likes ----
  const addComment = useCallback((postId: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    const c: Comment = { id: `u-${Date.now()}`, personId: 'me', text: t, timeAgo: 'now' };
    setState((s) => ({
      ...s,
      postComments: { ...s.postComments, [postId]: [...(s.postComments[postId] ?? []), c] },
    }));
  }, []);

  const toggleLikePost = useCallback((postId: string) => {
    setState((s) => ({
      ...s,
      likedPosts: s.likedPosts.includes(postId)
        ? s.likedPosts.filter((x) => x !== postId)
        : [...s.likedPosts, postId],
    }));
  }, []);

  const getLog = useCallback((dateKey: string) => state.logs[dateKey], [state.logs]);

  const streak = useMemo(() => computeStreak(state.logs, today), [state.logs, today]);
  const rankedShelf = useMemo<RankedShelfItem[]>(() => {
    const withMeta = state.shelf
      .map((it) => {
        const p = getProduct(it.productId);
        return p ? { ...it, category: p.category, domain: productDomain(p) } : null;
      })
      .filter((x): x is ShelfItem & { category: Category; domain: Domain } => x !== null);
    const ranked = recomputeTiersGrouped(withMeta, (it) => it.category);
    // Absolute reaction ceiling + a strength-driven gap below the item above. #1 of a category
    // scores its cap; each next item = min(its own cap, prevScore − strengthGap). Items arrive in
    // ascending groupRank per category, so this walks each category top → bottom.
    const prevScore = new Map<Category, number>();
    return ranked.map((it) => {
      const cap = reactionCap(it.reaction);
      const prev = prevScore.get(it.category);
      const raw = prev === undefined ? cap : Math.min(cap, prev - strengthGap(it.strength));
      const score = Math.max(20, Math.min(99, Math.round(raw)));
      prevScore.set(it.category, score);
      return { ...it, tier: tierForScore(score) };
    });
  }, [state.shelf]);
  const todayLog = state.logs[today];

  const value: StoreValue = {
    state,
    today,
    streak,
    rankedShelf,
    todayLog,
    completeOnboarding,
    resetAll,
    updateAccount,
    updateProfile,
    setGoalPerWeek,
    isUsing,
    toggleUsing,
    swapProduct,
    addToRoutine,
    removeFromRoutine,
    getLog,
    toggleUsedToday,
    setUsedToday,
    setSkinRating,
    setTodayNote,
    submitToday,
    insertShelfInCategory,
    reorderCategory,
    removeFromShelf,
    updateShelfNote,
    isOnShelf,
    activeTrials,
    trialForProduct,
    startTrial,
    addTrialCheckin,
    completeTrial,
    abandonTrial,
    addComment,
    toggleLikePost,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within <StoreProvider>');
  return ctx;
}
