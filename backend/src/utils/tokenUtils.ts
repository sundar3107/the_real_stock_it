import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { IJwtPayload } from '../modules/authentication/types/auth.types';

/**
 * Generate a signed JWT bearer token containing user identity and role.
 */
export function generateToken(payload: IJwtPayload): string {
  const options: SignOptions = {
    expiresIn: config.JWT_EXPIRES_IN as any,
  };
  return jwt.sign(payload, config.JWT_SECRET, options);
}

/**
 * Verify a JWT token and decode the payload. Returns null if invalid or expired.
 */
export function verifyToken(token: string): IJwtPayload | null {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as IJwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
