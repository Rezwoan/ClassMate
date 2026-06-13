import { createHash, randomBytes, randomInt } from 'crypto';

/** SHA-256 hex digest — used for high-entropy tokens (refresh tokens). */
export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/** Cryptographically-random opaque token (hex). */
export function randomToken(bytes = 48): string {
  return randomBytes(bytes).toString('hex');
}

/** Zero-padded numeric one-time code, e.g. "048213". */
export function generateOtpCode(digits = 6): string {
  const max = 10 ** digits;
  return randomInt(0, max).toString().padStart(digits, '0');
}
