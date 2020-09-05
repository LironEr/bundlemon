import providers from './providers';
import { getEnvVar } from './utils';
import type { CIEnvVars } from './types';

const overrideVars: CIEnvVars = {
  owner: getEnvVar('CI_REPO_OWNER'),
  repo: getEnvVar('CI_REPO_NAME'),
  branch: getEnvVar('CI_BRANCH'),
  commitSha: getEnvVar('CI_COMMIT_SHA'),
  targetBranch: getEnvVar('CI_TARGET_BRANCH'),
  prNumber: getEnvVar('CI_PR_NUMBER'),
};

const provider = providers.find((p) => p.isItMe);

const vars: CIEnvVars = { ...provider?.getVars(), ...overrideVars };

export default vars;

const { owner, repo, branch, commitSha, prNumber, targetBranch } = vars;

export { owner, repo, branch, commitSha, prNumber, targetBranch };
