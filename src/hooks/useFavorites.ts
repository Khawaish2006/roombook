// ViewModel for favourites. Keeps an in-memory Set so ❤️ toggles feel instant.
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { addFavorite, getFavoriteRoomIds, removeFavorite } from '../repositories/favoriteRepo';
import { useAuth } from './useAuth';

export function useFavorites() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    if (user) setIds(new Set(await getFavoriteRoomIds(user.id)));
  }, [user]);

  useEffect(() => { reload(); }, [reload]);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const toggle = useCallback(
    async (roomId: string) => {
      if (!user) return;
      const isFav = ids.has(roomId);
      // Optimistic update, then persist.
      setIds((prev) => {
        const next = new Set(prev);
        isFav ? next.delete(roomId) : next.add(roomId);
        return next;
      });
      isFav ? await removeFavorite(user.id, roomId) : await addFavorite(user.id, roomId);
    },
    [ids, user],
  );

  return { ids, isFavorite: (id: string) => ids.has(id), toggle, reload };
}
