import type { Provider } from '../types';
import { envVarsListToObject, getEnvVar } from '../../utils';

// https://circleci.com/docs/2.0/env-vars/#built-in-environment-variables

const provider: Provider = {
  isItMe: getEnvVar('CIRCLECI') === 'true',
  getVars: () => {
    const raw = envVarsListToObject([
      'CIRCLE_PROJECT_USERNAME',
      'CIRCLE_PROJECT_REPONAME',
      'CIRCLE_BRANCH',
      'CIRCLE_SHA1',
      'CIRCLE_PULL_REQUEST',
    ] as const);

    return {
      raw,
      ci: true,
      provider: 'circleci',
      owner: raw.CIRCLE_PROJECT_USERNAME,
      repo: raw.CIRCLE_PROJECT_REPONAME,
      branch: raw.CIRCLE_BRANCH,
      commitSha: raw.CIRCLE_SHA1,
      // target branch not available in CircleCI
      // https://ideas.circleci.com/cloud-feature-requests/p/provide-env-variable-for-branch-name-targeted-by-pull-request
      // use CI_TARGET_BRANCH to override
      targetBranch: undefined,
      prNumber: raw.CIRCLE_PULL_REQUEST?.split('/').pop(),
    };
  },
};

export default provider;
