import type { Provider } from '../types';
import { envVarsListToObject, getEnvVar } from '../../utils';

// https://docs.travis-ci.com/user/environment-variables#default-environment-variables

const provider: Provider = {
  isItMe: getEnvVar('TRAVIS') === 'true',
  getVars: () => {
    const raw = envVarsListToObject([
      'TRAVIS_REPO_SLUG',
      'TRAVIS_EVENT_TYPE',
      'TRAVIS_PULL_REQUEST',
      'TRAVIS_BRANCH',
      'TRAVIS_PULL_REQUEST_BRANCH',
      'TRAVIS_COMMIT',
      'TRAVIS_COMMIT_MESSAGE',
    ] as const);

    const fullRepoName = raw.TRAVIS_REPO_SLUG;
    const [owner, repo] = fullRepoName?.split('/') ?? [undefined, undefined];

    const isPushEvent = raw.TRAVIS_EVENT_TYPE === 'push';
    const prNumber = raw.TRAVIS_PULL_REQUEST;

    return {
      raw,
      ci: true,
      provider: 'travis',
      owner,
      repo,
      branch: isPushEvent ? raw.TRAVIS_BRANCH : raw.TRAVIS_PULL_REQUEST_BRANCH,
      commitSha: raw.TRAVIS_COMMIT,
      targetBranch: isPushEvent ? undefined : raw.TRAVIS_BRANCH,
      prNumber: prNumber === 'false' ? undefined : prNumber, // "false" if it’s not a pull request, set as undefined
      commitMsg: raw.TRAVIS_COMMIT_MESSAGE,
    };
  },
};

export default provider;
