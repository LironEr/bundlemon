import { mocked } from 'ts-jest/utils';
import { getReportSummary } from '../';
import { calcReportSummary } from '../utils';
import { Status, DiffChange, CurrentFilesDetails, Report } from '../../types';

jest.mock('../utils');

function generateBaseReport(override: Partial<Report> = {}): Report {
  return {
    id: '1',
    branch: 'main',
    commitSha: '2312',
    creationDate: new Date().toISOString(),
    defaultCompression: 'gzip',
    projectId: '12',
    files: [],
    ...override,
  };
}

describe('report summary', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getReportSummary', () => {
    const calcReportSummaryResult: ReturnType<typeof calcReportSummary> = {
      files: [
        {
          pattern: '**/*.js',
          path: 'path/to/file.js',
          maxSize: 150,
          diff: { change: DiffChange.NoChange, bytes: 0, percent: 0 },
          size: 100,
          status: Status.Pass,
        },
      ],
      stats: { baseBranchSize: 100, currBranchSize: 100, diff: { bytes: 0, percent: 0 } },
      status: Status.Pass,
    };

    test('without base report', () => {
      const mockedCalcReportSummary = mocked(calcReportSummary).mockReturnValue(calcReportSummaryResult);

      const currentFilesDetails: CurrentFilesDetails = {
        defaultCompression: 'gzip',
        files: [{ pattern: '**/*.js', path: 'path/to/file.js', maxSize: 100, size: 100 }],
      };

      const result = getReportSummary(currentFilesDetails, undefined);

      expect(mockedCalcReportSummary).toHaveBeenCalledWith(currentFilesDetails.files, undefined);
      expect(result).toEqual({ defaultCompression: 'gzip', ...calcReportSummaryResult });
    });

    test('with base report', () => {
      const mockedCalcReportSummary = mocked(calcReportSummary).mockReturnValue(calcReportSummaryResult);

      const currentFilesDetails: CurrentFilesDetails = {
        defaultCompression: 'none',
        files: [{ pattern: '**/*.js', path: 'path/to/file.js', maxSize: 100, size: 100 }],
      };

      const baseReport = generateBaseReport({
        files: [{ pattern: '**/*.js', path: 'path/to/file2.js', maxSize: 300, size: 240 }],
      });

      const result = getReportSummary(currentFilesDetails, baseReport);

      expect(mockedCalcReportSummary).toHaveBeenCalledWith(currentFilesDetails.files, baseReport.files);
      expect(result).toEqual({ defaultCompression: 'none', ...calcReportSummaryResult });
    });
  });
});
