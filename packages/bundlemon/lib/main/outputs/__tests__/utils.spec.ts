import { parseOutput, getSignText, getDiffSizeText, getDiffPercentText } from '../utils';

describe('output utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('parseOutput', () => {
    test('only name', () => {
      const expectedName = 'test';
      const { name, options } = parseOutput(expectedName);

      expect(name).toEqual(expectedName);
      expect(options).toBeUndefined();
    });

    test('array, no options', () => {
      const expectedName = 'test';
      const { name, options } = parseOutput([expectedName, undefined]);

      expect(name).toEqual(expectedName);
      expect(options).toBeUndefined();
    });

    test('array, with options', () => {
      const expectedName = 'test';
      const expectedOptions = {
        op: {
          t: 'aaa',
        },
        check: true,
        n: 100,
      };
      const { name, options } = parseOutput([expectedName, expectedOptions]);

      expect(name).toEqual(expectedName);
      expect(options).toEqual(expectedOptions);
    });
  });

  describe('getSignText', () => {
    test('positive number', () => {
      const sign = getSignText(100);

      expect(sign).toEqual('+');
    });

    test('negative number', () => {
      const sign = getSignText(-8);

      expect(sign).toEqual('');
    });
  });

  describe('getDiffSizeText', () => {
    test('positive number', () => {
      const text = getDiffSizeText(100);

      expect(text).toEqual('+100B');
    });

    test('negative number', () => {
      const text = getDiffSizeText(-7823);

      expect(text).toEqual('-7.64KB');
    });
  });

  describe('getDiffPercentText', () => {
    test('positive number', () => {
      const text = getDiffPercentText(100);

      expect(text).toEqual('+100%');
    });

    test('negative number', () => {
      const text = getDiffPercentText(-42);

      expect(text).toEqual('-42%');
    });

    test('infinity number', () => {
      const text = getDiffPercentText(Infinity);

      expect(text).toEqual('');
    });
  });
});
