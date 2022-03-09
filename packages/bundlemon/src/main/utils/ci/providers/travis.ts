import type { Provider } from '../types';
import { getEnvVar } from '../../utils';

// https://docs.travis-ci.com/user/environment-variables#default-environment-variables

const provider: Provider = {
  isItMe: getEnvVar('TRAVIS') === 'true',
  getVars: () => {
    const fullRepoName = getEnvVar('TRAVIS_REPO_SLUG');
    const [owner, repo] = fullRepoName?.split('/') ?? [undefined, undefined];

    const isPushEvent = getEnvVar('TRAVIS_EVENT_TYPE') === 'push';
    const prNumber = getEnvVar('TRAVIS_PULL_REQUEST');

    return {
      ci: true,
      provider: 'travis',
      owner,
      repo,
      branch: isPushEvent ? getEnvVar('TRAVIS_BRANCH') : getEnvVar('TRAVIS_PULL_REQUEST_BRANCH'),
      commitSha: getEnvVar('TRAVIS_COMMIT'),
      targetBranch: isPushEvent ? undefined : getEnvVar('TRAVIS_BRANCH'),
      prNumber: prNumber === 'false' ? undefined : prNumber, // "false" if it’s not a pull request, set as undefined
    };
  },
};

export default provider;
