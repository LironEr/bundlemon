import { apiPathPrefix } from '@/framework/env';
import apiRoutes from './api';

import type { FastifyPluginCallback } from 'fastify';
import { getDB } from '@/framework/mongo/client';
import { cronAuthMiddleware } from '@/middlewares/cronAuth';
import { runScheduledTasksController } from '@/controllers/tasksController';
import { initDbController } from '@/controllers/dbController';

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

  // Triggered by Vercel Cron, see "crons" in vercel.json
  app.get('/cron/tasks', { preValidation: [cronAuthMiddleware] }, runScheduledTasksController);

  // Called after each Vercel deploy, see scripts/vercelDeploy.sh
  app.post('/internal/init-db', { preValidation: [cronAuthMiddleware] }, initDbController);

  done();
};

export default routes;
