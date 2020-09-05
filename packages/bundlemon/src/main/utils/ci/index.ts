import * as envCI from 'env-ci';
import { CIEnvVars } from './types';

function getServiceVars(): CIEnvVars {
  const CIVars: any = envCI();

  const [owner, repo] = CIVars.slug?.split('/') ?? [undefined, undefined];

  const branch = CIVars.isPr ? CIVars.prBranch : CIVars.branch;
  const targetBranch = CIVars.isPr ? CIVars.prBranch : undefined;

  return {
    owner,
    repo,
    branch,
    commitSha: CIVars.commit,
    targetBranch,
    prNumber: CIVars.pr,
  };
}

const serviceVars = getServiceVars();

const vars = {
  owner: process.env.CI_REPO_OWNER || serviceVars.owner,
  repo: process.env.CI_REPO_NAME || serviceVars.repo,
  branch: process.env.CI_BRANCH || serviceVars.branch,
  commitSha: process.env.CI_COMMIT_SHA || serviceVars.commitSha,
  targetBranch: process.env.CI_TARGET_BRANCH || serviceVars.targetBranch,
  prNumber: process.env.CI_PR_NUMBER || serviceVars.prNumber,
};

export default vars;

const { owner, repo, branch, commitSha, prNumber, targetBranch } = vars;

export { owner, repo, branch, commitSha, prNumber, targetBranch };
