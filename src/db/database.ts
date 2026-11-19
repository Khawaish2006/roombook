// Opens the SQLite database, creates tables and seeds demo data on first launch.
import * as SQLite from 'expo-sqlite';
import { DROP_SQL, SCHEMA_SQL } from './schema';
import { seedDatabase } from './seed';

/**
 * Bump this whenever the schema or seed data changes. Phones with an older
 * database are wiped and re-seeded automatically (it's demo data only).
 * v1: first version · v2: passwords + team accounts
 */
const DB_VERSION = 2;

let db: SQLite.SQLiteDatabase | null = null;

/** Lazily opens the database so plain unit tests never touch native code. */
export function getDb(): SQLite.SQLiteDatabase {
  if (!db) db = SQLite.openDatabaseSync('roombook.db');
  return db;
}

/** Called once from the root layout before any screen renders. */
export async function initDatabase(): Promise<void> {
  // Open asynchronously first: in the browser, SQLite runs in a web worker that
  // must finish loading before any query. (On phones this is just as fast.)
  if (!db) db = await SQLite.openDatabaseAsync('roombook.db');
  const database = db;
  const row = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((row?.user_version ?? 0) < DB_VERSION) {
    await resetDatabase();
    return;
  }
  await database.execAsync(SCHEMA_SQL);
}

/** Profile → "Reset demo data". Drops everything and re-seeds. */
export async function resetDatabase(): Promise<void> {
  const database = getDb();
  await database.execAsync(DROP_SQL);
  await database.execAsync(SCHEMA_SQL);
  await seedDatabase(database);
  await database.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}
