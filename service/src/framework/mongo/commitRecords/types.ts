import type { CommitRecordApprover, Compression, CommitRecord } from 'bundlemon-utils';

export interface CommitRecordApproverDB extends Omit<CommitRecordApprover, 'approveDate'> {
  approveDate: Date;
}

export interface AssetLimits {
  maxSize?: number;
  maxPercentIncrease?: number;
}

export interface AssetMatchCriteria {
  pattern: string;
  friendlyName?: string;
  compression: Compression;
  limits?: AssetLimits;
}

export interface AssetMatch {
  path: string;
  size: number;
}

export interface WatchedFileHits extends AssetMatchCriteria {
  matches: AssetMatch[];
}

export interface WatchedGroupHits extends AssetMatchCriteria, Omit<AssetMatch, 'path'> {}

export interface CommitRecordDB {
  projectId: string;
  creationDate: Date;
  subProject?: string;
  branch: string;
  commitSha: string;
  baseBranch?: string;
  prNumber?: string;
  commitMsg?: string;
  files?: WatchedFileHits[];
  groups?: WatchedGroupHits[];
  approvers?: CommitRecordApproverDB[];
  outputs?: CommitRecord['outputs'];
}
