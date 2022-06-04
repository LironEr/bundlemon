import { calcDiffFiles } from '..';
import { Status, DiffChange, FailReason, Compression } from '../../consts';

type CalcDiffFilesResult = ReturnType<typeof calcDiffFiles>;

describe('diff report', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('calcDiffFiles', () => {
    test('empty files', () => {
      const result = calcDiffFiles([], []);

      const expectedResult: CalcDiffFilesResult = {
        files: [],
        stats: {
          currBranchSize: 0,
          baseBranchSize: 0,
          diff: {
            bytes: 0,
            percent: 0,
          },
        },
        status: Status.Pass,
      };

      expect(result).toEqual(expectedResult);
    });

    test('empty files, base files undefined', () => {
      const result = calcDiffFiles([], undefined);

      const expectedResult: CalcDiffFilesResult = {
        files: [],
        stats: {
          currBranchSize: 0,
          baseBranchSize: 0,
          diff: {
            bytes: 0,
            percent: 0,
          },
        },
        status: Status.Pass,
      };

      expect(result).toEqual(expectedResult);
    });

    test('no base files', () => {
      const result = calcDiffFiles(
        [
          { pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 2000 },
          {
            friendlyName: 'main HTML',
            pattern: 'index.html',
            compression: Compression.Gzip,
            path: 'index.html',
            size: 500,
          },
        ],
        undefined
      );

      const expectedResult: CalcDiffFilesResult = {
        files: [
          {
            pattern: 'bundle.js',
            compression: Compression.Gzip,
            path: 'bundle.js',
            size: 2000,
            maxSize: undefined,
            diff: {
              bytes: 2000,
              percent: Infinity,
              change: DiffChange.Add,
            },
            status: Status.Pass,
          },
          {
            friendlyName: 'main HTML',
            pattern: 'index.html',
            compression: Compression.Gzip,
            path: 'index.html',
            size: 500,
            maxSize: undefined,
            diff: {
              bytes: 500,
              percent: Infinity,
              change: DiffChange.Add,
            },
            status: Status.Pass,
          },
        ],
        stats: {
          currBranchSize: 2500,
          baseBranchSize: 0,
          diff: {
            bytes: 2500,
            percent: Infinity,
          },
        },
        status: Status.Pass,
      };

      expect(result).toEqual(expectedResult);
    });

    test('diff from base', () => {
      const result = calcDiffFiles(
        [
          { pattern: '*.js', compression: Compression.Gzip, path: 'bundle.js', size: 2000 },
          {
            friendlyName: 'main HTML',
            pattern: 'index.html',
            compression: Compression.Gzip,
            path: 'index.html',
            size: 4500,
          },
          { pattern: '*.js', compression: Compression.Gzip, path: 'bundle2.js', size: 5000 },
          { pattern: '*.js', compression: Compression.Gzip, path: 'bundle4.js', size: 1000 },
        ],
        [
          { pattern: '*.js', compression: Compression.Gzip, path: 'bundle.js', size: 1000 },
          {
            friendlyName: 'main HTML',
            pattern: 'index.html',
            compression: Compression.Gzip,
            path: 'index.html',
            size: 5000,
          },
          { pattern: '*.js', compression: Compression.Gzip, path: 'bundle3.js', size: 3000 },
          { pattern: '*.js', compression: Compression.Gzip, path: 'bundle4.js', size: 1000 },
        ]
      );

      const expectedResult: CalcDiffFilesResult = {
        files: [
          {
            pattern: '*.js',
            compression: Compression.Gzip,
            path: 'bundle.js',
            size: 2000,
            maxSize: undefined,
            diff: {
              bytes: 1000,
              percent: 100,
              change: DiffChange.Update,
            },
            status: Status.Pass,
          },
          {
            pattern: '*.js',
            compression: Compression.Gzip,
            path: 'bundle2.js',
            size: 5000,
            maxSize: undefined,
            diff: {
              bytes: 5000,
              percent: Infinity,
              change: DiffChange.Add,
            },
            status: Status.Pass,
          },
          {
            pattern: '*.js',
            compression: Compression.Gzip,
            path: 'bundle3.js',
            size: 0,
            maxSize: undefined,
            diff: {
              bytes: -3000,
              percent: -100,
              change: DiffChange.Remove,
            },
            status: Status.Pass,
          },
          {
            pattern: '*.js',
            compression: Compression.Gzip,
            path: 'bundle4.js',
            size: 1000,
            maxSize: undefined,
            diff: {
              bytes: 0,
              percent: 0,
              change: DiffChange.NoChange,
            },
            status: Status.Pass,
          },
          {
            friendlyName: 'main HTML',
            pattern: 'index.html',
            compression: Compression.Gzip,
            path: 'index.html',
            size: 4500,
            maxSize: undefined,
            diff: {
              bytes: -500,
              percent: -10,
              change: DiffChange.Update,
            },
            status: Status.Pass,
          },
        ],
        stats: {
          currBranchSize: 12500,
          baseBranchSize: 10000,
          diff: {
            bytes: 2500,
            percent: 25,
          },
        },
        status: Status.Pass,
      };

      expect(result).toEqual(expectedResult);
    });

    test('with max size -> pass', () => {
      const result = calcDiffFiles(
        [
          { pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 2000, maxSize: 2500 },
          { pattern: 'index.html', compression: Compression.Gzip, path: 'index.html', size: 450 },
        ],
        [
          { pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 1500, maxSize: 1600 },
          { pattern: 'index.html', compression: Compression.Gzip, path: 'index.html', size: 500, maxSize: 300 },
        ]
      );

      const expectedResult: CalcDiffFilesResult = {
        files: [
          {
            pattern: 'bundle.js',
            compression: Compression.Gzip,
            path: 'bundle.js',
            size: 2000,
            maxSize: 2500,
            diff: {
              bytes: 500,
              percent: 33.33,
              change: DiffChange.Update,
            },
            status: Status.Pass,
          },
          {
            pattern: 'index.html',
            compression: Compression.Gzip,
            path: 'index.html',
            size: 450,
            maxSize: undefined,
            diff: {
              bytes: -50,
              percent: -10,
              change: DiffChange.Update,
            },
            status: Status.Pass,
          },
        ],
        stats: {
          currBranchSize: 2450,
          baseBranchSize: 2000,
          diff: {
            bytes: 450,
            percent: 22.5,
          },
        },
        status: Status.Pass,
      };

      expect(result).toEqual(expectedResult);
    });

    test('with max size -> fail', () => {
      const result = calcDiffFiles(
        [
          { pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 2000, maxSize: 1500 },
          { pattern: 'index.html', compression: Compression.Gzip, path: 'index.html', size: 450 },
        ],

        [
          { pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 1500, maxSize: 1600 },
          { pattern: 'index.html', compression: Compression.Gzip, path: 'index.html', size: 500, maxSize: 300 },
        ]
      );

      const expectedResult: CalcDiffFilesResult = {
        files: [
          {
            pattern: 'bundle.js',
            compression: Compression.Gzip,
            path: 'bundle.js',
            size: 2000,
            maxSize: 1500,
            diff: {
              bytes: 500,
              percent: 33.33,
              change: DiffChange.Update,
            },
            status: Status.Fail,
            failReasons: [FailReason.MaxSize],
          },
          {
            pattern: 'index.html',
            compression: Compression.Gzip,
            path: 'index.html',
            size: 450,
            maxSize: undefined,
            diff: {
              bytes: -50,
              percent: -10,
              change: DiffChange.Update,
            },
            status: Status.Pass,
          },
        ],
        stats: {
          currBranchSize: 2450,
          baseBranchSize: 2000,
          diff: {
            bytes: 450,
            percent: 22.5,
          },
        },
        status: Status.Fail,
      };

      expect(result).toEqual(expectedResult);
    });

    describe('max percent change', () => {
      test('lower percent change', () => {
        const result = calcDiffFiles(
          [
            {
              pattern: 'bundle.js',
              compression: Compression.Gzip,
              path: 'bundle.js',
              size: 1100,
              maxSize: 1500,
              maxPercentIncrease: 15,
            },
            {
              pattern: 'bundle2.js',
              compression: Compression.Gzip,
              path: 'bundle2.js',
              size: 1000,
              maxSize: 1500,
              maxPercentIncrease: 0.1,
            },
          ],
          [{ pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 1000, maxSize: 1500 }]
        );

        const expectedResult: CalcDiffFilesResult = {
          files: [
            {
              pattern: 'bundle.js',
              compression: Compression.Gzip,
              path: 'bundle.js',
              size: 1100,
              maxSize: 1500,
              maxPercentIncrease: 15,
              diff: {
                bytes: 100,
                percent: 10,
                change: DiffChange.Update,
              },
              status: Status.Pass,
            },
            {
              pattern: 'bundle2.js',
              compression: Compression.Gzip,
              path: 'bundle2.js',
              size: 1000,
              maxSize: 1500,
              maxPercentIncrease: 0.1,
              diff: {
                bytes: 1000,
                percent: Infinity,
                change: DiffChange.Add,
              },
              status: Status.Pass,
            },
          ],
          stats: {
            currBranchSize: 2100,
            baseBranchSize: 1000,
            diff: {
              bytes: 1100,
              percent: 110,
            },
          },
          status: Status.Pass,
        };

        expect(result).toEqual(expectedResult);
      });

      test('percent change equals to max', () => {
        const result = calcDiffFiles(
          [
            {
              pattern: 'bundle.js',
              compression: Compression.Gzip,
              path: 'bundle.js',
              size: 1100,
              maxSize: 1500,
              maxPercentIncrease: 10,
            },
          ],
          [{ pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 1000, maxSize: 1500 }]
        );

        const expectedResult: CalcDiffFilesResult = {
          files: [
            {
              pattern: 'bundle.js',
              compression: Compression.Gzip,
              path: 'bundle.js',
              size: 1100,
              maxSize: 1500,
              maxPercentIncrease: 10,
              diff: {
                bytes: 100,
                percent: 10,
                change: DiffChange.Update,
              },
              status: Status.Pass,
            },
          ],
          stats: {
            currBranchSize: 1100,
            baseBranchSize: 1000,
            diff: {
              bytes: 100,
              percent: 10,
            },
          },
          status: Status.Pass,
        };

        expect(result).toEqual(expectedResult);
      });

      test('percent change exceeds max', () => {
        const result = calcDiffFiles(
          [
            {
              pattern: 'bundle.js',
              compression: Compression.Gzip,
              path: 'bundle.js',
              size: 1100,
              maxSize: 1500,
              maxPercentIncrease: 7.5,
            },
          ],
          [{ pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 1000, maxSize: 1500 }]
        );

        const expectedResult: CalcDiffFilesResult = {
          files: [
            {
              pattern: 'bundle.js',
              compression: Compression.Gzip,
              path: 'bundle.js',
              size: 1100,
              maxSize: 1500,
              maxPercentIncrease: 7.5,
              diff: {
                bytes: 100,
                percent: 10,
                change: DiffChange.Update,
              },
              status: Status.Fail,
              failReasons: [FailReason.MaxPercentIncrease],
            },
          ],
          stats: {
            currBranchSize: 1100,
            baseBranchSize: 1000,
            diff: {
              bytes: 100,
              percent: 10,
            },
          },
          status: Status.Fail,
        };

        expect(result).toEqual(expectedResult);
      });
    });

    test('multi fail reasons', () => {
      const result = calcDiffFiles(
        [
          {
            pattern: 'bundle.js',
            compression: Compression.Gzip,
            path: 'bundle.js',
            size: 2000,
            maxSize: 1500,
            maxPercentIncrease: 7.5,
          },
        ],
        [{ pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 1000, maxSize: 1500 }]
      );

      const expectedResult: CalcDiffFilesResult = {
        files: [
          {
            pattern: 'bundle.js',
            compression: Compression.Gzip,
            path: 'bundle.js',
            size: 2000,
            maxSize: 1500,
            maxPercentIncrease: 7.5,
            diff: {
              bytes: 1000,
              percent: 100,
              change: DiffChange.Update,
            },
            status: Status.Fail,
            failReasons: [FailReason.MaxSize, FailReason.MaxPercentIncrease],
          },
        ],
        stats: {
          currBranchSize: 2000,
          baseBranchSize: 1000,
          diff: {
            bytes: 1000,
            percent: 100,
          },
        },
        status: Status.Fail,
      };

      expect(result).toEqual(expectedResult);
    });
  });
});
