/* istanbul ignore file */

import { Compression, DiffChange, FailReason, Status } from './consts';

export interface FileDetails {
  pattern: string;
  path: string;
  size: number;
  compression: Compression;
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

export interface CommitRecordPayload {
  files: FileDetails[];
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
  record: CommitRecord;
  baseRecord?: CommitRecord;
}

export interface CreateCommitRecordResponse extends BaseCommitRecordResponse {
  linkToReport: string;
}

export interface ReportMetadata {
  linkToReport?: string;
  record?: CommitRecord;
  baseRecord?: CommitRecord;
}

export interface DiffReport {
  files: FileDetailsDiff[];
  stats: DiffStats;
  status: Status;
}

export interface Report extends DiffReport {
  metadata: ReportMetadata;
}

export interface CreateProjectResponse {
  projectId: string;
  apiKey: string;
}
