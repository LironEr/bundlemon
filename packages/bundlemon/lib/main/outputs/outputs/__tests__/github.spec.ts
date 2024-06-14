import { Report, Status } from 'bundlemon-utils';
import { validateOptions, GithubOutputOptions, GithubOutputPostOption, shouldPostOutput } from '../github';

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
});
