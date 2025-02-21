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

export interface BaseGetRequestSchema {
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

export interface ProjectIdParams {
  /**
   * @pattern ^[0-9a-fA-F]{24}$
   */
  projectId: string;
}
