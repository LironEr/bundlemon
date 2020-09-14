/* istanbul ignore file */

export interface FileDetails {
  pattern: string;
  path: string;
  size: number;
  maxSize?: number;
  maxPercentIncrease?: number;
}

export interface ReportPayload {
  files: FileDetails[];
  defaultCompression: 'gzip' | 'none';
  branch: string;
  commitSha: string;
  baseBranch?: string;
  prNumber?: string;
}

export interface Report extends Omit<ReportPayload, 'defaultCompression'> {
  id: string;
  projectId: string;
  creationDate: string;
}

export interface BaseReportResponse {
  report: Report;
  baseReport?: Report;
}

export interface CreateReportResponse extends BaseReportResponse {
  linkToReport: string;
}

export interface CreateProjectResponse {
  projectId: string;
  apiKey: string;
}
