/* istanbul ignore file */

import type { CommitRecordPayload } from 'bundlemon-utils';
import type { CommitRecordsQueryResolution } from '../../consts/commitRecords';
import type { BaseRequestSchema, BaseGetRequestSchema, AuthHeaders } from './common';

interface ProjectIdParams {
  /**
   * @pattern ^[0-9a-fA-F]{24}$
   */
  projectId: string;
}

export interface CreateCommitRecordRequestSchema extends BaseRequestSchema {
  body: CommitRecordPayload;
  params: ProjectIdParams;
  headers: AuthHeaders;
}

interface GetCommitRecordRequestParams extends ProjectIdParams {
  commitRecordId: string;
}

export interface GetCommitRecordRequestSchema extends BaseGetRequestSchema {
  params: GetCommitRecordRequestParams;
}

export interface GetCommitRecordsQuery {
  branch: string;
  latest?: boolean;
  resolution?: CommitRecordsQueryResolution;
  subProject?: string;
}

export interface GetCommitRecordsRequestSchema extends BaseGetRequestSchema {
  params: ProjectIdParams;
  query: GetCommitRecordsQuery;
}
