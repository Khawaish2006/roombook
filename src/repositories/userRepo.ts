import { getDb } from '../db/database';
import { User } from '../models';

export async function findUserByEmail(email: string): Promise<User | null> {
  return getDb().getFirstAsync<User>(
    'SELECT id, name, email, role FROM users WHERE LOWER(email) = LOWER(?)',
    email.trim(),
  );
}

export async function findUserById(id: string): Promise<User | null> {
  return getDb().getFirstAsync<User>('SELECT id, name, email, role FROM users WHERE id = ?', id);
}
