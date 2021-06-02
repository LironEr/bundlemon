import v1Routes from './v1';

import type { FastifyPluginCallback } from 'fastify';

const apiRoutes: FastifyPluginCallback = (app, _opts, done) => {
  app.register(v1Routes, { prefix: '/v1' });

  done();
};

export default apiRoutes;
