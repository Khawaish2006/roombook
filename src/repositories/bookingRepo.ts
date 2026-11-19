// All SQL for the bookings table lives here.
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '../db/database';
import { Booking, BookingWithRoom } from '../models';

interface BookingRow {
  id: string;
  room_id: string;
  user_id: string;
  date: string;
  start_min: number;
  end_min: number;
  purpose: string | null;
  attendees: number | null;
  status: Booking['status'];
  created_at: string;
  cancelled_at: string | null;
  room_name?: string;
  room_type?: BookingWithRoom['roomType'];
  user_name?: string;
}

function toBooking(r: BookingRow): BookingWithRoom {
  return {
    id: r.id,
    roomId: r.room_id,
    userId: r.user_id,
    date: r.date,
    startMin: r.start_min,
    endMin: r.end_min,
    purpose: r.purpose,
    attendees: r.attendees,
    status: r.status,
    createdAt: r.created_at,
    cancelledAt: r.cancelled_at,
    roomName: r.room_name ?? r.room_id,
    roomType: r.room_type ?? 'classroom',
    userName: r.user_name ?? '',
  };
}

const SELECT_JOINED = `
  SELECT b.*, r.name AS room_name, r.type AS room_type, u.name AS user_name
  FROM bookings b
  JOIN rooms r ON r.id = b.room_id
  JOIN users u ON u.id = b.user_id`;

export async function getBookingById(id: string): Promise<BookingWithRoom | null> {
  const row = await getDb().getFirstAsync<BookingRow>(`${SELECT_JOINED} WHERE b.id = ?`, id);
  return row ? toBooking(row) : null;
}

export async function getBookingsForUser(userId: string): Promise<BookingWithRoom[]> {
  const rows = await getDb().getAllAsync<BookingRow>(
    `${SELECT_JOINED} WHERE b.user_id = ? ORDER BY b.date DESC, b.start_min DESC`,
    userId,
  );
  return rows.map(toBooking);
}

export interface AdminBookingFilter {
  date?: string;
  roomId?: string;
}

export async function getAllBookings(filter: AdminBookingFilter = {}): Promise<BookingWithRoom[]> {
  const where: string[] = [];
  const params: string[] = [];
  if (filter.date) { where.push('b.date = ?'); params.push(filter.date); }
  if (filter.roomId) { where.push('b.room_id = ?'); params.push(filter.roomId); }
  const rows = await getDb().getAllAsync<BookingRow>(
    `${SELECT_JOINED} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY b.date DESC, b.start_min`,
    params,
  );
  return rows.map(toBooking);
}

/** Confirmed bookings for one room on one date (used by conflict check and slot grid). */
export async function getConfirmedForRoomDate(
  roomId: string, date: string, db: SQLiteDatabase = getDb(),
): Promise<Booking[]> {
  const rows = await db.getAllAsync<BookingRow>(
    "SELECT * FROM bookings WHERE room_id = ? AND date = ? AND status = 'confirmed' ORDER BY start_min",
    roomId, date,
  );
  return rows.map(toBooking);
}

/** Confirmed bookings of one user on one date, in any room. */
export async function getConfirmedForUserDate(
  userId: string, date: string, db: SQLiteDatabase = getDb(),
): Promise<BookingWithRoom[]> {
  const rows = await db.getAllAsync<BookingRow>(
    `${SELECT_JOINED} WHERE b.user_id = ? AND b.date = ? AND b.status = 'confirmed'`,
    userId, date,
  );
  return rows.map(toBooking);
}

/** All confirmed bookings on a date, every room. Used for "free now" and admin stats. */
export async function getConfirmedForDate(date: string): Promise<BookingWithRoom[]> {
  const rows = await getDb().getAllAsync<BookingRow>(
    `${SELECT_JOINED} WHERE b.date = ? AND b.status = 'confirmed' ORDER BY b.start_min`,
    date,
  );
  return rows.map(toBooking);
}

export async function getConfirmedBetween(from: string, to: string): Promise<BookingWithRoom[]> {
  const rows = await getDb().getAllAsync<BookingRow>(
    `${SELECT_JOINED} WHERE b.date BETWEEN ? AND ? AND b.status = 'confirmed'`,
    from, to,
  );
  return rows.map(toBooking);
}

/** IDs already used on a date — the booking-ID generator picks the next sequence number. */
export async function getIdsForDate(date: string, db: SQLiteDatabase = getDb()): Promise<string[]> {
  const compact = date.replace(/-/g, '');
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM bookings WHERE id LIKE ?', `RB-${compact}-%`);
  return rows.map((r) => r.id);
}

export async function insertBooking(b: Booking, db: SQLiteDatabase = getDb()): Promise<void> {
  await db.runAsync(
    `INSERT INTO bookings (id, room_id, user_id, date, start_min, end_min, purpose, attendees, status, created_at, cancelled_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    b.id, b.roomId, b.userId, b.date, b.startMin, b.endMin, b.purpose, b.attendees,
    b.status, b.createdAt, b.cancelledAt,
  );
}

export async function markCancelled(id: string): Promise<void> {
  await getDb().runAsync(
    "UPDATE bookings SET status = 'cancelled', cancelled_at = ? WHERE id = ?",
    new Date().toISOString(), id,
  );
}

/** Upcoming confirmed bookings for a room (blocks deleting it). */
export async function countUpcomingForRoom(roomId: string, today: string, nowMinutes: number): Promise<number> {
  const row = await getDb().getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM bookings
     WHERE room_id = ? AND status = 'confirmed' AND (date > ? OR (date = ? AND end_min > ?))`,
    roomId, today, today, nowMinutes,
  );
  return row?.n ?? 0;
}
