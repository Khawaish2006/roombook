// AI Usage Insight (§6.2). Only aggregated numbers are sent. No names, emails or IDs.
import { UserStats } from '../services/statsService';
import { formatRange } from '../utils/time';
import { askGemini } from './gemini';

/** Privacy: strip everything except counts and patterns. */
function toAggregate(stats: UserStats, freeAlternatives: string[]) {
  return {
    totalBookings: stats.total,
    upcoming: stats.upcoming,
    completed: stats.completed,
    cancelled: stats.cancelled,
    mostUsedSpace: stats.mostUsedRoom,
    preferredTime: stats.preferredWindow ? formatRange(stats.preferredWindow.startMin, stats.preferredWindow.endMin) : null,
    favouriteDay: stats.favouriteDay,
    bookingsByWeekday: Object.fromEntries(stats.byWeekday.map((d) => [d.day, d.count])),
    hoursBookedThisMonth: stats.hoursThisMonth,
    roomsUsuallyFreeAtPreferredTime: freeAlternatives,
  };
}

/** Non-AI fallback built from the same numbers. Always works offline. */
export function templateInsight(stats: UserStats, freeAlternatives: string[] = []): string {
  if (stats.total === 0) return 'No bookings yet. Book your first space and your usage patterns will show up here.';
  const parts: string[] = [];
  if (stats.favouriteDay && stats.preferredWindow) {
    parts.push(
      `You book most often on ${stats.favouriteDay}s between ${formatRange(stats.preferredWindow.startMin, stats.preferredWindow.endMin)}.`,
    );
  }
  if (stats.mostUsedRoom) parts.push(`Your go-to space is ${stats.mostUsedRoom} (${stats.mostUsedRoomCount} bookings).`);
  if (freeAlternatives.length) parts.push(`${freeAlternatives.slice(0, 2).join(' and ')} are usually free at that time if it's taken.`);
  if (stats.cancelled > 0 && stats.cancelled / stats.total > 0.25) {
    parts.push('You cancel fairly often. Cancelling early frees the slot for others.');
  }
  return parts.join(' ');
}

export async function generateUsageInsight(stats: UserStats, freeAlternatives: string[]): Promise<string> {
  const prompt = `You are a friendly campus assistant inside a room-booking app.
Here are a student's aggregated booking statistics as JSON:
${JSON.stringify(toAggregate(stats, freeAlternatives))}

Write 2–3 short, friendly sentences (max 60 words total) giving a useful insight about their habits
and one practical tip. Address the student as "you". Plain text only, no markdown, no lists.`;
  const text = await askGemini(prompt, { temperature: 0.6 });
  return text.trim().replace(/\*\*/g, '');
}
