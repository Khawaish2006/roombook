// Usage statistics computed locally from bookings. Pure functions.
import { CONFIG } from '../config';
import { BookingWithRoom, Room } from '../models';
import { parseDateStr, todayStr, WEEKDAYS } from '../utils/time';
import { deriveStatus } from './statusService';

export interface UserStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  mostUsedRoom: string | null;
  mostUsedRoomCount: number;
  /** Best 3-hour window, e.g. { startMin: 840, endMin: 1020 } for 2–5 PM. */
  preferredWindow: { startMin: number; endMin: number } | null;
  favouriteDay: string | null;
  /** Booking counts Mon..Sat. */
  byWeekday: { day: string; count: number }[];
  hoursThisMonth: number;
}

export function computeUserStats(bookings: BookingWithRoom[], now: Date = new Date()): UserStats {
  const statuses = bookings.map((b) => deriveStatus(b, now));
  const active = bookings.filter((b) => b.status === 'confirmed');

  // Most used room
  const roomCounts = new Map<string, number>();
  active.forEach((b) => roomCounts.set(b.roomName, (roomCounts.get(b.roomName) ?? 0) + 1));
  let mostUsedRoom: string | null = null;
  let mostUsedRoomCount = 0;
  roomCounts.forEach((count, name) => {
    if (count > mostUsedRoomCount) { mostUsedRoom = name; mostUsedRoomCount = count; }
  });

  // Preferred 3-hour window: the window containing the most booking start times.
  let preferredWindow: UserStats['preferredWindow'] = null;
  let bestCount = 0;
  for (let s = CONFIG.dayStartMin; s + 180 <= CONFIG.dayEndMin; s += 60) {
    const count = active.filter((b) => b.startMin >= s && b.startMin < s + 180).length;
    if (count > bestCount) { bestCount = count; preferredWindow = { startMin: s, endMin: s + 180 }; }
  }

  // Weekday histogram (Mon–Sat)
  const dayCounts = new Array(7).fill(0);
  active.forEach((b) => dayCounts[parseDateStr(b.date).getDay()]++);
  const byWeekday = [1, 2, 3, 4, 5, 6].map((d) => ({ day: WEEKDAYS[d], count: dayCounts[d] }));
  const maxDay = byWeekday.reduce((a, b) => (b.count > a.count ? b : a), byWeekday[0]);

  // Hours booked this month
  const monthPrefix = todayStr(now).slice(0, 7);
  const minutes = active.filter((b) => b.date.startsWith(monthPrefix)).reduce((sum, b) => sum + (b.endMin - b.startMin), 0);

  return {
    total: bookings.length,
    upcoming: statuses.filter((s) => s === 'upcoming').length,
    completed: statuses.filter((s) => s === 'completed').length,
    cancelled: statuses.filter((s) => s === 'cancelled').length,
    mostUsedRoom,
    mostUsedRoomCount,
    preferredWindow,
    favouriteDay: maxDay.count > 0 ? maxDay.day : null,
    byWeekday,
    hoursThisMonth: Math.round((minutes / 60) * 10) / 10,
  };
}

/** Admin: share of operating minutes booked across all active rooms today (0–100). */
export function computeUtilisation(activeRooms: Room[], todaysBookings: BookingWithRoom[]): number {
  const activeIds = new Set(activeRooms.map((r) => r.id));
  const capacityMin = activeRooms.length * (CONFIG.dayEndMin - CONFIG.dayStartMin);
  if (capacityMin === 0) return 0;
  const bookedMin = todaysBookings
    .filter((b) => activeIds.has(b.roomId))
    .reduce((sum, b) => sum + (b.endMin - b.startMin), 0);
  return Math.round((bookedMin / capacityMin) * 100);
}

/** Admin: most booked rooms in a set of bookings. */
export function topRooms(bookings: BookingWithRoom[], limit = 5): { roomName: string; count: number }[] {
  const counts = new Map<string, number>();
  bookings.forEach((b) => counts.set(b.roomName, (counts.get(b.roomName) ?? 0) + 1));
  return [...counts.entries()]
    .map(([roomName, count]) => ({ roomName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
