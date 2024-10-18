import type { Provider } from '../types';
import { getEnvVar, envVarsListToObject } from '../../utils';

// https://docs.github.com/en/actions/configuring-and-managing-workflows/using-environment-variables#default-environment-variables

type GitHubEvent = undefined | '' | 'pull_request' | 'push';

const provider: Provider = {
  isItMe: !!getEnvVar('GITHUB_ACTION'),
  getVars: () => {
    const raw = envVarsListToObject([
      'GITHUB_REPOSITORY',
      'GITHUB_EVENT_NAME',
      'GITHUB_REF',
      'GITHUB_HEAD_REF',
      'GITHUB_SHA',
      'GITHUB_BASE_REF',
      'GITHUB_RUN_ID',
    ] as const);

    const fullRepoName = raw.GITHUB_REPOSITORY;

    const [owner, repo] = fullRepoName?.split('/') ?? [undefined, undefined];

    const event = raw.GITHUB_EVENT_NAME as GitHubEvent;
    const isPr = event === 'pull_request';
    const ref = raw.GITHUB_REF?.split('/');

    return {
      raw,
      ci: true,
      provider: 'github',
      owner,
      repo,
      branch: isPr ? raw.GITHUB_HEAD_REF : ref?.slice(2).join('/'),
      commitSha: raw.GITHUB_SHA,
      targetBranch: raw.GITHUB_BASE_REF,
      prNumber: isPr ? ref?.[2] : undefined,
      buildId: raw.GITHUB_RUN_ID,
    };
  },
};

export default provider;
