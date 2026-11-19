// Password hashing. We store SHA-256(salt + password) and a random salt per user,
// never the plain password. (A production server would use bcrypt/argon2; for an
// offline, on-device demo, salted SHA-256 via expo-crypto is a reasonable choice.)
import * as Crypto from 'expo-crypto';

export function newSalt(): string {
  return Crypto.randomUUID();
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, salt + password);
}
