// Turns a day's bookings into a list of hourly slots, and handles multi-slot selection.
import { CONFIG } from '../config';
import { Booking } from '../models';
import { nowMin, todayStr } from '../utils/time';
import { isOverlapping } from './bookingRules';

export type SlotState = 'available' | 'booked' | 'past';

export interface Slot {
  startMin: number;
  endMin: number;
  state: SlotState;
}

/** One slot per `slotLengthMin` between opening and closing time, each marked available/booked/past. */
export function generateDaySlots(
  date: string,
  bookings: Booking[],
  now: Date = new Date(),
  opts = { dayStartMin: CONFIG.dayStartMin, dayEndMin: CONFIG.dayEndMin, slotLengthMin: CONFIG.slotLengthMin },
): Slot[] {
  const today = todayStr(now);
  const current = nowMin(now);
  const slots: Slot[] = [];

  for (let start = opts.dayStartMin; start + opts.slotLengthMin <= opts.dayEndMin; start += opts.slotLengthMin) {
    const end = start + opts.slotLengthMin;
    const isPast = date < today || (date === today && start < current);
    const isBooked = bookings.some(
      (b) => b.status === 'confirmed' && b.date === date && isOverlapping(start, end, b.startMin, b.endMin),
    );
    // A booked slot stays "booked" even after it passes, so the timeline is honest.
    slots.push({ startMin: start, endMin: end, state: isBooked ? 'booked' : isPast ? 'past' : 'available' });
  }
  return slots;
}

/** True when the room has no confirmed booking overlapping [start, end). */
export function isFreeAt(bookings: Booking[], start: number, end: number): boolean {
  return !bookings.some((b) => b.status === 'confirmed' && isOverlapping(start, end, b.startMin, b.endMin));
}

export interface SelectionResult {
  /** Start minutes of the selected slots, sorted. */
  selected: number[];
  hint?: string;
}

/**
 * Handles a tap on a slot chip. Only consecutive available slots can be selected.
 * - tap an unavailable slot → unchanged, with a hint
 * - tap next to the current range → extend it
 * - tap the first/last selected slot → shrink
 * - tap anything else → start a new selection there
 */
export function toggleSlot(slots: Slot[], selected: number[], tappedStart: number): SelectionResult {
  const slot = slots.find((s) => s.startMin === tappedStart);
  if (!slot || slot.state !== 'available') {
    return { selected, hint: slot?.state === 'past' ? 'That time has already passed.' : 'That slot is already booked.' };
  }
  if (selected.length === 0) return { selected: [tappedStart] };

  const sorted = [...selected].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const len = slot.endMin - slot.startMin;

  if (tappedStart === first || tappedStart === last) {
    return { selected: sorted.filter((s) => s !== tappedStart) };
  }
  if (sorted.includes(tappedStart)) {
    return { selected: [tappedStart], hint: 'Selection restarted. Tap an end slot to shrink it.' };
  }
  if (tappedStart === last + len || tappedStart === first - len) {
    return { selected: [...sorted, tappedStart].sort((a, b) => a - b) };
  }
  return { selected: [tappedStart], hint: 'Only consecutive slots can be booked together.' };
}

/** Converts a selection into one time range, or null if empty. */
export function selectionToRange(selected: number[], slotLengthMin = CONFIG.slotLengthMin) {
  if (selected.length === 0) return null;
  const sorted = [...selected].sort((a, b) => a - b);
  return { startMin: sorted[0], endMin: sorted[sorted.length - 1] + slotLengthMin };
}
