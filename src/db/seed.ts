// Demo data inserted on first launch (and on "Reset demo data").
// Booking dates are relative to today so the demo always looks populated.
import type { SQLiteDatabase } from 'expo-sqlite';
import { CONFIG } from '../config';
import { Facility, RoomType } from '../models';
import { generateBookingId } from '../services/bookingRules';
import { hashPassword, newSalt } from '../services/passwordHasher';
import { addDays, nowMin, todayStr } from '../utils/time';
import { DEMO_PASSWORD, USERS } from './demoAccounts';

type SeedRoom = [string, string, RoomType, number, string, number, Facility[]];

const ROOMS: SeedRoom[] = [
  // id, name, type, capacity, block, floor, facilities
  ['A-101', 'A-101', 'classroom', 60, 'Academic Block A', 1, ['projector', 'whiteboard', 'wifi', 'ac']],
  ['A-102', 'A-102', 'classroom', 40, 'Academic Block A', 1, ['whiteboard', 'wifi']],
  ['A-103', 'A-103', 'classroom', 30, 'Academic Block A', 1, ['projector', 'whiteboard']],
  ['A-201', 'A-201', 'classroom', 50, 'Academic Block A', 2, ['smart_board', 'wifi', 'ac']],
  ['A-202', 'A-202', 'classroom', 35, 'Academic Block A', 2, ['projector', 'whiteboard', 'wifi']],
  ['A-204', 'A-204', 'classroom', 25, 'Academic Block A', 2, ['projector', 'whiteboard', 'wifi', 'ac']],
  ['A-301', 'A-301', 'classroom', 70, 'Academic Block A', 3, ['projector', 'mic', 'wifi', 'ac']],
  ['B-101', 'B-101', 'classroom', 45, 'Academic Block B', 1, ['projector', 'whiteboard', 'wifi']],
  ['B-102', 'B-102', 'classroom', 20, 'Academic Block B', 1, ['whiteboard']],
  ['B-201', 'B-201', 'classroom', 55, 'Academic Block B', 2, ['smart_board', 'projector', 'ac', 'wifi']],
  ['S-01', 'Study Room S-01', 'study_room', 4, 'Library', 1, ['whiteboard', 'wifi']],
  ['S-02', 'Study Room S-02', 'study_room', 6, 'Library', 1, ['whiteboard', 'wifi', 'ac']],
  ['S-03', 'Study Room S-03', 'study_room', 8, 'Library', 2, ['whiteboard', 'smart_board', 'wifi']],
  ['S-04', 'Study Room S-04', 'study_room', 10, 'Library', 2, ['projector', 'whiteboard', 'wifi', 'ac']],
  ['SH-1', 'Seminar Hall 1', 'seminar_hall', 80, 'Admin Block', 0, ['projector', 'mic', 'ac', 'wifi']],
  ['SH-2', 'Seminar Hall 2', 'seminar_hall', 120, 'Admin Block', 1, ['projector', 'mic', 'ac', 'wifi', 'smart_board']],
  ['LAB-1', 'Lab-1', 'lab', 40, 'Tech Block', 1, ['computers', 'projector', 'ac', 'wifi']],
  ['LAB-2', 'Lab-2', 'lab', 40, 'Tech Block', 2, ['computers', 'smart_board', 'ac', 'wifi']],
];

// [dayOffset, roomId, userId, startHour, endHour, purpose, cancelled?]
type SeedBooking = [number, string, string, number, number, string, boolean?];

