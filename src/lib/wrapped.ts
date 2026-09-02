// "Skin Wrapped" — a Spotify-Wrapped-style year summary computed from the user's own data.
import { getProduct, type Product } from '../data/mockCatalog';
import type { LogEntry, RankedShelfItem, Trial } from '../state/store';
import { MONTH_NAMES, longestStreak } from './progress';

export interface Wrapped {
  year: number;
  tried: number;
  holyGrails: number;
  trialsCompleted: number;
  checkIns: number;
  streak: number;
  longest: number;
  spent: number;
  topBrand: string;
  topProduct?: Product;
  bestMonth?: string;
  avgSkin: number; // out of 5
}

export function computeWrapped(args: {
  ranked: RankedShelfItem[];
  trials: Trial[];
  logs: Record<string, LogEntry>;
  using: string[];
  streak: number;
  today: string;
}): Wrapped {
  const { ranked, trials, logs, using, streak, today } = args;

  const triedIds = new Set<string>();
  ranked.forEach((r) => triedIds.add(r.productId));
  using.forEach((id) => triedIds.add(id));
  trials.forEach((t) => triedIds.add(t.productId));
  const tried = [...triedIds].map(getProduct).filter((p): p is Product => !!p);

  const spent = tried.reduce((s, p) => s + p.price, 0);

  const brandCount = new Map<string, number>();
  tried.forEach((p) => brandCount.set(p.brand, (brandCount.get(p.brand) ?? 0) + 1));
  const topBrand = [...brandCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  const rated = Object.values(logs).filter((e) => e.skinRating !== null && e.skinRating !== undefined);
  const avgSkin = rated.length
    ? Math.round((rated.reduce((s, e) => s + (e.skinRating! + 1), 0) / rated.length) * 10) / 10
    : 0;

  // best skin month (highest average rating)
  const byMonth = new Map<string, { sum: number; n: number }>();
  Object.entries(logs).forEach(([k, e]) => {
    if (e.skinRating === null || e.skinRating === undefined) return;
    const m = k.slice(0, 7);
    const g = byMonth.get(m) ?? { sum: 0, n: 0 };
    g.sum += e.skinRating;
    g.n += 1;
    byMonth.set(m, g);
  });
  let bestMonth: string | undefined;
  let bestAvg = -1;
  byMonth.forEach((g, m) => {
    const a = g.sum / g.n;
    if (a > bestAvg) {
      bestAvg = a;
      bestMonth = m;
    }
  });

  return {
    year: Number(today.slice(0, 4)),
    tried: tried.length,
    holyGrails: ranked.filter((r) => r.tier === 'S').length,
    trialsCompleted: trials.filter((t) => t.status === 'completed').length,
    checkIns: rated.length,
    streak,
    longest: longestStreak(logs),
    spent,
    topBrand,
    topProduct: ranked[0] ? getProduct(ranked[0].productId) : undefined,
    bestMonth: bestMonth ? MONTH_NAMES[Number(bestMonth.slice(5, 7)) - 1] : undefined,
    avgSkin,
  };
}
