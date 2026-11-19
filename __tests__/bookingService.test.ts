import {
  BookingValidationError,
  checkConflict,
  generateBookingId,
  isOverlapping,
  validateBookingRequest,
} from '../src/services/bookingRules';
import { deriveStatus, isStartingSoon } from '../src/services/statusService';
import { Booking, Room } from '../src/models';

const H = (h: number) => h * 60; // hours → minutes

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'RB-20260915-001',
    roomId: 'A-204',
    userId: 'u1',
    date: '2026-09-15',
    startMin: H(15),
    endMin: H(16),
    purpose: null,
    attendees: null,
    status: 'confirmed',
    createdAt: '2026-09-01T00:00:00Z',
    cancelledAt: null,
    ...overrides,
  };
}

describe('isOverlapping', () => {
  it('back-to-back bookings (3–4 and 4–5) do NOT conflict', () => {
    expect(isOverlapping(H(15), H(16), H(16), H(17))).toBe(false);
    expect(isOverlapping(H(16), H(17), H(15), H(16))).toBe(false);
  });
  it('partial overlap (3–4 vs 3:30–4:30) conflicts', () => {
    expect(isOverlapping(H(15), H(16), H(15) + 30, H(16) + 30)).toBe(true);
  });
  it('containment (2–5 vs 3–4) conflicts both ways', () => {
    expect(isOverlapping(H(14), H(17), H(15), H(16))).toBe(true);
    expect(isOverlapping(H(15), H(16), H(14), H(17))).toBe(true);
  });
  it('identical ranges conflict', () => {
    expect(isOverlapping(H(15), H(16), H(15), H(16))).toBe(true);
  });
});

describe('checkConflict', () => {
  const existing = [booking()];

  it('detects a clash in the same room and date', () => {
    expect(checkConflict(existing, 'A-204', '2026-09-15', H(15) + 30, H(16) + 30)?.id).toBe('RB-20260915-001');
  });
  it('allows a back-to-back booking', () => {
    expect(checkConflict(existing, 'A-204', '2026-09-15', H(16), H(17))).toBeNull();
  });
  it('ignores a different room', () => {
    expect(checkConflict(existing, 'A-205', '2026-09-15', H(15), H(16))).toBeNull();
  });
  it('ignores a different date', () => {
    expect(checkConflict(existing, 'A-204', '2026-09-16', H(15), H(16))).toBeNull();
  });
  it('ignores cancelled bookings', () => {
    expect(checkConflict([booking({ status: 'cancelled' })], 'A-204', '2026-09-15', H(15), H(16))).toBeNull();
  });
});

describe('generateBookingId', () => {
  it('starts at 001 for a new day', () => {
    expect(generateBookingId('2026-09-15', [])).toBe('RB-20260915-001');
  });
  it('increments the per-day sequence with zero padding', () => {
    expect(generateBookingId('2026-09-15', ['RB-20260915-001', 'RB-20260915-002'])).toBe('RB-20260915-003');
    const many = Array.from({ length: 23 }, (_, i) => `RB-20260915-${String(i + 1).padStart(3, '0')}`);
    expect(generateBookingId('2026-09-15', many)).toBe('RB-20260915-024');
  });
  it('ignores IDs from other days and stays unique after gaps', () => {
    expect(generateBookingId('2026-09-15', ['RB-20260914-007', 'RB-20260915-004'])).toBe('RB-20260915-005');
  });
});

describe('validateBookingRequest', () => {
  const room: Room = {
    id: 'A-204', name: 'A-204', type: 'classroom', capacity: 25, block: 'A', floor: 2,
    facilities: [], isActive: true, imageKey: null,
  };
  const now = new Date(2026, 8, 15, 10, 0); // 15 Sept 2026, 10:00
  const req = { roomId: 'A-204', userId: 'u1', date: '2026-09-15', startMin: H(15), endMin: H(16) };

  it('accepts a valid request', () => {
    expect(() => validateBookingRequest(req, room, now)).not.toThrow();
  });
  it('rejects start >= end', () => {
    expect(() => validateBookingRequest({ ...req, startMin: H(16), endMin: H(16) }, room, now)).toThrow(BookingValidationError);
    expect(() => validateBookingRequest({ ...req, startMin: H(17), endMin: H(16) }, room, now)).toThrow('Start time must be before end time.');
  });
  it('rejects past times', () => {
    expect(() => validateBookingRequest({ ...req, startMin: H(9), endMin: H(10) }, room, now)).toThrow(/past/);
    expect(() => validateBookingRequest({ ...req, date: '2026-09-14' }, room, now)).toThrow(/past/);
  });
  it('rejects times outside operating hours', () => {
    expect(() => validateBookingRequest({ ...req, startMin: H(17), endMin: H(19) }, room, now)).toThrow(/operating hours/);
  });
  it('rejects inactive rooms', () => {
    expect(() => validateBookingRequest(req, { ...room, isActive: false }, now)).toThrow(/unavailable/);
  });
});

describe('statusService', () => {
  const now = new Date(2026, 8, 15, 14, 30); // 15 Sept 2026, 2:30 PM

  it('derives upcoming / completed / cancelled', () => {
    expect(deriveStatus(booking(), now)).toBe('upcoming'); // 3–4 PM today
    expect(deriveStatus(booking({ startMin: H(12), endMin: H(13) }), now)).toBe('completed');
    expect(deriveStatus(booking({ date: '2026-09-14' }), now)).toBe('completed');
    expect(deriveStatus(booking({ status: 'cancelled' }), now)).toBe('cancelled');
  });
  it('flags bookings starting within the hour', () => {
    expect(isStartingSoon(booking(), now)).toBe(true); // starts in 30 min
    expect(isStartingSoon(booking({ startMin: H(17), endMin: H(18) }), now)).toBe(false);
  });
});
