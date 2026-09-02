// Local-date helpers keyed as 'YYYY-MM-DD'. The prototype uses the browser clock.

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toKey(new Date());
}

// Shift a 'YYYY-MM-DD' key by whole days (handles month/year rollover via Date math).
export function shiftKey(key: string, deltaDays: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return toKey(dt);
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function weekdayShort(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

// Greeting by time of day — used on the Stack header.
export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// Which routine is "now" — used to default the AM/PM toggle.
export function currentPeriod(now: Date = new Date()): 'am' | 'pm' {
  return now.getHours() < 16 ? 'am' : 'pm';
}
