import providers from './providers';
import { getEnvVar } from './utils';
import type { CIEnvVars } from './types';

const overrideVars: CIEnvVars = {
  ci: getEnvVar('CI') === 'true',
  owner: getEnvVar('CI_REPO_OWNER'),
  repo: getEnvVar('CI_REPO_NAME'),
  branch: getEnvVar('CI_BRANCH'),
  commitSha: getEnvVar('CI_COMMIT_SHA'),
  targetBranch: getEnvVar('CI_TARGET_BRANCH'),
  prNumber: getEnvVar('CI_PR_NUMBER'),
};

const providerVars = providers.find((p) => p.isItMe)?.getVars();

const vars = { ...overrideVars };

if (providerVars) {
  // Use provider var if override var is undefined
  (Object.keys(providerVars) as (keyof CIEnvVars)[]).forEach((varName) => {
    // @ts-ignore
    vars[varName] = vars[varName] ?? providerVars[varName];
  });
}

export default vars;

const { ci, owner, repo, branch, commitSha, prNumber, targetBranch } = vars;

export { ci, owner, repo, branch, commitSha, prNumber, targetBranch };
