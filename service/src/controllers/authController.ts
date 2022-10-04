import type { RouteHandlerMethod } from 'fastify';
import { RequestError as OctokitRequestError } from '@octokit/request-error';
import { loginWithCode } from '@/framework/github';
import { DEFAULT_SESSION_AGE_SECONDS } from '@/consts/auth';

import type { FastifyValidatedRoute, LoginRequestSchema } from '@/types/schemas';

export const loginController: FastifyValidatedRoute<LoginRequestSchema> = async (req, res) => {
  try {
    const { code } = req.body;

    const { sessionData, expiresAt } = await loginWithCode(code);

    req.session.options({ expires: expiresAt ?? new Date(new Date().getTime() + 1000 * DEFAULT_SESSION_AGE_SECONDS) });
    req.session.set('user', sessionData);

    return { status: 'ok' };
  } catch (err) {
    if (err instanceof OctokitRequestError) {
      return res.status(401).send({
        message: `GitHub error: ${err.message}`,
      });
    }

    throw err;
  }
};

export const logoutController: RouteHandlerMethod = async (req) => {
  req.session.delete();

  return { status: 'ok' };
};
