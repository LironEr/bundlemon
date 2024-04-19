import type { Provider } from '../types';
import { getEnvVar } from '../../utils';

// https://codefresh.io/docs/docs/codefresh-yaml/variables/#system-provided-variables

const provider: Provider = {
  isItMe: !!getEnvVar('CF_BUILD_URL'),
  getVars: () => ({
    ci: true,
    provider: 'codefresh',
    owner: getEnvVar('CF_REPO_OWNER'),
    repo: getEnvVar('CF_REPO_NAME'),
    branch: getEnvVar('CF_BRANCH'),
    commitSha: getEnvVar('CF_REVISION'),
    targetBranch: getEnvVar('CF_PULL_REQUEST_TARGET'),
    prNumber: getEnvVar('CF_PULL_REQUEST_NUMBER'),
    commitMsg: getEnvVar('CF_COMMIT_MESSAGE'),
  }),
};

export default provider;
