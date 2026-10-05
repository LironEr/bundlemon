import { getLastOccurrence, validateCronExpression } from '../schedule';

describe('schedule', () => {
  describe('getLastOccurrence', () => {
    test('weekly', () => {
      // Wednesday
      const now = new Date('2026-10-07T10:00:00Z');

      expect(getLastOccurrence('0 3 * * 0', now)).toEqual(new Date('2026-10-04T03:00:00Z'));
    });

    test('daily, before and after the time of day', () => {
      expect(getLastOccurrence('30 3 * * *', new Date('2026-10-07T03:29:00Z'))).toEqual(
        new Date('2026-10-06T03:30:00Z')
      );
      expect(getLastOccurrence('30 3 * * *', new Date('2026-10-07T03:45:00Z'))).toEqual(
        new Date('2026-10-07T03:30:00Z')
      );
    });

    test('hourly', () => {
      expect(getLastOccurrence('0 * * * *', new Date('2026-10-07T10:20:00Z'))).toEqual(
        new Date('2026-10-07T10:00:00Z')
      );
    });

    test('invalid expression', () => {
      expect(() => getLastOccurrence('not a cron')).toThrow();
    });
  });

  describe('validateCronExpression', () => {
    test('valid', () => {
      expect(() => validateCronExpression('0 3 * * 0')).not.toThrow();
    });

    test('invalid', () => {
      expect(() => validateCronExpression('99 3 * * 0')).toThrow();
    });
  });
});
