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
  GithubActions = 'GITHUB_ACTIONS',
}
