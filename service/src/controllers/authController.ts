import { loginWithCode } from '../framework/github';
import { DEFAULT_SESSION_AGE_SECONDS } from '../consts/auth';

import type { RouteHandlerMethod } from 'fastify';
import type { FastifyValidatedRoute, LoginRequestSchema } from '../types/schemas';

export const loginController: FastifyValidatedRoute<LoginRequestSchema> = async (req) => {
  const { code } = req.body;

  const { sessionData, expiresAt } = await loginWithCode(code);

  req.session.options({ expires: expiresAt ?? new Date(new Date().getTime() + 1000 * DEFAULT_SESSION_AGE_SECONDS) });
  req.session.set('user', sessionData);

  return { status: 'ok' };
};

export const logoutController: RouteHandlerMethod = async (req) => {
  req.session.delete();

  return { status: 'ok' };
};
