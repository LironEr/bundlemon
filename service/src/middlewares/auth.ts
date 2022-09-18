import type { FastifyReply, FastifyRequest } from 'fastify';
import type { UserSessionData } from '../types/auth';

export async function authMiddleware(
  req: FastifyRequest<{ Body: any; Params: any; Querystring: any; Headers: any }>,
  res: FastifyReply
) {
  const userSessionData: UserSessionData | undefined = req.session.get('user');

  if (!userSessionData) {
    res.status(401).send({ error: 'unauthorized' });
    return res;
  }

  req.getUser = () => userSessionData;
  return;
}
