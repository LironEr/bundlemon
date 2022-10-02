/* istanbul ignore file */

export interface LoggedInUser {
  provider: 'github';
  name: string;
}

export interface UserSessionData extends LoggedInUser {
  auth: {
    token: string;
  };
}

declare module 'fastify' {
  interface FastifyRequest {
    getUser: () => UserSessionData;
  }
}
