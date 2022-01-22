/* istanbul ignore file */

import type { CommitRecordPayload } from 'bundlemon-utils';
import type { CommitRecordsQueryResolution, BaseRecordCompareTo } from '../../consts/commitRecords';
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
  /**
   * @pattern ^[0-9a-fA-F]{24}$
   */
  commitRecordId: string;
}

interface GetCommitRecordRequestQuery {
  /**
   * @default "PREVIOUS_COMMIT"
   */
  compareTo?: BaseRecordCompareTo;
}

export interface GetCommitRecordRequestSchema extends BaseGetRequestSchema {
  params: GetCommitRecordRequestParams;
  query: GetCommitRecordRequestQuery;
}

export interface GetCommitRecordsQuery {
  branch: string;
  latest?: boolean;
  resolution?: CommitRecordsQueryResolution;
  subProject?: string;
  olderThan?: Date;
}

export interface GetCommitRecordsRequestSchema extends BaseGetRequestSchema {
  params: ProjectIdParams;
  query: GetCommitRecordsQuery;
}
