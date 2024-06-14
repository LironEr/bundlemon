import type { RouteHandlerMethod } from 'fastify';
import { RequestError as OctokitRequestError } from '@octokit/request-error';
import { loginWithCode } from '@/framework/github';
import { DEFAULT_SESSION_AGE_SECONDS } from '@/consts/auth';

import type { FastifyValidatedRoute, LoginRequestSchema } from '@/types/schemas';

export const loginController: FastifyValidatedRoute<LoginRequestSchema> = async (req, res) => {
  try {
    const { code } = req.body;

    const { sessionData, expiresAt } = await loginWithCode(code);
    const expires = expiresAt ?? new Date(new Date().getTime() + 1000 * DEFAULT_SESSION_AGE_SECONDS);

    req.session.options({ expires });
    req.session.set('user', sessionData);

    res.setCookie('isSessionExists', 'true', {
      httpOnly: false,
      expires,
    });

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

export const logoutController: RouteHandlerMethod = async (req, res) => {
  req.session.delete();

  res.clearCookie('isSessionExists', { httpOnly: false });

  return { status: 'ok' };
};
