import { mocked } from 'ts-jest/utils';
import { generateReportData } from '../generateReportData';
import { generateNormalizedConfig } from '../../utils/__tests__/configUtils';
import { saveReport } from '../serviceHelper';
import {
  FileDetails,
  CurrentFilesDetails,
  DiffChange,
  Status,
  getReportSummary,
  CreateReportResponse,
  Report,
} from 'bundlemon-utils';
import { ReportData, GitVars } from '../../types';
import { getGitVars } from '../../utils/configUtils';

const localFiles: FileDetails[] = [{ path: 'path/to/file.js', size: 120 }];
const currFilesDetails: CurrentFilesDetails = {
  files: localFiles,
  defaultCompression: 'gzip',
};

const calcReportSummaryResult: ReturnType<typeof getReportSummary> = {
  defaultCompression: 'gzip',
  files: [
    {
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

function generateReport(override: Partial<Report> = {}): Report {
  return {
    id: '1',
    branch: 'main',
    commitSha: '2312',
    creationDate: new Date().toISOString(),
    defaultCompression: 'gzip',
    projectId: '12',
    files: [...localFiles],
    ...override,
  };
}

jest.mock('bundlemon-utils');
jest.mock('../serviceHelper');
jest.mock('../../../common/logger');
jest.mock('../../utils/configUtils');

describe('generateReportData', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mocked(getReportSummary).mockReturnValue(calcReportSummaryResult);
  });

  test('onlyLocalAnalyze: true', async () => {
    const config = generateNormalizedConfig({ onlyLocalAnalyze: true });

    const result = await generateReportData(config, localFiles);

    const expectedResult: ReportData = {
      reportSummary: calcReportSummaryResult,
    };

    expect(getReportSummary).toHaveBeenCalledWith(currFilesDetails, undefined);
    expect(getGitVars).toHaveBeenCalledTimes(0);
    expect(saveReport).toHaveBeenCalledTimes(0);
    expect(result).toEqual(expectedResult);
  });

  test('no git vars', async () => {
    mocked(getGitVars).mockReturnValue(undefined);
    const config = generateNormalizedConfig();

    const result = await generateReportData(config, localFiles);

    expect(getGitVars).toHaveBeenCalledTimes(1);
    expect(getReportSummary).toHaveBeenCalledTimes(0);
    expect(saveReport).toHaveBeenCalledTimes(0);
    expect(result).toEqual(undefined);
  });

  describe('with git vars', () => {
    test('save report, no base report', async () => {
      const gitVars: GitVars = { branch: 'main', commitSha: '18723' };
      mocked(getGitVars).mockReturnValue(gitVars);

      const saveReportResult: CreateReportResponse = { linkToReport: 'link', report: generateReport() };
      mocked(saveReport).mockResolvedValue(saveReportResult);

      const config = generateNormalizedConfig();

      const result = await generateReportData(config, localFiles);

      const expectedResult: ReportData = {
        reportSummary: calcReportSummaryResult,
        ...saveReportResult,
      };

      expect(saveReport).toHaveBeenCalledWith(gitVars, currFilesDetails);
      expect(getReportSummary).toHaveBeenCalledWith(currFilesDetails, undefined);
      expect(result).toEqual(expectedResult);
    });

    test('save report, get base report', async () => {
      const gitVars: GitVars = { branch: 'main', commitSha: '18723' };
      mocked(getGitVars).mockReturnValue(gitVars);

      const saveReportResult: CreateReportResponse = {
        linkToReport: 'link',
        report: generateReport({ baseBranch: 'prod' }),
        baseReport: generateReport({ branch: 'prod' }),
      };
      mocked(saveReport).mockResolvedValue(saveReportResult);

      const config = generateNormalizedConfig();

      const result = await generateReportData(config, localFiles);

      const expectedResult: ReportData = {
        reportSummary: calcReportSummaryResult,
        ...saveReportResult,
      };

      expect(saveReport).toHaveBeenCalledWith(gitVars, currFilesDetails);
      expect(getReportSummary).toHaveBeenCalledWith(currFilesDetails, saveReportResult.baseReport);
      expect(result).toEqual(expectedResult);
    });

    test('undefined returned from save report', async () => {
      const gitVars: GitVars = { branch: 'main', commitSha: '18723' };
      mocked(getGitVars).mockReturnValue(gitVars);
      mocked(saveReport).mockResolvedValue(undefined);

      const config = generateNormalizedConfig();

      const result = await generateReportData(config, localFiles);

      expect(saveReport).toHaveBeenCalledWith(gitVars, currFilesDetails);
      expect(getReportSummary).toHaveBeenCalledTimes(0);
      expect(result).toEqual(undefined);
    });
  });
});
