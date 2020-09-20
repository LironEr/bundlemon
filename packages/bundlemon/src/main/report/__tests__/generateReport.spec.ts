import { mocked } from 'ts-jest/utils';
import { generateReport } from '../generateReport';
import { generateNormalizedConfig } from '../../utils/__tests__/configUtils';
import { saveCommitRecord } from '../serviceHelper';
import {
  FileDetails,
  DiffChange,
  Status,
  generateDiffReport,
  CreateCommitRecordResponse,
  Report,
  CommitRecord,
  Compression,
} from 'bundlemon-utils';
import { GitVars } from '../../types';
import { getGitVars } from '../../utils/configUtils';

const localFiles: FileDetails[] = [
  { pattern: '**/*.js', path: 'path/to/file.js', compression: Compression.Gzip, size: 120 },
];

const localGroups: FileDetails[] = [
  { pattern: '*', path: 'path/to/file.js', compression: Compression.Gzip, size: 120 },
];

const generateDiffReportResult: ReturnType<typeof generateDiffReport> = {
  files: [
    {
      pattern: '**/*.js',
      path: 'path/to/file.js',
      compression: Compression.Gzip,
      maxSize: 150,
      diff: { change: DiffChange.NoChange, bytes: 0, percent: 0 },
      size: 100,
      status: Status.Pass,
    },
  ],
  groups: [
    {
      pattern: '*',
      path: 'path/to/file.js',
      compression: Compression.Gzip,
      maxSize: 150,
      diff: { change: DiffChange.NoChange, bytes: 0, percent: 0 },
      size: 100,
      status: Status.Pass,
    },
  ],
  stats: { baseBranchSize: 100, currBranchSize: 100, diff: { bytes: 0, percent: 0 } },
  status: Status.Pass,
};

function generateCommitRecord(override: Partial<CommitRecord> = {}): CommitRecord {
  return {
    id: '1',
    branch: 'main',
    commitSha: '2312',
    creationDate: new Date().toISOString(),
    projectId: '12',
    files: [...localFiles],
    groups: [],
    ...override,
  };
}

jest.mock('bundlemon-utils');
jest.mock('../serviceHelper');
jest.mock('../../../common/logger');
jest.mock('../../utils/configUtils');

describe('generateReport', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    mocked(generateDiffReport).mockReturnValue(generateDiffReportResult);
  });

  test('onlyLocalAnalyze: true', async () => {
    const config = generateNormalizedConfig({ onlyLocalAnalyze: true });

    const result = await generateReport(config, { files: localFiles, groups: localGroups });

    const expectedResult: Report = {
      ...generateDiffReportResult,
      metadata: {},
    };

    expect(generateDiffReport).toHaveBeenCalledWith({ files: localFiles, groups: localGroups }, undefined);
    expect(getGitVars).toHaveBeenCalledTimes(0);
    expect(saveCommitRecord).toHaveBeenCalledTimes(0);
    expect(result).toEqual(expectedResult);
  });

  test('no git vars', async () => {
    mocked(getGitVars).mockReturnValue(undefined);
    const config = generateNormalizedConfig();

    const result = await generateReport(config, { files: localFiles, groups: localGroups });

    expect(getGitVars).toHaveBeenCalledTimes(1);
    expect(generateDiffReport).toHaveBeenCalledTimes(0);
    expect(saveCommitRecord).toHaveBeenCalledTimes(0);
    expect(result).toEqual(undefined);
  });

  describe('with git vars', () => {
    test('save commit record, no base commit record', async () => {
      const gitVars: GitVars = { branch: 'main', commitSha: '18723' };
      mocked(getGitVars).mockReturnValue(gitVars);

      const saveReportResult: CreateCommitRecordResponse = {
        linkToReport: 'link',
        record: generateCommitRecord(),
      };
      mocked(saveCommitRecord).mockResolvedValue(saveReportResult);

      const config = generateNormalizedConfig();

      const result = await generateReport(config, { files: localFiles, groups: localGroups });

      const expectedResult: Report = {
        ...generateDiffReportResult,
        metadata: {
          ...saveReportResult,
        },
      };

      expect(saveCommitRecord).toHaveBeenCalledWith({ ...gitVars, files: localFiles, groups: localGroups });
      expect(generateDiffReport).toHaveBeenCalledWith({ files: localFiles, groups: localGroups }, undefined);
      expect(result).toEqual(expectedResult);
    });

    test('save commit record, get base commit record', async () => {
      const gitVars: GitVars = { branch: 'main', commitSha: '18723' };
      mocked(getGitVars).mockReturnValue(gitVars);

      const saveReportResult: CreateCommitRecordResponse = {
        linkToReport: 'link',
        record: generateCommitRecord({ baseBranch: 'prod' }),
        baseRecord: generateCommitRecord({ branch: 'prod' }),
      };
      mocked(saveCommitRecord).mockResolvedValue(saveReportResult);

      const config = generateNormalizedConfig();

      const result = await generateReport(config, { files: localFiles, groups: localGroups });

      const expectedResult: Report = {
        ...generateDiffReportResult,
        metadata: {
          ...saveReportResult,
        },
      };

      expect(saveCommitRecord).toHaveBeenCalledWith({ ...gitVars, files: localFiles, groups: localGroups });
      expect(generateDiffReport).toHaveBeenCalledWith(
        { files: localFiles, groups: localGroups },
        { files: saveReportResult.baseRecord?.files, groups: saveReportResult.baseRecord?.groups }
      );
      expect(result).toEqual(expectedResult);
    });

    test('undefined returned from save commit record', async () => {
      const gitVars: GitVars = { branch: 'main', commitSha: '18723' };
      mocked(getGitVars).mockReturnValue(gitVars);
      mocked(saveCommitRecord).mockResolvedValue(undefined);

      const config = generateNormalizedConfig();

      const result = await generateReport(config, { files: localFiles, groups: localGroups });

      expect(saveCommitRecord).toHaveBeenCalledWith({ ...gitVars, files: localFiles, groups: localGroups });
      expect(generateDiffReport).toHaveBeenCalledTimes(0);
      expect(result).toEqual(undefined);
    });
  });
});
