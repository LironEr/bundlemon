/* istanbul ignore file */

import { compressions } from './consts';

export type Compression = typeof compressions[number];

export interface FileDetails {
  path: string;
  size: number;
  maxSize?: number;
  maxPercentIncrease?: number;
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

export interface DiffFromBase {
  bytes: number;
  percent: number;
  change: DiffChange;
}

export interface FileDetailsDiff extends FileDetails {
  diff: DiffFromBase;
  status: Status;
}

export interface CurrentFilesDetails {
  files: FileDetails[];
  defaultCompression: Compression;
}

export interface ReportPayload extends CurrentFilesDetails {
  branch: string;
  commitSha: string;
  baseBranch?: string;
  prNumber?: string;
}

export interface Report extends ReportPayload {
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

export interface BaseReportResponse {
  report: Report;
  baseReport?: Report;
}

export interface ReportSummary {
  files: FileDetailsDiff[];
  stats: DiffStats;
  status: Status;
  defaultCompression: Compression;
}

export interface CreateReportResponse extends BaseReportResponse {
  linkToReport: string;
}

export interface CreateProjectResponse {
  projectId: string;
  apiKey: string;
}
