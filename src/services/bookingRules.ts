// Pure booking rules (no database, no React). Unit-tested in __tests__/bookingService.test.ts.
import { CONFIG } from '../config';
import { Booking, Room } from '../models';
import { nowMin, todayStr } from '../utils/time';

// ---------- Errors ----------

export class BookingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingValidationError';
    Object.setPrototypeOf(this, BookingValidationError.prototype);
  }
}

export class BookingConflictError extends Error {
  /** 'room' = room already taken, 'user' = this student is busy elsewhere. */
  constructor(message: string, public kind: 'room' | 'user', public conflicting: Booking) {
    super(message);
    this.name = 'BookingConflictError';
    Object.setPrototypeOf(this, BookingConflictError.prototype);
  }
}

// ---------- Pure logic ----------

/** Two intervals overlap if each starts before the other ends. Back-to-back is NOT an overlap. */
export function isOverlapping(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Returns the first confirmed booking in `existing` that clashes with the requested
 * room/date/time, or null. Cancelled bookings are ignored.
 */
export function checkConflict(
  existing: Booking[],
  roomId: string,
  date: string,
  startMin: number,
  endMin: number,
): Booking | null {
  return (
    existing.find(
      (b) =>
        b.status === 'confirmed' &&
        b.roomId === roomId &&
        b.date === date &&
        isOverlapping(startMin, endMin, b.startMin, b.endMin),
    ) ?? null
  );
}

/**
 * Booking ID format: RB-YYYYMMDD-NNN, where NNN is that day's sequence number.
 * We take the highest existing sequence + 1 (equal to count + 1 when nothing was deleted),
 * so IDs stay unique.
 */
export function generateBookingId(date: string, existingIdsForDate: string[]): string {
  const compact = date.replace(/-/g, '');
  const prefix = `RB-${compact}-`;
  const maxSeq = existingIdsForDate
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((max, n) => Math.max(max, n), 0);
  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

export interface BookingRequest {
  roomId: string;
  userId: string;
  date: string;
  startMin: number;
  endMin: number;
  purpose?: string | null;
  attendees?: number | null;
}

/** Throws BookingValidationError when the request breaks a basic rule. */
export function validateBookingRequest(req: BookingRequest, room: Room | null, now: Date = new Date()): void {
  if (!room) throw new BookingValidationError('Room not found.');
  if (!room.isActive) throw new BookingValidationError('This room is temporarily unavailable.');
  if (req.startMin >= req.endMin) throw new BookingValidationError('Start time must be before end time.');
  if (req.startMin < CONFIG.dayStartMin || req.endMin > CONFIG.dayEndMin) {
    throw new BookingValidationError('Bookings must be within operating hours.');
  }
  const today = todayStr(now);
  if (req.date < today || (req.date === today && req.startMin < nowMin(now))) {
    throw new BookingValidationError('You cannot book a time in the past.');
  }
}
