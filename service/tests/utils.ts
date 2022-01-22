import { randomBytes } from 'crypto';

export function generateRandomString(length = 10) {
  return randomBytes(length / 2).toString('hex');
}
