export enum Compression {
  None = 'none',
  Gzip = 'gzip',
  Brotli = 'brotli',
}

export enum DiffChange {
  NoChange = 'No change',
  Update = 'Update',
  Add = 'Add',
  Remove = 'Remove',
}

export enum Status {
  Pass = 'Pass',
  Fail = 'Fail',
}

export enum FailReason {
  MaxSize = 'MaxSize',
  MaxPercentIncrease = 'MaxPercentIncrease',
}

export enum ProjectProvider {
  GitHub = 'github',
}

export enum CommitRecordReviewResolution {
  Approved = 'approved',
  Rejected = 'rejected',
  Reset = 'reset',
}
