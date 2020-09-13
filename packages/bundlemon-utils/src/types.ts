/* istanbul ignore file */

import { compressions, DiffChange, FailReason, Status } from './consts';

export type Compression = typeof compressions[number];

export interface FileDetails {
  pattern: string;
  path: string;
  size: number;
  maxSize?: number;
  maxPercentIncrease?: number;
}

export interface DiffFromBase {
  bytes: number;
  percent: number;
  change: DiffChange;
}

export type FileStatusObject =
  | { status: Status.Pass; failReasons?: undefined }
  | { status: Status.Fail; failReasons: FailReason[] };

export type FileDetailsDiff = FileDetails & { diff: DiffFromBase } & FileStatusObject;

export interface CurrentFilesDetails {
  files: FileDetails[];
  defaultCompression: Compression;
}

export interface CommitRecordPayload extends CurrentFilesDetails {
  branch: string;
  commitSha: string;
  baseBranch?: string;
  prNumber?: string;
}

export interface CommitRecord extends CommitRecordPayload {
  id: string;
  projectId: string;
  creationDate: string;
}

export interface DiffStats {
  currBranchSize: number;
  baseBranchSize: number;
  diff: {
    bytes: number;
    percent: number;
  };
}

export interface BaseCommitRecordResponse {
  commitRecord: CommitRecord;
  baseCommitRecord?: CommitRecord;
}

export interface CreateCommitRecordResponse extends BaseCommitRecordResponse {
  linkToReport: string;
}

export interface DiffSummary {
  files: FileDetailsDiff[];
  stats: DiffStats;
  status: Status;
  defaultCompression: Compression;
}

export interface Report {
  diffSummary: DiffSummary;
  linkToReport?: string;
  commitRecord?: CommitRecord;
  baseCommitRecord?: CommitRecord;
}

export interface CreateProjectResponse {
  projectId: string;
  apiKey: string;
}
