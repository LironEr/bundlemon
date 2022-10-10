import type { CommitRecordReview, Compression, CommitRecord } from 'bundlemon-utils';

export interface CommitRecordReviewDB extends Omit<CommitRecordReview, 'createdAt'> {
  createdAt: Date;
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
  reviews?: CommitRecordReviewDB[];
  outputs?: CommitRecord['outputs'];
}
