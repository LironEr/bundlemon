import { initDb } from '../framework/mongo/init';

import type { FastifyReply, FastifyRequest } from 'fastify';

// On serverless initDb doesn't run on startup, this is called after each deploy, see scripts/vercelDeploy.sh
export const initDbController = async (req: FastifyRequest, res: FastifyReply) => {
  await initDb(req.log);

  return res.send({ message: 'DB initialized' });
};
