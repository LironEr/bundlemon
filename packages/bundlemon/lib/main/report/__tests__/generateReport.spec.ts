import { generateReport } from '../generateReport';
import { generateNormalizedConfigRemoteOn, generateNormalizedConfigRemoteOff } from '../../utils/__tests__/configUtils';
import {
  FileDetails,
  DiffChange,
  Status,
  CreateCommitRecordResponse,
  Report,
  CommitRecord,
  Compression,
  DiffReport,
  FailReason,
} from 'bundlemon-utils';
import { createCommitRecord } from '../../../common/service';
import type { GitVars } from '../../types';

const localFiles: FileDetails[] = [
  { pattern: '**/*.js', path: 'path/to/file.js', compression: Compression.Gzip, size: 100, maxSize: 150 },
];

const localGroups: FileDetails[] = [
  { pattern: '*', path: '*', compression: Compression.Gzip, size: 100, maxSize: 150 },
];

const generateDiffReportResult: DiffReport = {
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
      path: '*',
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
    groups: [...localGroups],
    subProject: undefined,
    ...override,
  };
}

jest.mock('../../../common/service');
jest.mock('../../../common/logger');
jest.mock('../../utils/configUtils');
jest.mock('../../utils/ci');

describe('generateReport', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('remote: false', async () => {
    const config = generateNormalizedConfigRemoteOff();

    const result = await generateReport(config, { files: localFiles, groups: localGroups });

    const expectedResult: Report = {
      ...generateDiffReportResult,
      files: [
        {
          ...generateDiffReportResult.files[0],
          diff: {
            bytes: 100,
            change: DiffChange.Add,
            percent: Infinity,
          },
        },
      ],
      groups: [
        {
          ...generateDiffReportResult.groups[0],
          diff: {
            bytes: 100,
            change: DiffChange.Add,
            percent: Infinity,
          },
        },
      ],
      metadata: {},
      stats: {
        ...generateDiffReportResult.stats,
        baseBranchSize: 0,
        diff: {
          bytes: 100,
          percent: Infinity,
        },
      },
    };

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
        files: [
          {
            ...generateDiffReportResult.files[0],
            diff: {
              bytes: 100,
              change: DiffChange.Add,
              percent: Infinity,
            },
          },
        ],
        groups: [
          {
            ...generateDiffReportResult.groups[0],
            diff: {
              bytes: 100,
              change: DiffChange.Add,
              percent: Infinity,
            },
          },
        ],
        metadata: {
          ...saveReportResult,
          subProject: undefined,
        },
        stats: {
          ...generateDiffReportResult.stats,
          baseBranchSize: 0,
          diff: {
            bytes: 100,
            percent: Infinity,
          },
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
      expect(result).toEqual(expectedResult);
    });

    test('save commit record, get base commit record', async () => {
      const gitVars: GitVars = { branch: 'some-feature', commitSha: '18723' };
      const saveReportResult: CreateCommitRecordResponse = {
        linkToReport: 'link',
        record: generateCommitRecord({ baseBranch: 'prod', branch: 'some-feature' }),
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
      expect(result).toEqual(expectedResult);
    });

    test('save commit record, change report status', async () => {
      const gitVars: GitVars = { branch: 'main', commitSha: '18723' };

      const saveReportResult: CreateCommitRecordResponse = {
        linkToReport: 'link',
        record: generateCommitRecord({
          branch: 'main',
          files: [{ ...generateDiffReportResult.files[0], maxSize: 50 }],
        }),
        baseRecord: generateCommitRecord({ branch: 'main' }),
      };
      jest.mocked(createCommitRecord).mockResolvedValue(saveReportResult);

      const config = generateNormalizedConfigRemoteOn({ gitVars });

      const result = await generateReport(config, { files: [{ ...localFiles[0], maxSize: 50 }], groups: localGroups });

      const expectedResult: Report = {
        ...generateDiffReportResult,
        files: [
          {
            ...generateDiffReportResult.files[0],
            maxSize: 50,
            status: Status.Fail,
            failReasons: [FailReason.MaxSize],
          },
        ],
        metadata: {
          ...saveReportResult,
        },
        status: Status.Pass,
      };

      expect(result).toEqual(expectedResult);
    });

    test('save commit record, with base branch, fail report', async () => {
      const gitVars: GitVars = { branch: 'some-feature', commitSha: '18723' };

      const saveReportResult: CreateCommitRecordResponse = {
        linkToReport: 'link',
        record: generateCommitRecord({
          baseBranch: 'main',
          branch: 'some-feature',
          prNumber: '1',
          files: [{ ...generateDiffReportResult.files[0], maxSize: 50 }],
        }),
        baseRecord: generateCommitRecord({ branch: 'main' }),
      };
      jest.mocked(createCommitRecord).mockResolvedValue(saveReportResult);

      const config = generateNormalizedConfigRemoteOn({ gitVars });

      const result = await generateReport(config, { files: [{ ...localFiles[0], maxSize: 50 }], groups: localGroups });

      const expectedResult: Report = {
        ...generateDiffReportResult,
        files: [
          {
            ...generateDiffReportResult.files[0],
            maxSize: 50,
            status: Status.Fail,
            failReasons: [FailReason.MaxSize],
          },
        ],
        metadata: {
          ...saveReportResult,
        },
        status: Status.Fail,
      };

      expect(result).toEqual(expectedResult);
    });

    test('save commit record, include commit message', async () => {
      const gitVars: GitVars = { branch: 'some-feature', commitSha: '18723', commitMsg: 'msg msg' };
      const saveReportResult: CreateCommitRecordResponse = {
        linkToReport: 'link',
        record: generateCommitRecord({ baseBranch: 'prod', branch: 'some-feature' }),
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
      expect(result).toEqual(undefined);
    });
  });
});
