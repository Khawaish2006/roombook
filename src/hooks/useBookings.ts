// ViewModel for a student's bookings, grouped by derived status.
import { BookingWithRoom, DisplayStatus } from '../models';
import { getBookingById, getBookingsForUser } from '../repositories/bookingRepo';
import { getRoomById } from '../repositories/roomRepo';
import { deriveStatus } from '../services/statusService';
import { useFocusData } from './useFocusData';

export function useMyBookings(userId: string) {
  return useFocusData(async () => {
    const all = await getBookingsForUser(userId);
    const groups: Record<DisplayStatus, BookingWithRoom[]> = { upcoming: [], completed: [], cancelled: [] };
    all.forEach((b) => groups[deriveStatus(b)].push(b));
    // Upcoming: soonest first. Others: most recent first (already sorted that way).
    groups.upcoming.sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin);
    return { all, groups, next: groups.upcoming[0] ?? null };
  }, [userId]);
}

export function useBooking(id: string) {
  return useFocusData(async () => {
    const booking = await getBookingById(id);
    const room = booking ? await getRoomById(booking.roomId) : null;
    return { booking, room };
  }, [id]);
}
