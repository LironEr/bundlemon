import { when } from 'jest-when';
import { mocked } from 'ts-jest/utils';
import { CreateCommitRecordAuthType, EnvVar } from '../../../common/consts';
import { getCreateCommitRecordAuthParams } from '../configUtils';
import { getEnvVar } from '../../utils/utils';
import { generateRandomString } from './configUtils';
import type { CIEnvVars } from '../ci/types';
import type { CreateCommitRecordGithubActionsAuthQuery, CreateCommitRecordProjectApiKeyAuthQuery } from '../../types';

jest.mock('../../utils/utils', () => ({
  __esModule: true,
  getEnvVar: jest.fn(),
}));

describe('config utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getCreateCommitRecordAuthParams', () => {
    test('no auth params', async () => {
      const mockedGetEnvVar = mocked(getEnvVar).mockReturnValue(undefined);
      when(mockedGetEnvVar).calledWith(EnvVar.projectApiKey).mockReturnValue(undefined);

      const authHeaders = getCreateCommitRecordAuthParams({ ci: true });

      expect(authHeaders).toEqual(undefined);
      expect(mockedGetEnvVar).toBeCalledWith(EnvVar.projectApiKey);
    });

    describe('API key', () => {
      test('success', async () => {
        const apiKey = generateRandomString();
        const mockedGetEnvVar = mocked(getEnvVar).mockReturnValue(undefined);
        when(mockedGetEnvVar).calledWith(EnvVar.projectApiKey).mockReturnValue(apiKey);

        const authHeaders = getCreateCommitRecordAuthParams({ ci: true });

        const expected: CreateCommitRecordProjectApiKeyAuthQuery = {
          authType: CreateCommitRecordAuthType.ProjectApiKey,
          token: apiKey,
        };

        expect(authHeaders).toEqual(expected);
        expect(mockedGetEnvVar).toBeCalledWith(EnvVar.projectApiKey);
      });

      test('prioritize API key', async () => {
        const apiKey = generateRandomString();
        const mockedGetEnvVar = mocked(getEnvVar).mockReturnValue(undefined);
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
        expect(mockedGetEnvVar).toBeCalledWith(EnvVar.projectApiKey);
      });
    });

    describe('github action', () => {
      test('success', async () => {
        const mockedGetEnvVar = mocked(getEnvVar).mockReturnValue(undefined);
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
        expect(mockedGetEnvVar).toBeCalledWith(EnvVar.projectApiKey);
      });

      const removeKeys: (keyof CIEnvVars)[] = ['owner', 'repo', 'buildId'];
      test.each(removeKeys)('missing %s', async (ciVar) => {
        const mockedGetEnvVar = mocked(getEnvVar).mockReturnValue(undefined);
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
        expect(mockedGetEnvVar).toBeCalledWith(EnvVar.projectApiKey);
      });
    });
  });
});
