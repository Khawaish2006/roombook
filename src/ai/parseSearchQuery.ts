// Smart Search (§6.1): natural language → structured room filters.
// The AI only *interprets* the query. Availability is still checked by our own conflict logic.
import { CONFIG } from '../config';
import { FACILITIES, Facility, ROOM_TYPES, RoomType } from '../models';
import { todayStr, weekdayOf } from '../utils/time';
import { askGeminiJSON } from './gemini';

export interface ParsedQuery {
  type: RoomType | null;
  minCapacity: number | null;
  facilities: Facility[];
  date: string | null;
  startMin: number | null;
  endMin: number | null;
  purpose: string | null;
}

function buildPrompt(query: string, today: string): string {
  return `You convert a student's room-search request into JSON for a campus room booking app.
Today is ${today} (${weekdayOf(today)}). Operating hours are ${CONFIG.dayStartMin / 60}:00 to ${CONFIG.dayEndMin / 60}:00.

Return ONLY a JSON object with exactly these keys:
{
  "type": one of ${JSON.stringify(ROOM_TYPES)} or null,
  "minCapacity": integer or null,
  "facilities": array using only ${JSON.stringify(FACILITIES)},
  "date": "YYYY-MM-DD" or null,
  "startMin": minutes from midnight (e.g. 3 pm = 900) or null,
  "endMin": minutes from midnight or null,
  "purpose": short string or null
}
Rules: "quiet room", "study room", "group study" usually mean study_room. "computer"/"lab" mean lab.
"hall"/"seminar"/"event" mean seminar_hall. If only a start time is given, assume 1 hour.
"tomorrow", weekday names etc. must be resolved to an actual date. Unknown → null.

Request: """${query.replace(/"/g, "'")}"""`;
}

const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Type guard + sanitiser. Drops unknown fields and clamps values so a bad AI answer
 * can never produce an invalid search.
 */
export function sanitizeParsedQuery(raw: unknown, today: string = todayStr()): ParsedQuery {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const type = ROOM_TYPES.includes(o.type as RoomType) ? (o.type as RoomType) : null;
  const minCapacity = isInt(o.minCapacity) && o.minCapacity > 0 ? Math.min(Math.round(o.minCapacity), 500) : null;
  const facilities = Array.isArray(o.facilities)
    ? (o.facilities.filter((f) => FACILITIES.includes(f as Facility)) as Facility[])
    : [];

  let date = typeof o.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.date) ? o.date : null;
  if (date && date < today) date = null; // no searching the past

  const clampTime = (v: unknown) =>
    isInt(v) ? Math.max(CONFIG.dayStartMin, Math.min(CONFIG.dayEndMin, Math.round(v / 30) * 30)) : null;
  let startMin = clampTime(o.startMin);
  let endMin = clampTime(o.endMin);
  if (startMin !== null && (endMin === null || endMin <= startMin)) endMin = Math.min(startMin + 60, CONFIG.dayEndMin);
  if (startMin === null) endMin = null;
  if (startMin !== null && startMin >= CONFIG.dayEndMin) { startMin = null; endMin = null; }
  if (startMin !== null && !date) date = today;

  const purpose = typeof o.purpose === 'string' && o.purpose.trim() ? o.purpose.trim().slice(0, 40) : null;

  return { type, minCapacity, facilities, date, startMin, endMin, purpose };
}

/** Throws AIUnavailableError on any failure; the Explore screen falls back to manual filters. */
export async function parseSearchQuery(query: string): Promise<ParsedQuery> {
  const today = todayStr();
  const raw = await askGeminiJSON(buildPrompt(query, today));
  return sanitizeParsedQuery(raw, today);
}
