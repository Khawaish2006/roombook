// Booking rules: conflict detection, ID generation, validation, create and cancel.
import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import { CONFIG } from '../config';
import { getDb } from '../db/database';
import { Booking } from '../models';
import * as bookingRepo from '../repositories/bookingRepo';
import { getRoomById } from '../repositories/roomRepo';
import { formatRange } from '../utils/time';
import { BookingConflictError, BookingRequest, checkConflict, generateBookingId, isOverlapping, validateBookingRequest } from './bookingRules';
import { cancelReminder, scheduleReminder } from './notificationService';

// Pure rules live in bookingRules.ts; re-exported so callers can import from one place.
export * from './bookingRules';

// ---------- Database operations ----------

/**
 * Exclusive transaction on phones. The browser build of expo-sqlite doesn't support
 * withExclusiveTransactionAsync, so on web we use a normal transaction (a browser tab
 * is a single user, so there's no one to race against).
 */
async function runExclusive(work: (txn: SQLiteDatabase) => Promise<void>): Promise<void> {
  const db = getDb();
  if (Platform.OS === 'web') {
    await db.withTransactionAsync(() => work(db));
  } else {
    await db.withExclusiveTransactionAsync(work);
  }
}

/**
 * Creates a booking. Validation, conflict checks and the insert all run inside ONE
 * exclusive SQLite transaction, so two writes can never both grab the same slot.
 */
export async function createBooking(req: BookingRequest, reminderMin: number = CONFIG.defaultReminderMin): Promise<Booking> {
  let created: Booking | null = null;
  let roomName = req.roomId;

  await runExclusive(async (txn) => {
    // 1. Validate
    const room = await getRoomById(req.roomId, txn);
    validateBookingRequest(req, room);
    roomName = room!.name;

    // 2–3. Same room already booked?
    const roomBookings = await bookingRepo.getConfirmedForRoomDate(req.roomId, req.date, txn);
    const clash = checkConflict(roomBookings, req.roomId, req.date, req.startMin, req.endMin);
    if (clash) {
      throw new BookingConflictError(
        `This room is already reserved from ${formatRange(clash.startMin, clash.endMin)}.`,
        'room',
        clash,
      );
    }

    // 4. Same student already busy in another room?
    const mine = await bookingRepo.getConfirmedForUserDate(req.userId, req.date, txn);
    const myClash = mine.find((b) => isOverlapping(req.startMin, req.endMin, b.startMin, b.endMin));
    if (myClash) {
      throw new BookingConflictError(
        `You already have a booking at this time (${myClash.roomName}, ${formatRange(myClash.startMin, myClash.endMin)}).`,
        'user',
        myClash,
      );
    }

    // 5. Insert
    const id = generateBookingId(req.date, await bookingRepo.getIdsForDate(req.date, txn));
    created = {
      id,
      roomId: req.roomId,
      userId: req.userId,
      date: req.date,
      startMin: req.startMin,
      endMin: req.endMin,
      purpose: req.purpose ?? null,
      attendees: req.attendees ?? null,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      cancelledAt: null,
    };
    await bookingRepo.insertBooking(created, txn);
  });

  // Reminder is best-effort: a notification problem must never undo a booking.
  try {
    await scheduleReminder(created!, roomName, reminderMin);
  } catch (e) {
    console.warn('Could not schedule reminder', e);
  }
  return created!;
}

export async function cancelBooking(bookingId: string): Promise<void> {
  await bookingRepo.markCancelled(bookingId);
  try {
    await cancelReminder(bookingId);
  } catch (e) {
    console.warn('Could not cancel reminder', e);
  }
}
