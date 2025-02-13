import { when } from 'jest-when';

import { CreateCommitRecordAuthType, EnvVar } from '../../../common/consts';
import { validateConfig, getCreateCommitRecordAuthParams, getProjectId } from '../configUtils';
import { getEnvVar } from '../../utils/utils';
import { generateRandomString } from './configUtils';
import { getOrCreateProjectId } from '../../../common/service';
import type { CIEnvVars } from '../ci/types';
import type {
  CreateCommitRecordGithubActionsAuthQuery,
  CreateCommitRecordProjectApiKeyAuthQuery,
  PathLabels,
} from '../../types';
import { ProjectProvider } from 'bundlemon-utils';

jest.mock('../../utils/utils', () => ({
  __esModule: true,
  getEnvVar: jest.fn(),
  envVarsListToObject: jest.fn().mockReturnValue({}),
}));
jest.mock('../../../common/service');

describe('config utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('validateConfig', () => {
    test('undefined', () => {
      expect(validateConfig(undefined)).toStrictEqual({
        baseDir: undefined,
        defaultCompression: undefined,
        files: undefined,
        groups: undefined,
        includeCommitMessage: undefined,
        pathLabels: undefined,
        reportOutput: undefined,
        subProject: undefined,
        verbose: undefined,
        disableRemote: undefined
      });
    });

    test('empty object', () => {
      expect(validateConfig({})).toStrictEqual({});
    });

    test('invalid config', () => {
      expect(validateConfig('')).toStrictEqual(undefined);
    });

    describe('pathLabels', () => {
      test('undefined', () => {
        expect(validateConfig({ pathLabels: undefined })).toStrictEqual({ pathLabels: undefined });
      });

      test('with some values', () => {
        const pathLabels: PathLabels = {
          chunkId: '[\\w-]+',
        };

        expect(validateConfig({ pathLabels })).toStrictEqual({
          pathLabels,
        });
      });

      test('bad keys', () => {
        expect(
          validateConfig({
            pathLabels: {
              chunkId1: '[\\w-]+',
            },
          })
        ).toStrictEqual(undefined);

        expect(
          validateConfig({
            pathLabels: {
              1: '[\\w-]+',
            },
          })
        ).toStrictEqual(undefined);

        expect(
          validateConfig({
            pathLabels: {
              chunkIddddddddddddddddd: '[\\w-]+',
            },
          })
        ).toStrictEqual(undefined);
      });

      test('bad values', () => {
        expect(
          validateConfig({
            pathLabels: {
              chunkId: 1,
            },
          })
        ).toStrictEqual(undefined);

        expect(
          validateConfig({
            pathLabels: {
              chunkId: true,
            },
          })
        ).toStrictEqual(undefined);
      });
    });
  });

  describe('getCreateCommitRecordAuthParams', () => {
    test('no auth params', async () => {
      const mockedGetEnvVar = jest.mocked(getEnvVar).mockReturnValue(undefined);
      when(mockedGetEnvVar).calledWith(EnvVar.projectApiKey).mockReturnValue(undefined);

      const authHeaders = getCreateCommitRecordAuthParams({ ci: true });

      expect(authHeaders).toEqual(undefined);
      expect(mockedGetEnvVar).toHaveBeenCalledWith(EnvVar.projectApiKey);
    });

    describe('API key', () => {
      test('success', async () => {
        const apiKey = generateRandomString();
        const mockedGetEnvVar = jest.mocked(getEnvVar).mockReturnValue(undefined);
        when(mockedGetEnvVar).calledWith(EnvVar.projectApiKey).mockReturnValue(apiKey);

        const authHeaders = getCreateCommitRecordAuthParams({ ci: true });

        const expected: CreateCommitRecordProjectApiKeyAuthQuery = {
          authType: CreateCommitRecordAuthType.ProjectApiKey,
          token: apiKey,
        };

        expect(authHeaders).toEqual(expected);
        expect(mockedGetEnvVar).toHaveBeenCalledWith(EnvVar.projectApiKey);
      });

      test('prioritize API key', async () => {
        const apiKey = generateRandomString();
        const mockedGetEnvVar = jest.mocked(getEnvVar).mockReturnValue(undefined);
        when(mockedGetEnvVar).calledWith(EnvVar.projectApiKey).mockReturnValue(apiKey);

        const ciVars: CIEnvVars = {
          ci: true,
          provider: 'github',
          owner: 'LironEr',
          repo: 'BundleMon',
          buildId: '12312324',
        };

        const authHeaders = getCreateCommitRecordAuthParams(ciVars);

        const expected: CreateCommitRecordProjectApiKeyAuthQuery = {
          authType: CreateCommitRecordAuthType.ProjectApiKey,
          token: apiKey,
        };

        expect(authHeaders).toEqual(expected);
        expect(mockedGetEnvVar).toHaveBeenCalledWith(EnvVar.projectApiKey);
      });
    });

    describe('github action', () => {
      test('success', async () => {
        const mockedGetEnvVar = jest.mocked(getEnvVar).mockReturnValue(undefined);
        when(mockedGetEnvVar).calledWith(EnvVar.projectApiKey).mockReturnValue(undefined);

        const ciVars: CIEnvVars = {
          ci: true,
          provider: 'github',
          owner: 'LironEr',
          repo: 'BundleMon',
          buildId: '12312324',
        };

        const authHeaders = getCreateCommitRecordAuthParams(ciVars);

        const expected: CreateCommitRecordGithubActionsAuthQuery = {
          authType: CreateCommitRecordAuthType.GithubActions,
          runId: '12312324',
        };

        expect(authHeaders).toEqual(expected);
        expect(mockedGetEnvVar).toHaveBeenCalledWith(EnvVar.projectApiKey);
      });

      const removeKeys: (keyof CIEnvVars)[] = ['owner', 'repo', 'buildId'];
      test.each(removeKeys)('missing %s', async (ciVar) => {
        const mockedGetEnvVar = jest.mocked(getEnvVar).mockReturnValue(undefined);
        when(mockedGetEnvVar).calledWith(EnvVar.projectApiKey).mockReturnValue(undefined);

        const ciVars: CIEnvVars = {
          ci: true,
          provider: 'github',
          owner: 'LironEr',
          repo: 'BundleMon',
          buildId: '12312324',
        };

        delete ciVars[ciVar];

        const authHeaders = getCreateCommitRecordAuthParams(ciVars);

        expect(authHeaders).toEqual(undefined);
        expect(mockedGetEnvVar).toHaveBeenCalledWith(EnvVar.projectApiKey);
      });
    });
  });

  describe('getProjectId', () => {
    test('project id in env var', async () => {
      const expectedProjectId = generateRandomString();
      const mockedGetEnvVar = jest.mocked(getEnvVar).mockReturnValue(undefined);
      when(mockedGetEnvVar).calledWith(EnvVar.projectId).mockReturnValue(expectedProjectId);

      const ciVars: CIEnvVars = {
        ci: true,
        provider: 'github',
        owner: 'LironEr',
        repo: 'BundleMon',
        buildId: '12312324',
        commitSha: generateRandomString(),
      };

      const actual = await getProjectId(ciVars);

      expect(actual).toEqual(expectedProjectId);
      expect(mockedGetEnvVar).toHaveBeenCalledWith(EnvVar.projectId);
      expect(getOrCreateProjectId).toHaveBeenCalledTimes(0);
    });

    test('no project id in env, without supported provider', async () => {
      const mockedGetEnvVar = jest.mocked(getEnvVar).mockReturnValue(undefined);
      when(mockedGetEnvVar).calledWith(EnvVar.projectId).mockReturnValue(undefined);

      const ciVars: CIEnvVars = {
        ci: true,
        provider: 'codefresh',
        owner: 'LironEr',
        repo: 'BundleMon',
        buildId: '12312324',
        commitSha: generateRandomString(),
      };

      const actual = await getProjectId(ciVars);

      expect(actual).toBeUndefined();
      expect(mockedGetEnvVar).toHaveBeenCalledWith(EnvVar.projectId);
      expect(getOrCreateProjectId).toHaveBeenCalledTimes(0);
    });

    describe('GitHub provider', () => {
      test('success', async () => {
        const expectedProjectId = generateRandomString();
        jest.mocked(getEnvVar).mockReturnValue(undefined);
        jest.mocked(getOrCreateProjectId).mockResolvedValue(expectedProjectId);

        const ciVars: CIEnvVars = {
          ci: true,
          provider: 'github',
          owner: 'LironEr',
          repo: 'BundleMon',
          buildId: '12312324',
          commitSha: generateRandomString(),
        };

        const actual = await getProjectId(ciVars);

        expect(actual).toEqual(expectedProjectId);
        expect(getOrCreateProjectId).toHaveBeenCalledWith(
          { provider: ProjectProvider.GitHub, owner: ciVars.owner, repo: ciVars.repo },
          { runId: ciVars.buildId, commitSha: ciVars.commitSha }
        );
      });

      test('failed', async () => {
        jest.mocked(getEnvVar).mockReturnValue(undefined);
        jest.mocked(getOrCreateProjectId).mockResolvedValue(undefined);

        const ciVars: CIEnvVars = {
          ci: true,
          provider: 'github',
          owner: 'LironEr',
          repo: 'BundleMon',
          buildId: '12312324',
          commitSha: generateRandomString(),
        };

        const actual = await getProjectId(ciVars);

        expect(actual).toBeUndefined();
        expect(getOrCreateProjectId).toHaveBeenCalledWith(
          { provider: ProjectProvider.GitHub, owner: ciVars.owner, repo: ciVars.repo },
          { runId: ciVars.buildId, commitSha: ciVars.commitSha }
        );
      });

      const removeKeys: (keyof CIEnvVars)[] = ['owner', 'repo', 'buildId', 'commitSha'];
      test.each(removeKeys)('missing %s', async (ciVar) => {
        jest.mocked(getEnvVar).mockReturnValue(undefined);

        const ciVars: CIEnvVars = {
          ci: true,
          provider: 'github',
          owner: 'LironEr',
          repo: 'BundleMon',
          buildId: '12312324',
          commitSha: generateRandomString(),
        };

        delete ciVars[ciVar];

        const actual = await getProjectId(ciVars);

        expect(actual).toBeUndefined();
        expect(getOrCreateProjectId).toHaveBeenCalledTimes(0);
      });
    });
  });
});
