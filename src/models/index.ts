// Plain TypeScript types shared across every layer.

export type Role = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type RoomType = 'classroom' | 'study_room' | 'seminar_hall' | 'lab';

export const ROOM_TYPES: RoomType[] = ['study_room', 'classroom', 'seminar_hall', 'lab'];

export type Facility =
  | 'projector'
  | 'whiteboard'
  | 'wifi'
  | 'ac'
  | 'computers'
  | 'smart_board'
  | 'mic';

export const FACILITIES: Facility[] = [
  'projector',
  'whiteboard',
  'wifi',
  'ac',
  'computers',
  'smart_board',
  'mic',
];

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  capacity: number;
  block: string;
  floor: number | null;
  facilities: Facility[];
  isActive: boolean;
  imageKey: string | null;
}

export type StoredBookingStatus = 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  date: string; // 'YYYY-MM-DD'
  startMin: number; // minutes from midnight
  endMin: number;
  purpose: string | null;
  attendees: number | null;
  status: StoredBookingStatus;
  createdAt: string;
  cancelledAt: string | null;
}

/** A booking joined with the room and user names, used by list screens. */
export interface BookingWithRoom extends Booking {
  roomName: string;
  roomType: RoomType;
  userName: string;
}

/** Status shown to users. Derived, never stored. */
export type DisplayStatus = 'upcoming' | 'completed' | 'cancelled';

/** Filters used by Explore (manual and AI). */
export interface RoomFilters {
  text?: string;
  types?: RoomType[];
  minCapacity?: number;
  facilities?: Facility[];
  /** When set, only rooms free for this whole range on this date are kept. */
  date?: string;
  startMin?: number;
  endMin?: number;
  includeInactive?: boolean;
}

export const PURPOSES = [
  'Group study',
  'Project meeting',
  'Presentation practice',
  'Club activity',
  'Other',
];
