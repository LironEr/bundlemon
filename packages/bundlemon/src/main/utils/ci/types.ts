export interface CIEnvVars {
  ci: boolean;
  owner?: string;
  repo?: string;
  branch?: string;
  commitSha?: string;
  targetBranch?: string;
  prNumber?: string;
}

export interface Provider {
  isItMe: boolean;
  getVars: () => CIEnvVars;
}
