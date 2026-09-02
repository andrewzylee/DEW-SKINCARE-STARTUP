// Progress / streak helpers for the calendar view. Pure and testable.
import type { LogEntry } from '../state/store';
import { shiftKey, toKey } from './date';

/** A day counts as logged once a skin rating is set (the daily check-in commit). */
export function isLogged(e?: LogEntry): boolean {
  return !!e && e.skinRating !== null && e.skinRating !== undefined;
}

/** Longest run of consecutive logged days across all history. */
export function longestStreak(logs: Record<string, LogEntry>): number {
  const keys = Object.keys(logs)
    .filter((k) => isLogged(logs[k]))
    .sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of keys) {
    run = prev && shiftKey(prev, 1) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

/** The 7 date keys (Sun→Sat) of the week containing `todayKey`. */
export function weekKeys(todayKey: string): string[] {
  const [y, m, d] = todayKey.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay(); // 0 = Sun
  return Array.from({ length: 7 }, (_, i) => toKey(new Date(y, m - 1, d - dow + i)));
}

export interface MonthCell {
  key: string | null; // null = padding cell
  day: number | null;
}

/** Cells for a month grid (0-based month), padded with nulls to whole weeks (Sun-first). */
export function monthCells(year: number, month: number): MonthCell[] {
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: MonthCell[] = [];
  for (let i = 0; i < startDow; i++) cells.push({ key: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ key: toKey(new Date(year, month, d)), day: d });
  while (cells.length % 7 !== 0) cells.push({ key: null, day: null });
  return cells;
}

// Skin score (0–100) from a set of 0–4 daily ratings — the home "Your skin score" number.
export function skinScore(ratings: number[]): number | null {
  if (!ratings.length) return null;
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length; // 0..4
  return Math.round(50 + (avg / 4) * 45); // 50..95 band
}

export interface WeeklyScore {
  score: number | null;
  label: string;
  delta: number | null; // vs last week
}

export function weeklyScore(logs: Record<string, LogEntry>, today: string): WeeklyScore {
  const ratingsFor = (keys: string[]) =>
    keys.map((k) => logs[k]).filter(isLogged).map((e) => e!.skinRating as number);
  const score = skinScore(ratingsFor(weekKeys(today)));
  const last = skinScore(ratingsFor(weekKeys(shiftKey(today, -7))));
  const delta = score != null && last != null ? score - last : null;
  const label =
    score == null
      ? 'Log to see'
      : score >= 85
        ? 'Great'
        : score >= 72
          ? 'Good'
          : score >= 60
            ? 'Okay'
            : 'Needs care';
  return { score, label, delta };
}

const MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365];

/** Next streak milestone above the current streak, or null once past the top. */
export function nextMilestone(streak: number): number | null {
  return MILESTONES.find((m) => m > streak) ?? null;
}

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
