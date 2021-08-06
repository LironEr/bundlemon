import { when } from 'jest-when';
import { mocked } from 'ts-jest/utils';
import { EnvVar } from '../../../common/consts';
import { GithubActionsAuthHeaders, ProjectAuthHeaders } from '../../types';
import { CIEnvVars } from '../ci/types';
import { getAuthHeaders } from '../configUtils';
import { getEnvVar } from '../../utils/utils';
import { generateRandomString } from './configUtils';

jest.mock('../../utils/utils', () => ({
  __esModule: true,
  getEnvVar: jest.fn(),
}));

describe('config utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('no headers', async () => {
    const mockedGetEnvVar = mocked(getEnvVar).mockReturnValue(undefined);
    when(mockedGetEnvVar).calledWith(EnvVar.projectApiKey).mockReturnValue(undefined);

    const authHeaders = getAuthHeaders({ ci: true }) as ProjectAuthHeaders;

    expect(authHeaders).toEqual(undefined);
    expect(mockedGetEnvVar).toBeCalledWith(EnvVar.projectApiKey);
  });

  describe('getAuthHeaders', () => {
    describe('API key', () => {
      test('success', async () => {
        const apiKey = generateRandomString();
        const mockedGetEnvVar = mocked(getEnvVar).mockReturnValue(undefined);
        when(mockedGetEnvVar).calledWith(EnvVar.projectApiKey).mockReturnValue(apiKey);

        const authHeaders = getAuthHeaders({ ci: true }) as ProjectAuthHeaders;

        const expected: ProjectAuthHeaders = {
          'BundleMon-Auth-Type': 'API_KEY',
          'x-api-key': apiKey,
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

        const authHeaders = getAuthHeaders(ciVars) as ProjectAuthHeaders;

        const expected: ProjectAuthHeaders = {
          'BundleMon-Auth-Type': 'API_KEY',
          'x-api-key': apiKey,
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

        const authHeaders = getAuthHeaders(ciVars) as GithubActionsAuthHeaders;

        const expected: GithubActionsAuthHeaders = {
          'BundleMon-Auth-Type': 'GITHUB_ACTION',
          'GitHub-Owner': 'LironEr',
          'GitHub-Repo': 'BundleMon',
          'GitHub-Run-ID': '12312324',
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

        const authHeaders = getAuthHeaders(ciVars) as GithubActionsAuthHeaders;

        expect(authHeaders).toEqual(undefined);
        expect(mockedGetEnvVar).toBeCalledWith(EnvVar.projectApiKey);
      });
    });
  });
});
