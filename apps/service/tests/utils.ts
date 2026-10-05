import { UserSessionData } from '@/types/auth';
import { randomBytes } from 'crypto';
import type { TaskId } from '@/consts/tasks';

export function generateRandomString(length = 10) {
  return randomBytes(length / 2).toString('hex');
}

export function generateRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

export function generateUserSessionData(): UserSessionData {
  return {
    provider: 'github',
    name: generateRandomString(),
    auth: {
      token: generateRandomString(),
    },
  };
}

/**
 * A unique task id, so tests don't share state (lease, last success) with each other or with previous runs.
 * Not one of the real tasks, hence the cast.
 */
export function generateRandomTaskId() {
  return generateRandomString(8) as TaskId;
}
