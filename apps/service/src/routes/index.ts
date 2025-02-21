import { apiPathPrefix } from '@/framework/env';
import apiRoutes from './api';

import type { FastifyPluginCallback } from 'fastify';
import { getDB } from '@/framework/mongo/client';

const routes: FastifyPluginCallback = (app, _opts, done) => {
  app.register(apiRoutes, { prefix: apiPathPrefix });

  app.get('/is-alive', (_req, reply) => {
    reply.send('OK');
  });

  app.get('/health', async (_req, reply) => {
    const db = await getDB();
    await db.admin().ping({ maxTimeMS: 5000 });

    reply.send('OK');
  });

  done();
};

export default routes;
