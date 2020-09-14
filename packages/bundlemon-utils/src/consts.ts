export enum Compression {
  None = 'none',
  Gzip = 'gzip',
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
