// CREATE TABLE statements. Dates are TEXT 'YYYY-MM-DD', times are INTEGER minutes from midnight.

export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student','admin')),
  password_hash TEXT NOT NULL,       -- SHA-256(salt + password), never the plain password
  salt TEXT NOT NULL                 -- random per user
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('classroom','study_room','seminar_hall','lab')),
  capacity INTEGER NOT NULL,
  block TEXT NOT NULL,
  floor INTEGER,
  facilities TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  image_key TEXT
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  start_min INTEGER NOT NULL,
  end_min INTEGER NOT NULL,
  purpose TEXT,
  attendees INTEGER,
  status TEXT NOT NULL CHECK (status IN ('confirmed','cancelled')),
  created_at TEXT NOT NULL,
  cancelled_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_bookings_room_date ON bookings(room_id, date);

CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL REFERENCES users(id),
  room_id TEXT NOT NULL REFERENCES rooms(id),
  PRIMARY KEY (user_id, room_id)
);
`;

export const DROP_SQL = `
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;
`;
