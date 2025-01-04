import { shouldServeWebsite } from '@/framework/env';
import apiRoutes from './api';

import type { FastifyPluginCallback } from 'fastify';

const routes: FastifyPluginCallback = (app, _opts, done) => {
  app.register(apiRoutes, { prefix: shouldServeWebsite ? '/api' : '/' });

  app.get('/is-alive', (_req, reply) => {
    reply.send('OK');
  });

  done();
};

export default routes;
