export interface CIEnvVars {
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
