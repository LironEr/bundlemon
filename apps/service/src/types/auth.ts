/* istanbul ignore file */

declare module '@fastify/secure-session' {
  interface SessionData {
    user: UserSessionData;
  }
}

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
