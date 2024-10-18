import providers from './providers';
import { envVarsListToObject } from '../utils';
import type { CIEnvVars } from './types';

const rawOverrideVars = envVarsListToObject([
  'CI',
  'CI_REPO_OWNER',
  'CI_REPO_NAME',
  'CI_BRANCH',
  'CI_COMMIT_SHA',
  'CI_TARGET_BRANCH',
  'CI_PR_NUMBER',
  'CI_COMMIT_MESSAGE',
] as const);

const overrideVars: CIEnvVars = {
  raw: rawOverrideVars,
  ci: rawOverrideVars.CI === 'true',
  provider: undefined,
  owner: rawOverrideVars.CI_REPO_OWNER,
  repo: rawOverrideVars.CI_REPO_NAME,
  branch: rawOverrideVars.CI_BRANCH,
  commitSha: rawOverrideVars.CI_COMMIT_SHA,
  targetBranch: rawOverrideVars.CI_TARGET_BRANCH,
  prNumber: rawOverrideVars.CI_PR_NUMBER,
  commitMsg: rawOverrideVars.CI_COMMIT_MESSAGE,
};

const providerVars = providers.find((p) => p.isItMe)?.getVars();
const vars = { ...overrideVars };

if (providerVars) {
  // Use provider var if override var is undefined
  (Object.keys(providerVars) as (keyof CIEnvVars)[]).forEach((varName) => {
    // @ts-expect-error bad types
    vars[varName] = vars[varName] ?? providerVars[varName];
  });

  vars.raw = {
    ...providerVars.raw,
    ...overrideVars.raw,
  };
}

export const getCIVars = () => {
  return vars;
};

export default vars;

const { ci, provider, owner, repo, branch, commitSha, prNumber, targetBranch } = vars;

export { ci, provider, owner, repo, branch, commitSha, prNumber, targetBranch };
