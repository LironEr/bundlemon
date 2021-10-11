/* istanbul ignore file */

import type {
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
  RouteHandlerMethod,
} from 'fastify';

export interface BaseRequestSchema {
  body?: unknown;
  query?: unknown;
  params?: unknown;
  headers?: unknown;
}

export type FastifyValidatedRoute<RouteGeneric extends BaseRequestSchema> = RouteHandlerMethod<
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  {
    Body: RouteGeneric['body'];
    Querystring: RouteGeneric['query'];
    Params: RouteGeneric['params'];
    Headers: RouteGeneric['headers'];
  }
>;

export interface ProjectAuthHeaders {
  'bundlemon-auth-type'?: 'API_KEY';
  /**
   * @minLength 1
   */
  'x-api-key': string;
}

export interface GithubActionsAuthHeaders {
  'bundlemon-auth-type': 'GITHUB_ACTION';
  /**
   * @minLength 1
   */
  'github-owner': string;
  /**
   * @minLength 1
   */
  'github-repo': string;
  /**
   * @minLength 1
   * @pattern ^\d+$
   */
  'github-run-id': string;
}

export type AuthHeaders = { [key: string]: any } & (ProjectAuthHeaders | GithubActionsAuthHeaders);
