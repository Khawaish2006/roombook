// Sign in / sign up against the local users table.
import * as Crypto from 'expo-crypto';
import { User } from '../models';
import { findUserByEmail, findUserById, getCredentials, insertUser } from '../repositories/userRepo';
import { FieldErrors, normalizeEmail, SignUpInput, validateSignIn, validateSignUp } from './authRules';
import { hashPassword, newSalt } from './passwordHasher';

export type SignInResult = { ok: true; user: User } | { ok: false; error: string };
export type SignUpResult = { ok: true; user: User } | { ok: false; errors: FieldErrors };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const invalid = validateSignIn(email, password);
  if (invalid) return { ok: false, error: invalid };

  const creds = await getCredentials(normalizeEmail(email));
  // Same message for "no such email" and "wrong password" so accounts can't be probed.
  const wrong = { ok: false as const, error: 'Incorrect email or password.' };
  if (!creds) return wrong;
  if ((await hashPassword(password, creds.salt)) !== creds.password_hash) return wrong;

  const user = await findUserById(creds.id);
  return user ? { ok: true, user } : wrong;
}

/** New accounts are always students. Admins exist only in the seed data. */
export async function signUp(input: SignUpInput): Promise<SignUpResult> {
  const errors = validateSignUp(input);
  if (Object.keys(errors).length) return { ok: false, errors };

  const email = normalizeEmail(input.email);
  if (await findUserByEmail(email)) {
    return { ok: false, errors: { email: 'An account with this email already exists. Sign in instead.' } };
  }

  const user: User = { id: `u-${Crypto.randomUUID().slice(0, 8)}`, name: input.name.trim(), email, role: 'student' };
  const salt = newSalt();
  await insertUser(user, await hashPassword(input.password, salt), salt);
  return { ok: true, user };
}
