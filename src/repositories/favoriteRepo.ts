import { getDb } from '../db/database';

export async function getFavoriteRoomIds(userId: string): Promise<string[]> {
  const rows = await getDb().getAllAsync<{ room_id: string }>(
    'SELECT f.room_id FROM favorites f JOIN rooms r ON r.id = f.room_id WHERE f.user_id = ? AND r.is_active = 1',
    userId,
  );
  return rows.map((r) => r.room_id);
}

export async function addFavorite(userId: string, roomId: string): Promise<void> {
  await getDb().runAsync('INSERT OR IGNORE INTO favorites (user_id, room_id) VALUES (?, ?)', userId, roomId);
}

export async function removeFavorite(userId: string, roomId: string): Promise<void> {
  await getDb().runAsync('DELETE FROM favorites WHERE user_id = ? AND room_id = ?', userId, roomId);
}
