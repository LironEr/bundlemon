/* istanbul ignore file */

import type { GithubOutputTypes, Report } from 'bundlemon-utils';
import type { AuthHeaders, BaseRequestSchema } from './common';

interface ProjectIdParams {
  /**
   * @pattern ^[0-9a-fA-F]{24}$
   */
  projectId: string;
}

interface ProjectApiKeyHeaders {
  /**
   * @minLength 1
   */
  'x-api-key': string;
}

interface CreateGithubCheckBody {
  report: Report;
  git: {
    owner: string;
    repo: string;
    commitSha: string;
  };
}

export interface CreateGithubCheckRequestSchema extends BaseRequestSchema {
  body: CreateGithubCheckBody;
  params: ProjectIdParams;
  headers: ProjectApiKeyHeaders;
}

interface CreateGithubCommitStatusBody {
  report: Report;
  git: {
    owner: string;
    repo: string;
    commitSha: string;
  };
}

export interface CreateGithubCommitStatusRequestSchema extends BaseRequestSchema {
  body: CreateGithubCommitStatusBody;
  params: ProjectIdParams;
  headers: ProjectApiKeyHeaders;
}

interface CreateGithubPrCommentBody {
  report: Report;
  git: {
    owner: string;
    repo: string;
    prNumber: string;
  };
}

export interface PostGithubPRCommentRequestSchema extends BaseRequestSchema {
  body: CreateGithubPrCommentBody;
  params: ProjectIdParams;
  headers: ProjectApiKeyHeaders;
}

interface GithubOutputBody {
  report: Report;
  git: {
    owner: string;
    repo: string;
    commitSha: string;
    prNumber?: string;
  };
  output: Partial<Record<GithubOutputTypes, boolean>>;
}

export interface GithubOutputRequestSchema extends BaseRequestSchema {
  body: GithubOutputBody;
  params: ProjectIdParams;
  headers: AuthHeaders;
}
