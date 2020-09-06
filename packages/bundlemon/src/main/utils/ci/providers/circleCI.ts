import type { Provider } from '../types';
import { getEnvVar } from '../utils';

// https://circleci.com/docs/2.0/env-vars/#built-in-environment-variables

const provider: Provider = {
  isItMe: getEnvVar('CIRCLECI') === 'true',
  getVars: () => ({
    owner: getEnvVar('CIRCLE_PROJECT_USERNAME'),
    repo: getEnvVar('CIRCLE_PROJECT_REPONAME'),
    branch: getEnvVar('CIRCLE_BRANCH'),
    commitSha: getEnvVar('CIRCLE_SHA1'),
    // target branch not available in CircleCI
    // https://ideas.circleci.com/cloud-feature-requests/p/provide-env-variable-for-branch-name-targeted-by-pull-request
    // use CI_TARGET_BRANCH to override
    targetBranch: undefined,
    prNumber: getEnvVar('CIRCLE_PULL_REQUEST')?.split('/').pop(),
  }),
};

export default provider;
