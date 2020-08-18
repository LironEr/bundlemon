import { calcReportSummary } from '../utils';
import { Status, DiffChange } from '../../types';

type CalcReportSummaryResult = ReturnType<typeof calcReportSummary>;

describe('report summary utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('calcReportSummary', () => {
    test('empty files', () => {
      const result = calcReportSummary([], []);

      const expectedResult: CalcReportSummaryResult = {
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
      const result = calcReportSummary([], undefined);

      const expectedResult: CalcReportSummaryResult = {
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
      const result = calcReportSummary(
        [
          { path: 'bundle.js', size: 200 },
          { path: 'index.html', size: 50 },
        ],
        undefined
      );

      const expectedResult: CalcReportSummaryResult = {
        files: [
          {
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
      const result = calcReportSummary(
        [
          { path: 'bundle.js', size: 200 },
          { path: 'index.html', size: 45 },
          { path: 'bundle2.js', size: 500 },
          { path: 'bundle4.js', size: 100 },
        ],
        [
          { path: 'bundle.js', size: 100 },
          { path: 'index.html', size: 50 },
          { path: 'bundle3.js', size: 300 },
          { path: 'bundle4.js', size: 100 },
        ]
      );

      const expectedResult: CalcReportSummaryResult = {
        files: [
          {
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
      const result = calcReportSummary(
        [
          { path: 'bundle.js', size: 200, maxSize: 250 },
          { path: 'index.html', size: 45 },
        ],
        [
          { path: 'bundle.js', size: 150, maxSize: 160 },
          { path: 'index.html', size: 50, maxSize: 30 },
        ]
      );

      const expectedResult: CalcReportSummaryResult = {
        files: [
          {
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
      const result = calcReportSummary(
        [
          { path: 'bundle.js', size: 200, maxSize: 150 },
          { path: 'index.html', size: 45 },
        ],

        [
          { path: 'bundle.js', size: 150, maxSize: 160 },
          { path: 'index.html', size: 50, maxSize: 30 },
        ]
      );

      const expectedResult: CalcReportSummaryResult = {
        files: [
          {
            path: 'bundle.js',
            size: 200,
            maxSize: 150,
            diff: {
              bytes: 50,
              percent: 33.33,
              change: DiffChange.Update,
            },
            status: Status.Fail,
          },
          {
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
        const result = calcReportSummary(
          [
            { path: 'bundle.js', size: 110, maxSize: 150, maxPercentIncrease: 15 },
            { path: 'bundle2.js', size: 100, maxSize: 150, maxPercentIncrease: 0.1 },
          ],
          [{ path: 'bundle.js', size: 100, maxSize: 150 }]
        );

        const expectedResult: CalcReportSummaryResult = {
          files: [
            {
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
        const result = calcReportSummary(
          [{ path: 'bundle.js', size: 110, maxSize: 150, maxPercentIncrease: 10 }],
          [{ path: 'bundle.js', size: 100, maxSize: 150 }]
        );

        const expectedResult: CalcReportSummaryResult = {
          files: [
            {
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
        const result = calcReportSummary(
          [{ path: 'bundle.js', size: 110, maxSize: 150, maxPercentIncrease: 7.5 }],
          [{ path: 'bundle.js', size: 100, maxSize: 150 }]
        );

        const expectedResult: CalcReportSummaryResult = {
          files: [
            {
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
  });
});
