export interface CIEnvVars {
  ci: boolean;
  raw?: Record<string, string | undefined>;
  provider?: 'github' | 'codefresh' | 'travis' | 'circleci';
  owner?: string;
  repo?: string;
  branch?: string;
  commitSha?: string;
  targetBranch?: string;
  prNumber?: string;
  buildId?: string;
  commitMsg?: string;
}

export interface Provider {
  isItMe: boolean;
  getVars: () => CIEnvVars;
}
