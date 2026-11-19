// All SQL for the rooms table lives here.
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '../db/database';
import { Room, RoomFilters } from '../models';

interface RoomRow {
  id: string;
  name: string;
  type: Room['type'];
  capacity: number;
  block: string;
  floor: number | null;
  facilities: string;
  is_active: number;
  image_key: string | null;
}

function toRoom(r: RoomRow): Room {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    capacity: r.capacity,
    block: r.block,
    floor: r.floor,
    facilities: JSON.parse(r.facilities),
    isActive: r.is_active === 1,
    imageKey: r.image_key,
  };
}

export async function getRoomById(id: string, db: SQLiteDatabase = getDb()): Promise<Room | null> {
  const row = await db.getFirstAsync<RoomRow>('SELECT * FROM rooms WHERE id = ?', id);
  return row ? toRoom(row) : null;
}

/**
 * Text / type / capacity filters run in SQL. Facility filtering runs in JS because
 * facilities are stored as a JSON array. Time-range filtering is done by the caller
 * (useRooms) using the same conflict function as booking.
 */
export async function searchRooms(filters: RoomFilters = {}): Promise<Room[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (!filters.includeInactive) where.push('is_active = 1');
  if (filters.text?.trim()) {
    where.push('(LOWER(name) LIKE ? OR LOWER(id) LIKE ? OR LOWER(block) LIKE ?)');
    const like = `%${filters.text.trim().toLowerCase()}%`;
    params.push(like, like, like);
  }
  if (filters.types?.length) {
    where.push(`type IN (${filters.types.map(() => '?').join(',')})`);
    params.push(...filters.types);
  }
  if (filters.minCapacity) {
    where.push('capacity >= ?');
    params.push(filters.minCapacity);
  }

  const sql = `SELECT * FROM rooms ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY type, id`;
  const rows = await getDb().getAllAsync<RoomRow>(sql, params);
  let rooms = rows.map(toRoom);

  if (filters.facilities?.length) {
    rooms = rooms.filter((r) => filters.facilities!.every((f) => r.facilities.includes(f)));
  }
  return rooms;
}

export async function roomExists(id: string): Promise<boolean> {
  const row = await getDb().getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM rooms WHERE id = ?', id);
  return (row?.n ?? 0) > 0;
}

export async function insertRoom(room: Room): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO rooms (id, name, type, capacity, block, floor, facilities, is_active, image_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    room.id, room.name, room.type, room.capacity, room.block, room.floor,
    JSON.stringify(room.facilities), room.isActive ? 1 : 0, room.type,
  );
}

export async function updateRoom(room: Room): Promise<void> {
  await getDb().runAsync(
    `UPDATE rooms SET name = ?, type = ?, capacity = ?, block = ?, floor = ?, facilities = ?, is_active = ?, image_key = ?
     WHERE id = ?`,
    room.name, room.type, room.capacity, room.block, room.floor,
    JSON.stringify(room.facilities), room.isActive ? 1 : 0, room.type, room.id,
  );
}

export async function setRoomActive(id: string, active: boolean): Promise<void> {
  await getDb().runAsync('UPDATE rooms SET is_active = ? WHERE id = ?', active ? 1 : 0, id);
}

/** Deletes a room together with its past bookings and favorites (FKs are enforced). */
export async function deleteRoom(id: string): Promise<void> {
  const db = getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM favorites WHERE room_id = ?', id);
    await db.runAsync('DELETE FROM bookings WHERE room_id = ?', id);
    await db.runAsync('DELETE FROM rooms WHERE id = ?', id);
  });
}
