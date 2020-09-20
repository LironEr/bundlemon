import { calcDiffFiles } from '..';
import { Status, DiffChange, FailReason, Compression } from '../../consts';

type CalcDiffFilesResult = ReturnType<typeof calcDiffFiles>;

describe('diff summary utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('calcDiffSummary', () => {
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
          { pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 200 },
          { pattern: 'index.html', compression: Compression.Gzip, path: 'index.html', size: 50 },
        ],
        undefined
      );

      const expectedResult: CalcDiffFilesResult = {
        files: [
          {
            pattern: 'bundle.js',
            compression: Compression.Gzip,
            path: 'bundle.js',
            size: 200,
            maxSize: undefined,
            diff: {
              bytes: 200,
              percent: Infinity,
              change: DiffChange.Add,
            },
            status: Status.Pass,
          },
          {
            pattern: 'index.html',
            compression: Compression.Gzip,
            path: 'index.html',
            size: 50,
            maxSize: undefined,
            diff: {
              bytes: 50,
              percent: Infinity,
              change: DiffChange.Add,
            },
            status: Status.Pass,
          },
        ],
        stats: {
          currBranchSize: 250,
          baseBranchSize: 0,
          diff: {
            bytes: 250,
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
          { pattern: '*.js', compression: Compression.Gzip, path: 'bundle.js', size: 200 },
          { pattern: 'index.html', compression: Compression.Gzip, path: 'index.html', size: 45 },
          { pattern: '*.js', compression: Compression.Gzip, path: 'bundle2.js', size: 500 },
          { pattern: '*.js', compression: Compression.Gzip, path: 'bundle4.js', size: 100 },
        ],
        [
          { pattern: '*.js', compression: Compression.Gzip, path: 'bundle.js', size: 100 },
          { pattern: 'index.html', compression: Compression.Gzip, path: 'index.html', size: 50 },
          { pattern: '*.js', compression: Compression.Gzip, path: 'bundle3.js', size: 300 },
          { pattern: '*.js', compression: Compression.Gzip, path: 'bundle4.js', size: 100 },
        ]
      );

      const expectedResult: CalcDiffFilesResult = {
        files: [
          {
            pattern: '*.js',
            compression: Compression.Gzip,
            path: 'bundle.js',
            size: 200,
            maxSize: undefined,
            diff: {
              bytes: 100,
              percent: 100,
              change: DiffChange.Update,
            },
            status: Status.Pass,
          },
          {
            pattern: '*.js',
            compression: Compression.Gzip,
            path: 'bundle2.js',
            size: 500,
            maxSize: undefined,
            diff: {
              bytes: 500,
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
              bytes: -300,
              percent: -100,
              change: DiffChange.Remove,
            },
            status: Status.Pass,
          },
          {
            pattern: '*.js',
            compression: Compression.Gzip,
            path: 'bundle4.js',
            size: 100,
            maxSize: undefined,
            diff: {
              bytes: 0,
              percent: 0,
              change: DiffChange.NoChange,
            },
            status: Status.Pass,
          },
          {
            pattern: 'index.html',
            compression: Compression.Gzip,
            path: 'index.html',
            size: 45,
            maxSize: undefined,
            diff: {
              bytes: -5,
              percent: -10,
              change: DiffChange.Update,
            },
            status: Status.Pass,
          },
        ],
        stats: {
          currBranchSize: 845,
          baseBranchSize: 550,
          diff: {
            bytes: 295,
            percent: 53.64,
          },
        },
        status: Status.Pass,
      };

      expect(result).toEqual(expectedResult);
    });

    test('with max size -> pass', () => {
      const result = calcDiffFiles(
        [
          { pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 200, maxSize: 250 },
          { pattern: 'index.html', compression: Compression.Gzip, path: 'index.html', size: 45 },
        ],
        [
          { pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 150, maxSize: 160 },
          { pattern: 'index.html', compression: Compression.Gzip, path: 'index.html', size: 50, maxSize: 30 },
        ]
      );

      const expectedResult: CalcDiffFilesResult = {
        files: [
          {
            pattern: 'bundle.js',
            compression: Compression.Gzip,
            path: 'bundle.js',
            size: 200,
            maxSize: 250,
            diff: {
              bytes: 50,
              percent: 33.33,
              change: DiffChange.Update,
            },
            status: Status.Pass,
          },
          {
            pattern: 'index.html',
            compression: Compression.Gzip,
            path: 'index.html',
            size: 45,
            maxSize: undefined,
            diff: {
              bytes: -5,
              percent: -10,
              change: DiffChange.Update,
            },
            status: Status.Pass,
          },
        ],
        stats: {
          currBranchSize: 245,
          baseBranchSize: 200,
          diff: {
            bytes: 45,
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
          { pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 200, maxSize: 150 },
          { pattern: 'index.html', compression: Compression.Gzip, path: 'index.html', size: 45 },
        ],

        [
          { pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 150, maxSize: 160 },
          { pattern: 'index.html', compression: Compression.Gzip, path: 'index.html', size: 50, maxSize: 30 },
        ]
      );

      const expectedResult: CalcDiffFilesResult = {
        files: [
          {
            pattern: 'bundle.js',
            compression: Compression.Gzip,
            path: 'bundle.js',
            size: 200,
            maxSize: 150,
            diff: {
              bytes: 50,
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
            size: 45,
            maxSize: undefined,
            diff: {
              bytes: -5,
              percent: -10,
              change: DiffChange.Update,
            },
            status: Status.Pass,
          },
        ],
        stats: {
          currBranchSize: 245,
          baseBranchSize: 200,
          diff: {
            bytes: 45,
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
              size: 110,
              maxSize: 150,
              maxPercentIncrease: 15,
            },
            {
              pattern: 'bundle2.js',
              compression: Compression.Gzip,
              path: 'bundle2.js',
              size: 100,
              maxSize: 150,
              maxPercentIncrease: 0.1,
            },
          ],
          [{ pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 100, maxSize: 150 }]
        );

        const expectedResult: CalcDiffFilesResult = {
          files: [
            {
              pattern: 'bundle.js',
              compression: Compression.Gzip,
              path: 'bundle.js',
              size: 110,
              maxSize: 150,
              maxPercentIncrease: 15,
              diff: {
                bytes: 10,
                percent: 10,
                change: DiffChange.Update,
              },
              status: Status.Pass,
            },
            {
              pattern: 'bundle2.js',
              compression: Compression.Gzip,
              path: 'bundle2.js',
              size: 100,
              maxSize: 150,
              maxPercentIncrease: 0.1,
              diff: {
                bytes: 100,
                percent: Infinity,
                change: DiffChange.Add,
              },
              status: Status.Pass,
            },
          ],
          stats: {
            currBranchSize: 210,
            baseBranchSize: 100,
            diff: {
              bytes: 110,
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
              size: 110,
              maxSize: 150,
              maxPercentIncrease: 10,
            },
          ],
          [{ pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 100, maxSize: 150 }]
        );

        const expectedResult: CalcDiffFilesResult = {
          files: [
            {
              pattern: 'bundle.js',
              compression: Compression.Gzip,
              path: 'bundle.js',
              size: 110,
              maxSize: 150,
              maxPercentIncrease: 10,
              diff: {
                bytes: 10,
                percent: 10,
                change: DiffChange.Update,
              },
              status: Status.Pass,
            },
          ],
          stats: {
            currBranchSize: 110,
            baseBranchSize: 100,
            diff: {
              bytes: 10,
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
              size: 110,
              maxSize: 150,
              maxPercentIncrease: 7.5,
            },
          ],
          [{ pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 100, maxSize: 150 }]
        );

        const expectedResult: CalcDiffFilesResult = {
          files: [
            {
              pattern: 'bundle.js',
              compression: Compression.Gzip,
              path: 'bundle.js',
              size: 110,
              maxSize: 150,
              maxPercentIncrease: 7.5,
              diff: {
                bytes: 10,
                percent: 10,
                change: DiffChange.Update,
              },
              status: Status.Fail,
              failReasons: [FailReason.MaxPercentIncrease],
            },
          ],
          stats: {
            currBranchSize: 110,
            baseBranchSize: 100,
            diff: {
              bytes: 10,
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
            size: 200,
            maxSize: 150,
            maxPercentIncrease: 7.5,
          },
        ],
        [{ pattern: 'bundle.js', compression: Compression.Gzip, path: 'bundle.js', size: 100, maxSize: 150 }]
      );

      const expectedResult: CalcDiffFilesResult = {
        files: [
          {
            pattern: 'bundle.js',
            compression: Compression.Gzip,
            path: 'bundle.js',
            size: 200,
            maxSize: 150,
            maxPercentIncrease: 7.5,
            diff: {
              bytes: 100,
              percent: 100,
              change: DiffChange.Update,
            },
            status: Status.Fail,
            failReasons: [FailReason.MaxSize, FailReason.MaxPercentIncrease],
          },
        ],
        stats: {
          currBranchSize: 200,
          baseBranchSize: 100,
          diff: {
            bytes: 100,
            percent: 100,
          },
        },
        status: Status.Fail,
      };

      expect(result).toEqual(expectedResult);
    });
  });
});