const BOOKINGS: SeedBooking[] = [
  // Past two weeks: gives Completed / Cancelled history and activity stats.
  [-14, 'A-204', 'u1', 14, 16, 'Group study'],
  [-13, 'S-02', 'u1', 10, 11, 'Project meeting'],
  [-12, 'LAB-1', 'u3', 11, 13, 'Project meeting'],
  [-11, 'A-204', 'u1', 15, 17, 'Group study'],
  [-10, 'SH-1', 'u2', 9, 11, 'Club activity'],
  [-9, 'S-03', 'u1', 13, 14, 'Presentation practice', true],
  [-7, 'A-204', 'u1', 14, 15, 'Group study'],
  [-7, 'B-101', 'u3', 10, 12, 'Group study'],
  [-6, 'S-01', 'u1', 16, 17, 'Group study'],
  [-5, 'LAB-2', 'u1', 11, 12, 'Project meeting', true],
  [-4, 'A-204', 'u1', 15, 16, 'Group study'],
  [-4, 'S-04', 'u2', 14, 16, 'Presentation practice'],
  [-3, 'A-102', 'u2', 9, 10, 'Group study'],
  [-2, 'S-02', 'u1', 14, 16, 'Group study'],
  [-1, 'SH-2', 'u3', 12, 14, 'Club activity'],
  // Today (other students, so availability looks real).
  [0, 'A-204', 'u2', 15, 16, 'Group study'],
  [0, 'S-02', 'u2', 10, 12, 'Project meeting'],
  [0, 'LAB-1', 'u3', 13, 15, 'Project meeting'],
  // Next 7 days.
  [1, 'A-204', 'u1', 15, 16, 'Group study'],
  [1, 'S-03', 'u2', 10, 11, 'Group study'],
  [2, 'SH-1', 'u3', 14, 17, 'Club activity'],
  [3, 'LAB-2', 'u1', 11, 13, 'Project meeting'],
  [3, 'S-04', 'u2', 9, 10, 'Group study', true],
  [5, 'A-301', 'u3', 12, 13, 'Presentation practice'],
  [6, 'S-01', 'u1', 14, 15, 'Group study'],
];

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  const today = todayStr();
  const nowIso = new Date().toISOString();

  // Hash outside the transaction (crypto is async native work, not SQL).
  const hashed = await Promise.all(
    USERS.map(async (u) => {
      const salt = newSalt();
      return { ...u, salt, hash: await hashPassword(DEMO_PASSWORD, salt) };
    }),
  );

  await db.withTransactionAsync(async () => {
    for (const u of hashed) {
      await db.runAsync(
        'INSERT INTO users (id, name, email, role, password_hash, salt) VALUES (?, ?, ?, ?, ?, ?)',
        u.id, u.name, u.email, u.role, u.hash, u.salt,
      );
    }

    for (const [id, name, type, capacity, block, floor, facilities] of ROOMS) {
      await db.runAsync(
        `INSERT INTO rooms (id, name, type, capacity, block, floor, facilities, is_active, image_key)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        id, name, type, capacity, block, floor, JSON.stringify(facilities), type,
      );
    }

    // Give Khushi one upcoming booking later today if there is still time, so the
    // "Next booking" card and reminders can be demoed immediately.
    const nextHour = Math.ceil((nowMin() + 1) / 60);
    const extra: SeedBooking[] =
      nextHour * 60 + 60 <= CONFIG.dayEndMin && nextHour * 60 >= CONFIG.dayStartMin
        ? [[0, 'S-03', 'u1', nextHour, nextHour + 1, 'Group study']]
        : [];

    const usedIds: string[] = [];
    for (const [offset, roomId, userId, sh, eh, purpose, cancelled] of [...BOOKINGS, ...extra]) {
      const date = addDays(today, offset);
      const id = generateBookingId(date, usedIds);
      usedIds.push(id);
      await db.runAsync(
        `INSERT INTO bookings (id, room_id, user_id, date, start_min, end_min, purpose, attendees, status, created_at, cancelled_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, roomId, userId, date, sh * 60, eh * 60, purpose, 4,
        cancelled ? 'cancelled' : 'confirmed', nowIso, cancelled ? nowIso : null,
      );
    }

    await db.runAsync('INSERT INTO favorites (user_id, room_id) VALUES (?, ?)', 'u1', 'A-204');
    await db.runAsync('INSERT INTO favorites (user_id, room_id) VALUES (?, ?)', 'u1', 'S-02');
  });
}
