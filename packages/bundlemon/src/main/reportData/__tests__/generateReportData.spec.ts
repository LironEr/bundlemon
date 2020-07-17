import { mocked } from 'ts-jest/utils';
import { generateReportData } from '../generateReportData';
import { generateNormalizedConfig } from '../../utils/__tests__/configUtils';
import { getBaseReport, saveReport } from '../serviceHelper';
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
    expect(getBaseReport).toHaveBeenCalledTimes(0);
    expect(result).toEqual(expectedResult);
  });

  test('no git vars', async () => {
    mocked(getGitVars).mockReturnValue(undefined);
    const config = generateNormalizedConfig();

    const result = await generateReportData(config, localFiles);

    expect(getGitVars).toHaveBeenCalledTimes(1);
    expect(getReportSummary).toHaveBeenCalledTimes(0);
    expect(saveReport).toHaveBeenCalledTimes(0);
    expect(getBaseReport).toHaveBeenCalledTimes(0);
    expect(result).toEqual(undefined);
  });

  describe('track branches includes current branch', () => {
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
      expect(getBaseReport).toHaveBeenCalledTimes(0);
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
      expect(getBaseReport).toHaveBeenCalledTimes(0);
      expect(getReportSummary).toHaveBeenCalledWith(currFilesDetails, saveReportResult.baseReport);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('track branches doesnt include current branch -> base branch var exists', () => {
    test('track branches includes base branch -> base report exists', async () => {
      const gitVars: GitVars = { branch: 'feature/add-something', commitSha: '18723', baseBranch: 'main' };
      mocked(getGitVars).mockReturnValue(gitVars);

      const getBaseReportResult: Report = generateReport();
      mocked(getBaseReport).mockResolvedValue(getBaseReportResult);

      const config = generateNormalizedConfig();

      const result = await generateReportData(config, localFiles);

      const expectedResult: ReportData = {
        reportSummary: calcReportSummaryResult,
        baseReport: getBaseReportResult,
      };

      expect(getBaseReport).toHaveBeenCalledWith(gitVars.baseBranch);
      expect(saveReport).toHaveBeenCalledTimes(0);
      expect(getReportSummary).toHaveBeenCalledWith(currFilesDetails, getBaseReportResult);
      expect(result).toEqual(expectedResult);
    });

    test('track branches includes base branch -> base report not found', async () => {
      const gitVars: GitVars = { branch: 'feature/add-something', commitSha: '18723', baseBranch: 'main' };
      mocked(getGitVars).mockReturnValue(gitVars);

      const getBaseReportResult = undefined;
      mocked(getBaseReport).mockResolvedValue(undefined);

      const config = generateNormalizedConfig();

      const result = await generateReportData(config, localFiles);

      const expectedResult: ReportData = {
        reportSummary: calcReportSummaryResult,
        baseReport: getBaseReportResult,
      };

      expect(getBaseReport).toHaveBeenCalledWith(gitVars.baseBranch);
      expect(saveReport).toHaveBeenCalledTimes(0);
      expect(getReportSummary).toHaveBeenCalledWith(currFilesDetails, getBaseReportResult);
      expect(result).toEqual(expectedResult);
    });
  });

  test('not exists in track branches & no base branch', async () => {
    const gitVars: GitVars = { branch: 'prod', commitSha: '18723' };
    mocked(getGitVars).mockReturnValue(gitVars);

    const config = generateNormalizedConfig();

    const result = await generateReportData(config, localFiles);

    const expectedResult: ReportData = {
      reportSummary: calcReportSummaryResult,
    };

    expect(saveReport).toHaveBeenCalledTimes(0);
    expect(getBaseReport).toHaveBeenCalledTimes(0);
    expect(getReportSummary).toHaveBeenCalledWith(currFilesDetails, undefined);
    expect(result).toEqual(expectedResult);
  });
});
