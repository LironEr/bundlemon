import apiRoutes from './api';

import type { FastifyPluginCallback } from 'fastify';

const routes: FastifyPluginCallback = (app, _opts, done) => {
  // TODO: prefix with /api if not using subdomain
  app.register(apiRoutes, { prefix: '' });

  done();
};

export default routes;
