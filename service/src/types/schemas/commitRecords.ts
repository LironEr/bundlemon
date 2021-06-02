import type { CommitRecordPayload } from 'bundlemon-utils';
import type { CommitRecordsQueryResolution } from '../../consts/commitRecords';
import type { BaseRequestSchema } from './common';

interface ProjectIdParams {
  /**
   * @pattern ^[0-9a-fA-F]{24}$
   */
  projectId: string;
}

interface CreateCommitRecordHeaders {
  /**
   * @minLength 1
   */
  'x-api-key': string;
}

export interface CreateCommitRecordRequestSchema extends BaseRequestSchema {
  body: CommitRecordPayload;
  params: ProjectIdParams;
  headers: CreateCommitRecordHeaders;
}

interface GetCommitRecordRequestParams extends ProjectIdParams {
  recordId: string;
}

export interface GetCommitRecordRequestSchema extends BaseRequestSchema {
  params: GetCommitRecordRequestParams;
}

export interface GetCommitRecordsQuery {
  branch: string;
  latest?: boolean;
  resolution?: CommitRecordsQueryResolution;
}

export interface GetCommitRecordsRequestSchema extends BaseRequestSchema {
  params: ProjectIdParams;
  query: GetCommitRecordsQuery;
}
