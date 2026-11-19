// ViewModels for rooms: search results, single room with its day timeline, "free now".
import { Booking, Room, RoomFilters } from '../models';
import { getConfirmedForDate, getConfirmedForRoomDate } from '../repositories/bookingRepo';
import { getRoomById, searchRooms } from '../repositories/roomRepo';
import { generateDaySlots, isFreeAt, Slot } from '../services/slotService';
import { nowMin, todayStr } from '../utils/time';
import { useFocusData } from './useFocusData';

/** Room ids with no confirmed booking right now. */
export async function loadFreeNowIds(rooms: Room[]): Promise<Set<string>> {
  const todays = await getConfirmedForDate(todayStr());
  const m = nowMin();
  return new Set(rooms.filter((r) => isFreeAt(todays.filter((b) => b.roomId === r.id), m, m + 1)).map((r) => r.id));
}

/** Applies all filters including the optional "free for this date/time range" filter. */
export async function findRooms(filters: RoomFilters): Promise<Room[]> {
  const rooms = await searchRooms(filters);
  if (filters.date && filters.startMin != null && filters.endMin != null) {
    const dayBookings = await getConfirmedForDate(filters.date);
    return rooms.filter((r) =>
      isFreeAt(dayBookings.filter((b) => b.roomId === r.id), filters.startMin!, filters.endMin!),
    );
  }
  if (filters.date) {
    // Date only ("Available today"): keep rooms with at least one bookable slot left that day.
    const dayBookings = await getConfirmedForDate(filters.date);
    return rooms.filter((r) =>
      generateDaySlots(filters.date!, dayBookings.filter((b) => b.roomId === r.id)).some((s) => s.state === 'available'),
    );
  }
  return rooms;
}

export function useRooms(filters: RoomFilters) {
  return useFocusData(async () => {
    const rooms = await findRooms(filters);
    const freeNow = await loadFreeNowIds(rooms);
    return { rooms, freeNow };
  }, [JSON.stringify(filters)]);
}

export function useRoom(id: string, date: string = todayStr()) {
  return useFocusData(async () => {
    const room = await getRoomById(id);
    const bookings: Booking[] = await getConfirmedForRoomDate(id, date);
    const slots: Slot[] = generateDaySlots(date, bookings);
    return { room, bookings, slots };
  }, [id, date]);
}
