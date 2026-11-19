import { getDb } from '../db/database';
import { Role, User } from '../models';

const PUBLIC_COLUMNS = 'id, name, email, role';

export async function findUserByEmail(email: string): Promise<User | null> {
  return getDb().getFirstAsync<User>(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE email = ?`, email);
}

export async function findUserById(id: string): Promise<User | null> {
  return getDb().getFirstAsync<User>(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`, id);
}

/** Only used by authService to check a password. Never shown in the UI. */
export async function getCredentials(email: string): Promise<{ id: string; password_hash: string; salt: string } | null> {
  return getDb().getFirstAsync('SELECT id, password_hash, salt FROM users WHERE email = ?', email);
}

export async function insertUser(u: User & { role: Role }, passwordHash: string, salt: string): Promise<void> {
  await getDb().runAsync(
    'INSERT INTO users (id, name, email, role, password_hash, salt) VALUES (?, ?, ?, ?, ?, ?)',
    u.id, u.name, u.email, u.role, passwordHash, salt,
  );
}
