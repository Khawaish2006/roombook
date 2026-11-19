// Smart Alternatives (§6.3): a rule-based recommendation heuristic. No ML, no API call.
// When a slot is taken we suggest (a) the same room at the nearest free times and
// (b) similar rooms that are free at the requested time.
import { CONFIG } from '../config';
import { Booking, Room } from '../models';
import { getConfirmedForDate } from '../repositories/bookingRepo';
import { getRoomById, searchRooms } from '../repositories/roomRepo';
import { nowMin, todayStr } from '../utils/time';
import { isFreeAt } from './slotService';

export interface Alternative {
  roomId: string;
  roomName: string;
  date: string;
  startMin: number;
  endMin: number;
  reason: 'same_room' | 'similar_room';
}

/** Nearest free start times (same duration) in the same room on the same day. Pure. */
export function findSameRoomTimes(
  bookings: Booking[],
  date: string,
  requestedStart: number,
  durationMin: number,
  now: Date = new Date(),
  limit = 3,
): { startMin: number; endMin: number }[] {
  const earliest = date === todayStr(now) ? nowMin(now) : 0;
  const options: { startMin: number; endMin: number }[] = [];
  for (let s = CONFIG.dayStartMin; s + durationMin <= CONFIG.dayEndMin; s += CONFIG.slotLengthMin) {
    if (s === requestedStart || s < earliest) continue;
    if (isFreeAt(bookings, s, s + durationMin)) options.push({ startMin: s, endMin: s + durationMin });
  }
  // Closest to what the student originally asked for first.
  options.sort((a, b) => Math.abs(a.startMin - requestedStart) - Math.abs(b.startMin - requestedStart));
  return options.slice(0, limit);
}

/** Rooms of the same type with enough seats and the same facilities. Pure. */
export function isSimilarRoom(candidate: Room, target: Room, minCapacity: number): boolean {
  return (
    candidate.id !== target.id &&
    candidate.isActive &&
    candidate.type === target.type &&
    candidate.capacity >= minCapacity &&
    target.facilities.every((f) => candidate.facilities.includes(f))
  );
}

/** Loads the data and builds up to 3 + 3 suggestions. */
export async function getAlternatives(
  roomId: string,
  date: string,
  startMin: number,
  endMin: number,
  attendees?: number | null,
): Promise<Alternative[]> {
  const target = await getRoomById(roomId);
  if (!target) return [];
  const dayBookings = await getConfirmedForDate(date);
  const byRoom = (id: string) => dayBookings.filter((b) => b.roomId === id);

  const sameRoom: Alternative[] = findSameRoomTimes(byRoom(roomId), date, startMin, endMin - startMin).map((t) => ({
    roomId,
    roomName: target.name,
    date,
    ...t,
    reason: 'same_room',
  }));

  // Relax the facility match if nothing strict is found, so the list is rarely empty.
  const allRooms = await searchRooms({ types: [target.type] });
  const minCap = attendees ?? 1;
  let similar = allRooms.filter((r) => isSimilarRoom(r, target, minCap) && isFreeAt(byRoom(r.id), startMin, endMin));
  if (similar.length === 0) {
    similar = allRooms.filter(
      (r) => r.id !== roomId && r.capacity >= minCap && isFreeAt(byRoom(r.id), startMin, endMin),
    );
  }
  const similarAlts: Alternative[] = similar.slice(0, 3).map((r) => ({
    roomId: r.id,
    roomName: r.name,
    date,
    startMin,
    endMin,
    reason: 'similar_room',
  }));

  return [...sameRoom, ...similarAlts];
}
