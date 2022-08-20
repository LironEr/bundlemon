export enum CommitRecordsQueryResolution {
  All = 'all',
  Days = 'days',
  Weeks = 'weeks',
  Months = 'months',
}

export enum BaseRecordCompareTo {
  PreviousCommit = 'PREVIOUS_COMMIT',
  LatestCommit = 'LATEST_COMMIT',
}

export enum CreateCommitRecordAuthType {
  ProjectApiKey = 'PROJECT_API_KEY',
  GithubActions = 'GITHUB_ACTIONS',
}

export const MAX_COMMIT_MSG_LENGTH = 72;
