/* istanbul ignore file */

import type { CommitRecordPayload } from 'bundlemon-utils';
import type {
  CommitRecordsQueryResolution,
  BaseRecordCompareTo,
  CreateCommitRecordAuthType,
} from '../../consts/commitRecords';
import type { BaseRequestSchema, BaseGetRequestSchema, AuthHeaders, ProjectIdParams } from './common';

export type CreateCommitRecordProjectApiKeyAuthQuery = {
  authType: CreateCommitRecordAuthType.ProjectApiKey;
  token: string;
};

export type CreateCommitRecordGithubActionsAuthQuery = {
  authType: CreateCommitRecordAuthType.GithubActions;
  runId: string;
};

export type CreateCommitRecordRequestQuery =
  | CreateCommitRecordProjectApiKeyAuthQuery
  | CreateCommitRecordGithubActionsAuthQuery
  | Record<string, never>;

export interface CreateCommitRecordRequestSchema extends BaseRequestSchema {
  body: CommitRecordPayload;
  params: ProjectIdParams;
  query: CreateCommitRecordRequestQuery;
  // @deprecated
  headers: AuthHeaders;
}

export interface GetCommitRecordRequestParams extends ProjectIdParams {
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
