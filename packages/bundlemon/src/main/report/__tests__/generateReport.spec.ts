import { generateReport } from '../generateReport';
import { generateNormalizedConfigRemoteOn, generateNormalizedConfigRemoteOff } from '../../utils/__tests__/configUtils';
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
import { createCommitRecord } from '../../../common/service';
import type { GitVars } from '../../types';

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
jest.mock('../../../common/service');
jest.mock('../../../common/logger');
jest.mock('../../utils/configUtils');
jest.mock('../../utils/ci');

describe('generateReport', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    jest.mocked(generateDiffReport).mockReturnValue(generateDiffReportResult);
  });

  test('remote: false', async () => {
    const config = generateNormalizedConfigRemoteOff();

    const result = await generateReport(config, { files: localFiles, groups: localGroups });

    const expectedResult: Report = {
      ...generateDiffReportResult,
      metadata: {},
    };

    expect(generateDiffReport).toHaveBeenCalledWith({ files: localFiles, groups: localGroups }, undefined);
    expect(createCommitRecord).toHaveBeenCalledTimes(0);
    expect(result).toEqual(expectedResult);
  });

  describe('remote: true', () => {
    test('save commit record, no base commit record', async () => {
      const gitVars: GitVars = { branch: 'main', commitSha: '18723' };

      const saveReportResult: CreateCommitRecordResponse = {
        linkToReport: 'link',
        record: generateCommitRecord(),
      };
      jest.mocked(createCommitRecord).mockResolvedValue(saveReportResult);

      const config = generateNormalizedConfigRemoteOn({ gitVars });

      const result = await generateReport(config, { files: localFiles, groups: localGroups });

      const expectedResult: Report = {
        ...generateDiffReportResult,
        metadata: {
          ...saveReportResult,
        },
      };

      expect(createCommitRecord).toHaveBeenCalledWith(
        config.projectId,
        {
          ...gitVars,
          files: localFiles,
          groups: localGroups,
        },
        config.getCreateCommitRecordAuthParams()
      );
      expect(generateDiffReport).toHaveBeenCalledWith({ files: localFiles, groups: localGroups }, undefined);
      expect(result).toEqual(expectedResult);
    });

    test('save commit record, get base commit record', async () => {
      const gitVars: GitVars = { branch: 'main', commitSha: '18723' };

      const saveReportResult: CreateCommitRecordResponse = {
        linkToReport: 'link',
        record: generateCommitRecord({ baseBranch: 'prod' }),
        baseRecord: generateCommitRecord({ branch: 'prod' }),
      };
      jest.mocked(createCommitRecord).mockResolvedValue(saveReportResult);

      const config = generateNormalizedConfigRemoteOn({ gitVars });

      const result = await generateReport(config, { files: localFiles, groups: localGroups });

      const expectedResult: Report = {
        ...generateDiffReportResult,
        metadata: {
          ...saveReportResult,
        },
      };

      expect(createCommitRecord).toHaveBeenCalledWith(
        config.projectId,
        {
          ...gitVars,
          files: localFiles,
          groups: localGroups,
        },
        config.getCreateCommitRecordAuthParams()
      );
      expect(generateDiffReport).toHaveBeenCalledWith(
        { files: localFiles, groups: localGroups },
        { files: saveReportResult.baseRecord?.files, groups: saveReportResult.baseRecord?.groups }
      );
      expect(result).toEqual(expectedResult);
    });

    test('save commit record, include commit message', async () => {
      const gitVars: GitVars = { branch: 'main', commitSha: '18723', commitMsg: 'msg msg' };

      const saveReportResult: CreateCommitRecordResponse = {
        linkToReport: 'link',
        record: generateCommitRecord(),
      };
      jest.mocked(createCommitRecord).mockResolvedValue(saveReportResult);

      const config = generateNormalizedConfigRemoteOn({ gitVars, includeCommitMessage: true });

      const result = await generateReport(config, { files: localFiles, groups: localGroups });

      const expectedResult: Report = {
        ...generateDiffReportResult,
        metadata: {
          ...saveReportResult,
        },
      };

      expect(createCommitRecord).toHaveBeenCalledWith(
        config.projectId,
        {
          ...gitVars,
          files: localFiles,
          groups: localGroups,
        },
        config.getCreateCommitRecordAuthParams()
      );
      expect(generateDiffReport).toHaveBeenCalledWith({ files: localFiles, groups: localGroups }, undefined);
      expect(result).toEqual(expectedResult);
    });

    test('undefined returned from save commit record', async () => {
      const gitVars: GitVars = { branch: 'main', commitSha: '18723' };
      jest.mocked(createCommitRecord).mockResolvedValue(undefined);

      const config = generateNormalizedConfigRemoteOn({ gitVars });

      const result = await generateReport(config, { files: localFiles, groups: localGroups });

      expect(createCommitRecord).toHaveBeenCalledWith(
        config.projectId,
        {
          ...gitVars,
          files: localFiles,
          groups: localGroups,
        },
        config.getCreateCommitRecordAuthParams()
      );
      expect(generateDiffReport).toHaveBeenCalledTimes(0);
      expect(result).toEqual(undefined);
    });
  });
});
