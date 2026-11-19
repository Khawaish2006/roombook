// Date/time helpers. Dates are 'YYYY-MM-DD' strings, times are minutes from midnight.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Date object → 'YYYY-MM-DD' in local time. */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'YYYY-MM-DD' → local Date at midnight. */
export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayStr(now: Date = new Date()): string {
  return toDateStr(now);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

/** Minutes since midnight for the given moment. */
export function nowMin(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

/** 900 → "3:00 PM" */
export function formatMin(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(m)} ${suffix}`;
}

/** (900, 1020) → "3:00 – 5:00 PM" */
export function formatRange(start: number, end: number): string {
  const s = formatMin(start); // e.g. "3:00 PM"
  const e = formatMin(end);
  const sameSuffix = s.slice(-2) === e.slice(-2);
  // Drop the repeated AM/PM: "3:00 – 5:00 PM" instead of "3:00 PM – 5:00 PM".
  return sameSuffix ? `${s.slice(0, -3)} – ${e}` : `${s} – ${e}`;
}

/** '2026-09-15' → "15 Sept 2026" (or "Today"/"Tomorrow" when relative = true). */
export function formatDate(dateStr: string, relative = false, now: Date = new Date()): string {
  if (relative) {
    const today = todayStr(now);
    if (dateStr === today) return 'Today';
    if (dateStr === addDays(today, 1)) return 'Tomorrow';
  }
  const d = parseDateStr(dateStr);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** '2026-09-15' → "Tue" */
export function weekdayOf(dateStr: string): string {
  return WEEKDAYS[parseDateStr(dateStr).getDay()];
}

/** Absolute Date for a date string + minutes. */
export function toDateTime(dateStr: string, min: number): Date {
  const d = parseDateStr(dateStr);
  d.setMinutes(min);
  return d;
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
