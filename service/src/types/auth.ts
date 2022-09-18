/* istanbul ignore file */

import type { Octokit } from '@octokit/rest';

export interface LoggedInUser {
  provider: 'github';
  name: string;
}

export interface UserSessionData extends LoggedInUser {
  auth: {
    token: string;
  };
}

export interface AuthenticatedUser {
  octokit: Octokit;
  name: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    getUser: () => UserSessionData;
  }
}
