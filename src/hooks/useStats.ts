// ViewModel for the Activity screen: local stats + AI insight with template fallback.
import { useCallback, useEffect, useState } from 'react';
import { generateUsageInsight, templateInsight } from '../ai/usageInsight';
import { getBookingsForUser, getConfirmedBetween } from '../repositories/bookingRepo';
import { searchRooms } from '../repositories/roomRepo';
import { computeUserStats, UserStats } from '../services/statsService';
import { isFreeAt } from '../services/slotService';
import { addDays, todayStr } from '../utils/time';
import { useFocusData } from './useFocusData';

/** Study rooms that were rarely booked during the student's preferred window over the last 2 weeks. */
async function usuallyFreeRooms(stats: UserStats): Promise<string[]> {
  if (!stats.preferredWindow) return [];
  const { startMin, endMin } = stats.preferredWindow;
  const today = todayStr();
  const recent = await getConfirmedBetween(addDays(today, -14), addDays(today, 7));
  const rooms = await searchRooms({ types: ['study_room'] });
  return rooms
    .map((r) => ({ name: r.name, busy: recent.filter((b) => b.roomId === r.id && !isFreeAt([b], startMin, endMin)).length }))
    .sort((a, b) => a.busy - b.busy)
    .slice(0, 2)
    .map((r) => r.name.replace('Study Room ', ''));
}

export function useStats(userId: string) {
  const query = useFocusData(async () => {
    const stats = computeUserStats(await getBookingsForUser(userId));
    const freeAlternatives = await usuallyFreeRooms(stats);
    return { stats, freeAlternatives };
  }, [userId]);

  const [insight, setInsight] = useState<string | null>(null);
  const [insightIsAI, setInsightIsAI] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);

  const loadInsight = useCallback(async () => {
    if (!query.data) return;
    const { stats, freeAlternatives } = query.data;
    setInsightLoading(true);
    try {
      setInsight(await generateUsageInsight(stats, freeAlternatives));
      setInsightIsAI(true);
    } catch {
      // Graceful degradation: same numbers, template sentence.
      setInsight(templateInsight(stats, freeAlternatives));
      setInsightIsAI(false);
    } finally {
      setInsightLoading(false);
    }
  }, [query.data]);

  useEffect(() => {
    if (query.data && insight === null) loadInsight();
  }, [query.data, insight, loadInsight]);

  return { ...query, insight, insightIsAI, insightLoading, refreshInsight: loadInsight };
}
