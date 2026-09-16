// Progress / streak helpers for the native Calendar screen. The web app derives these from a real
// logs store; the native app has no logs store yet, so we synthesize a deterministic demo history
// (recent days always logged so the streak reads as 5) to drive a faithful heat-map. Swap
// demoLog() for real daily_logs when the backend is wired.
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Skin-rating heat-map ramp (0 Rough → 4 Great): coral → orange → gold → green → emerald.
export const RATING_LABELS = ['Rough', 'Off', 'Okay', 'Good', 'Great'];
export const RATING_COLORS = ['#ec6a5a', '#e8935a', '#d7a13a', '#2fb985', '#0c8f62'];

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const parse = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => dateKey(new Date());

export function diffDays(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Deterministic demo check-in for a day → skin rating 0..4, or null if not logged.
export function demoLog(key: string): number | null {
  const today = todayKey();
  if (key > today) return null;
  const ago = diffDays(key, today);
  if (ago < 5) return 2 + (hash(key) % 3); // recent days: Okay..Great, always logged (streak = 5)
  if (hash(key) % 10 < 6) return hash(key) % 5; // ~60% of earlier days logged
  return null;
}
export const isLoggedKey = (key: string) => demoLog(key) !== null;

export interface Cell {
  key: string | null;
  day: number | null;
}
export function monthCells(year: number, month: number): Cell[] {
  const startDow = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: Cell[] = [];
  for (let i = 0; i < startDow; i++) cells.push({ key: null, day: null });
  for (let d = 1; d <= days; d++) cells.push({ key: dateKey(new Date(year, month, d)), day: d });
  return cells;
}

export function weekKeys(today: string): string[] {
  const t = parse(today);
  const sunday = new Date(t);
  sunday.setDate(t.getDate() - t.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return dateKey(d);
  });
}

export function currentStreak(today = todayKey()): number {
  let n = 0;
  const d = parse(today);
  while (isLoggedKey(dateKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function longestStreak(windowDays = 150): number {
  const end = parse(todayKey());
  let best = 0;
  let run = 0;
  for (let i = windowDays; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    if (isLoggedKey(dateKey(d))) {
      run++;
      best = Math.max(best, run);
    } else run = 0;
  }
  return best;
}

export function totalCheckins(windowDays = 150): number {
  const end = parse(todayKey());
  let n = 0;
  for (let i = windowDays; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    if (isLoggedKey(dateKey(d))) n++;
  }
  return n;
}

const MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365];
export function nextMilestone(streak: number): number | null {
  for (const m of MILESTONES) if (m > streak) return m;
  return null;
}
