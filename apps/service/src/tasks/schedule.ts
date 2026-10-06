import { parseExpression } from 'cron-parser';

/** Throws if the cron expression (5 fields, UTC) is invalid */
export function validateCronExpression(expression: string) {
  parseExpression(expression, { tz: 'UTC' });
}

/** The most recent time the cron expression was scheduled to run, relative to `now` */
export function getLastOccurrence(expression: string, now: Date = new Date()): Date {
  return parseExpression(expression, { currentDate: now, tz: 'UTC' }).prev().toDate();
}
