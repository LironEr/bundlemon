import { createOctokitClientByOAuthToken, loginWithCode } from '../framework/github';
import { DEFAULT_SESSION_AGE_SECONDS } from '../consts/auth';

import type { RouteHandlerMethod } from 'fastify';
import type { FastifyValidatedRoute, LoginRequestSchema } from '../types/schemas';
import type { UserSessionData } from '../types/auth';

export const loginController: FastifyValidatedRoute<LoginRequestSchema> = async (req) => {
  const { code } = req.body;

  const { token, expiresAt } = await loginWithCode(code);
  const octokit = createOctokitClientByOAuthToken(token);
  const { data: ghUser } = await octokit.users.getAuthenticated();

  const sessionData: UserSessionData = {
    provider: 'github',
    name: ghUser.login,
    auth: {
      token,
    },
  };

  req.session.options({ expires: expiresAt ?? new Date(new Date().getTime() + 1000 * DEFAULT_SESSION_AGE_SECONDS) });
  req.session.set('user', sessionData);

  return { status: 'ok' };
};

export const logoutController: RouteHandlerMethod = async (req) => {
  req.session.delete();

  return { status: 'ok' };
};
