import { generateDaySlots, isFreeAt, selectionToRange, toggleSlot } from '../src/services/slotService';
import { findSameRoomTimes } from '../src/services/alternativesService';
import { sanitizeParsedQuery } from '../src/ai/parseSearchQuery';
import { Booking } from '../src/models';

const H = (h: number) => h * 60;
const DATE = '2026-09-15';
const morning = new Date(2026, 8, 15, 8, 0); // before opening, nothing is past

function booking(start: number, end: number, status: Booking['status'] = 'confirmed'): Booking {
  return {
    id: 'x', roomId: 'A-204', userId: 'u1', date: DATE, startMin: start, endMin: end,
    purpose: null, attendees: null, status, createdAt: '', cancelledAt: null,
  };
}

describe('generateDaySlots', () => {
  it('creates hourly slots from 9:00 to 18:00', () => {
    const slots = generateDaySlots(DATE, [], morning);
    expect(slots).toHaveLength(9);
    expect(slots[0]).toEqual({ startMin: H(9), endMin: H(10), state: 'available' });
    expect(slots[8].endMin).toBe(H(18));
  });
  it('marks booked slots, ignoring cancelled ones', () => {
    const slots = generateDaySlots(DATE, [booking(H(15), H(17)), booking(H(10), H(11), 'cancelled')], morning);
    const state = (h: number) => slots.find((s) => s.startMin === H(h))!.state;
    expect(state(15)).toBe('booked');
    expect(state(16)).toBe('booked');
    expect(state(17)).toBe('available');
    expect(state(10)).toBe('available');
  });
  it('marks past slots on today', () => {
    const slots = generateDaySlots(DATE, [], new Date(2026, 8, 15, 12, 15));
    expect(slots.find((s) => s.startMin === H(11))!.state).toBe('past');
    expect(slots.find((s) => s.startMin === H(12))!.state).toBe('past'); // started at 12:00
    expect(slots.find((s) => s.startMin === H(13))!.state).toBe('available');
  });
  it('marks every slot past on an earlier date', () => {
    expect(generateDaySlots('2026-09-14', [], morning).every((s) => s.state === 'past')).toBe(true);
  });
});

describe('multi-slot selection', () => {
  const slots = generateDaySlots(DATE, [booking(H(13), H(14))], morning);

  it('extends with consecutive slots', () => {
    let sel = toggleSlot(slots, [], H(15)).selected;
    sel = toggleSlot(slots, sel, H(16)).selected;
    expect(selectionToRange(sel)).toEqual({ startMin: H(15), endMin: H(17) });
  });
  it('blocks non-consecutive selection with a hint', () => {
    const r = toggleSlot(slots, [H(15)], H(17));
    expect(r.selected).toEqual([H(17)]);
    expect(r.hint).toMatch(/consecutive/);
  });
  it('blocks selecting a booked slot', () => {
    const r = toggleSlot(slots, [H(12)], H(13));
    expect(r.selected).toEqual([H(12)]);
    expect(r.hint).toMatch(/booked/);
  });
  it('shrinks from the ends', () => {
    expect(toggleSlot(slots, [H(15), H(16)], H(16)).selected).toEqual([H(15)]);
  });
});

describe('isFreeAt / smart alternatives', () => {
  const day = [booking(H(15), H(16))];
  it('isFreeAt respects back-to-back', () => {
    expect(isFreeAt(day, H(16), H(17))).toBe(true);
    expect(isFreeAt(day, H(15), H(16))).toBe(false);
  });
  it('suggests nearest free times of the same length', () => {
    const alts = findSameRoomTimes(day, DATE, H(15), 60, morning);
    expect(alts.map((a) => a.startMin)).toEqual([H(14), H(16), H(13)]);
  });
});

describe('AI query sanitiser (no network)', () => {
  it('keeps valid fields and drops invalid ones', () => {
    const q = sanitizeParsedQuery(
      { type: 'study_room', minCapacity: 6, facilities: ['whiteboard', 'jacuzzi'], date: '2026-09-16', startMin: 900, endMin: 1020, hack: true },
      '2026-09-15',
    );
    expect(q).toEqual({ type: 'study_room', minCapacity: 6, facilities: ['whiteboard'], date: '2026-09-16', startMin: 900, endMin: 1020, purpose: null });
  });
  it('clamps times and fixes a missing end time', () => {
    const q = sanitizeParsedQuery({ type: 'spaceship', startMin: 300 }, '2026-09-15');
    expect(q.type).toBeNull();
    expect(q.startMin).toBe(H(9));
    expect(q.endMin).toBe(H(10));
    expect(q.date).toBe('2026-09-15');
  });
  it('survives garbage input', () => {
    expect(sanitizeParsedQuery('nonsense', '2026-09-15').facilities).toEqual([]);
  });
});
