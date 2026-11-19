// Opens the SQLite database, creates tables and seeds demo data on first launch.
import * as SQLite from 'expo-sqlite';
import { DROP_SQL, SCHEMA_SQL } from './schema';
import { seedDatabase } from './seed';

let db: SQLite.SQLiteDatabase | null = null;

/** Lazily opens the database so plain unit tests never touch native code. */
export function getDb(): SQLite.SQLiteDatabase {
  if (!db) db = SQLite.openDatabaseSync('roombook.db');
  return db;
}

/** Called once from the root layout before any screen renders. */
export async function initDatabase(): Promise<void> {
  const database = getDb();
  await database.execAsync(SCHEMA_SQL);
  const row = await database.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM users');
  if (!row || row.n === 0) {
    await seedDatabase(database);
  }
}

/** Profile → "Reset demo data". Drops everything and re-seeds. */
export async function resetDatabase(): Promise<void> {
  const database = getDb();
  await database.execAsync(DROP_SQL);
  await database.execAsync(SCHEMA_SQL);
  await seedDatabase(database);
}
