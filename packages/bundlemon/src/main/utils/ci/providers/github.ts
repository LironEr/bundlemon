import type { Provider } from '../types';
import { getEnvVar } from '../utils';

// https://docs.github.com/en/actions/configuring-and-managing-workflows/using-environment-variables#default-environment-variables

const provider: Provider = {
  isItMe: !!getEnvVar('GITHUB_ACTION'),
  getVars: () => {
    const fullRepoName = getEnvVar('GITHUB_REPOSITORY');
    const [owner, repo] = fullRepoName?.split('/') ?? [undefined, undefined];

    const event = getEnvVar('GITHUB_EVENT_NAME') as undefined | '' | 'pull_request' | 'push';
    const isPr = event === 'pull_request';
    const ref = getEnvVar('GITHUB_REF')?.split('/');

    return {
      owner,
      repo,
      branch: isPr ? getEnvVar('GITHUB_HEAD_REF') : ref?.slice(2).join('/'),
      commitSha: getEnvVar('GITHUB_SHA'),
      targetBranch: getEnvVar('GITHUB_BASE_REF'),
      prNumber: isPr ? ref?.[2] : undefined,
    };
  },
};

export default provider;
