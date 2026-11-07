import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const PREFIX = 'scrypt';

// Stored format: scrypt$<salt base64>$<hash base64>. Only the hash is stored, never the password.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `${PREFIX}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [prefix, saltText, hashText] = stored.split('$');
  if (prefix !== PREFIX || !saltText || !hashText) return false;
  const expected = Buffer.from(hashText, 'base64');
  const actual = await scryptAsync(password, Buffer.from(saltText, 'base64'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Used when the username does not exist, so the answer takes about as long as a wrong password
export const DUMMY_HASH = `${PREFIX}$${Buffer.alloc(16).toString('base64')}$${Buffer.alloc(KEY_LENGTH).toString('base64')}`;
