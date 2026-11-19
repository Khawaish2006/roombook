// Display status is derived from stored status + the clock. It is never stored.
import { CONFIG } from '../config';
import { Booking, DisplayStatus } from '../models';
import { nowMin, todayStr } from '../utils/time';

export function deriveStatus(b: Booking, now: Date = new Date()): DisplayStatus {
  if (b.status === 'cancelled') return 'cancelled';
  const today = todayStr(now);
  const ended = b.date < today || (b.date === today && b.endMin <= nowMin(now));
  return ended ? 'completed' : 'upcoming';
}

/** Upcoming and starting within the next hour (or already in progress). */
export function isStartingSoon(b: Booking, now: Date = new Date()): boolean {
  if (deriveStatus(b, now) !== 'upcoming' || b.date !== todayStr(now)) return false;
  return b.startMin - nowMin(now) <= CONFIG.startingSoonMin;
}
