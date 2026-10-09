import init from '../src/app';

import type { FastifyInstance } from 'fastify';

// The app is built once per function instance (not per request), building it is expensive
let appPromise: Promise<FastifyInstance> | undefined;

function getApp() {
  appPromise ??= init({ isServerless: true })
    .then(async (app) => {
      await app.ready();
      return app;
    })
    .catch((err) => {
      // allow the next request to retry the initialization
      appPromise = undefined;
      throw err;
    });

  return appPromise;
}

export default async (req: any, res: any) => {
  const app = await getApp();

  app.server.emit('request', req, res);
};
