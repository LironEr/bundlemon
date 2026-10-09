import { Report, Status } from 'bundlemon-utils';
import githubOutput, {
  validateOptions,
  GithubOutputOptions,
  GithubOutputPostOption,
  shouldPostOutput,
} from '../github';
import { serviceClient } from '../../../../common/service';

import type { NormalizedConfig } from '../../../types';

jest.mock('../../../../common/service', () => ({ serviceClient: { post: jest.fn() } }));
jest.mock('../../../utils/ci', () => ({
  owner: 'owner',
  repo: 'repo',
  getCIVars: () => ({ provider: 'github', buildId: 'run-id' }),
}));

describe('github output', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('validateOptions', () => {
    const defaultOptions: GithubOutputOptions = {
      checkRun: false,
      commitStatus: true,
      prComment: true,
    };
    test.each([
      { name: 'undefined', options: undefined, expected: defaultOptions },
      { name: 'empty object', options: {}, expected: defaultOptions },
      {
        name: 'only checkrun: true',
        options: { checkRun: true },
        expected: {
          checkRun: true,
          commitStatus: true, // default value
          prComment: true, // default value
        },
      },
      {
        name: 'checkrun: true, prComment: false',
        options: { checkRun: true, prComment: false },
        expected: {
          checkRun: true,
          commitStatus: true, // default value
          prComment: false,
        },
      },
      {
        name: `checkrun: ${GithubOutputPostOption.Off}, prComment: ${GithubOutputPostOption.OnFailure}`,
        options: { checkRun: GithubOutputPostOption.Off, prComment: GithubOutputPostOption.OnFailure },
        expected: {
          checkRun: GithubOutputPostOption.Off,
          commitStatus: true, // default value
          prComment: GithubOutputPostOption.OnFailure,
        },
      },
      {
        name: `commitStatus: ${GithubOutputPostOption.Always}, prComment: ${GithubOutputPostOption.OnFailure}`,
        options: { commitStatus: GithubOutputPostOption.Always, prComment: GithubOutputPostOption.OnFailure },
        expected: {
          checkRun: false, // default value
          commitStatus: GithubOutputPostOption.Always,
          prComment: GithubOutputPostOption.OnFailure,
        },
      },
      {
        name: `checkrun: ${GithubOutputPostOption.PROnly}, prComment: ${GithubOutputPostOption.PROnly}`,
        options: { checkRun: GithubOutputPostOption.PROnly, prComment: GithubOutputPostOption.PROnly },
        expected: {
          checkRun: GithubOutputPostOption.PROnly,
          commitStatus: true, // default value
          prComment: GithubOutputPostOption.PROnly,
        },
      },
      {
        name: 'unsupported value',
        options: 'string',
        expected: undefined,
      },
      { name: 'remove additional options', options: { a: 'something' }, expected: defaultOptions },
      {
        name: 'remove additional options',
        options: { commitStatus: GithubOutputPostOption.Always, PRComment: false },
        expected: {
          checkRun: false, // default value
          commitStatus: GithubOutputPostOption.Always,
          prComment: true, // default value
        },
      },
    ])('$name', async ({ options, expected }) => {
      const result = validateOptions(options);

      expect(result).toEqual(expected);
    });
  });

  describe('shouldPostOutput', () => {
    const report: Report = {
      files: [],
      groups: [],
      stats: {} as any,
      metadata: {},
      status: Status.Pass,
    };

    test('true', () => {
      const result = shouldPostOutput(true, report);

      expect(result).toEqual(true);
    });

    test('always', () => {
      const result = shouldPostOutput(GithubOutputPostOption.Always, report);

      expect(result).toEqual(true);
    });

    test('false', () => {
      const result = shouldPostOutput(false, { ...report, status: Status.Fail });

      expect(result).toEqual(false);
    });

    test('off', () => {
      const result = shouldPostOutput(GithubOutputPostOption.Off, report);

      expect(result).toEqual(false);
    });

    test('on failure -> report failed', () => {
      const result = shouldPostOutput(GithubOutputPostOption.OnFailure, { ...report, status: Status.Fail });

      expect(result).toEqual(true);
    });

    test('on failure -> report pass', () => {
      const result = shouldPostOutput(GithubOutputPostOption.OnFailure, { ...report, status: Status.Pass });

      expect(result).toEqual(false);
    });

    test('pr only -> report without PR number', () => {
      const result = shouldPostOutput(GithubOutputPostOption.PROnly, { ...report, metadata: { record: {} as any } });

      expect(result).toEqual(false);
    });

    test('pr only -> report with PR number', () => {
      const result = shouldPostOutput(GithubOutputPostOption.PROnly, {
        ...report,
        metadata: { record: { prNumber: '1' } as any },
      });

      expect(result).toEqual(true);
    });
  });

  describe('generate', () => {
    const createConfig = (prNumber?: string) =>
      ({ remote: true, projectId: 'project-id', gitVars: { commitSha: 'sha', prNumber } }) as NormalizedConfig;

    const createReport = (status: Status, prNumber?: string): Report => ({
      files: [],
      groups: [],
      stats: {} as any,
      metadata: { record: { id: 'record-id', prNumber } as any },
      status,
    });

    const generate = async (options: unknown, report: Report, prNumber?: string) => {
      const instance = await githubOutput.create({ options, config: createConfig(prNumber) } as any);

      if (!instance) {
        throw new Error('github output was not created');
      }

      await instance.generate(report);
    };

    beforeEach(() => {
      jest.mocked(serviceClient.post).mockResolvedValue({ data: {} });
    });

    test('skip request when nothing to post (on-failure with passing report)', async () => {
      const options = {
        checkRun: GithubOutputPostOption.OnFailure,
        commitStatus: GithubOutputPostOption.OnFailure,
        prComment: GithubOutputPostOption.OnFailure,
      };

      await generate(options, createReport(Status.Pass), '1');

      expect(serviceClient.post).not.toHaveBeenCalled();
    });

    test('skip request when nothing to post (pr-only on a push build)', async () => {
      const options = {
        checkRun: GithubOutputPostOption.PROnly,
        commitStatus: GithubOutputPostOption.PROnly,
        prComment: GithubOutputPostOption.PROnly,
      };

      await generate(options, createReport(Status.Pass));

      expect(serviceClient.post).not.toHaveBeenCalled();
    });

    test('skip request when only prComment is enabled on a non PR build', async () => {
      await generate({ checkRun: false, commitStatus: false, prComment: true }, createReport(Status.Pass));

      expect(serviceClient.post).not.toHaveBeenCalled();
    });

    test('prComment is false when there is no PR number', async () => {
      await generate({ checkRun: false, commitStatus: true, prComment: true }, createReport(Status.Pass));

      expect(serviceClient.post).toHaveBeenCalledTimes(1);
      expect(jest.mocked(serviceClient.post).mock.calls[0][1]).toMatchObject({
        output: { checkRun: false, commitStatus: true, prComment: false },
      });
    });

    test('send all enabled outputs on a PR build', async () => {
      await generate({ checkRun: true, commitStatus: true, prComment: true }, createReport(Status.Pass, '1'), '1');

      expect(serviceClient.post).toHaveBeenCalledTimes(1);
      expect(jest.mocked(serviceClient.post).mock.calls[0]).toEqual([
        'projects/project-id/commit-records/record-id/outputs/github',
        expect.objectContaining({ output: { checkRun: true, commitStatus: true, prComment: true } }),
      ]);
    });
  });
});
