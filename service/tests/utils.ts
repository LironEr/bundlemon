import { randomBytes } from 'crypto';

export function generateRandomString(length = 10) {
  return randomBytes(length).toString('hex');
}
