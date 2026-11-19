// Central place for values the team may want to tweak during the demo.
export const CONFIG = {
  /** Operating hours, in minutes from midnight. 9:00 AM – 6:00 PM. */
  dayStartMin: 9 * 60,
  dayEndMin: 18 * 60,
  /** Length of one bookable slot in minutes. */
  slotLengthMin: 60,
  /** How many days ahead a student may book. */
  bookingWindowDays: 30,
  /** Default reminder offset before a booking starts. */
  defaultReminderMin: 30,
  /** A booking is "starting soon" when it begins within this many minutes. */
  startingSoonMin: 60,

  /** Gemini model used for all AI features. Change here if Google renames it. */
  geminiModel: 'gemini-2.5-flash',
  /** Give up on an AI call after this long and use the fallback. */
  aiTimeoutMs: 8000,
};
