import bcrypt from 'bcryptjs';
import { config } from '../config/env';

/**
 * Hash a plaintext password using bcrypt with salt rounds configured in env.
 * Never store plaintext passwords in the database.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);
}

/**
 * Securely compare a candidate plaintext password against an existing bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
