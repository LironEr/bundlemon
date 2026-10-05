import { cronSecret } from '@/framework/env';

import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Vercel sends the CRON_SECRET env var as "Authorization: Bearer <CRON_SECRET>" on cron requests.
 * Without CRON_SECRET set nothing is authorized.
 */
export async function cronAuthMiddleware(
  req: FastifyRequest<{ Body: any; Params: any; Querystring: any; Headers: any }>,
  res: FastifyReply
) {
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
    res.status(401).send({ message: 'unauthorized' });
    return res;
  }

  return;
}
