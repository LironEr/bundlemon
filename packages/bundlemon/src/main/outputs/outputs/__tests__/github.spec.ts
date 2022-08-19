import { validateOptions, GithubOutputOptions, GithubOutputPostOption } from '../github';

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
});
