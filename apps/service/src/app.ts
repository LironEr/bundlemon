import fs from 'fs';
import path from 'path';
import fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import cors, { FastifyCorsOptions } from '@fastify/cors';
import cookie, { FastifyCookieOptions } from '@fastify/cookie';
import secureSession, { SecureSessionPluginOptions } from '@fastify/secure-session';
import routes from '@/routes';
import * as schemas from '@/consts/schemas';
import { closeMongoClient } from '@/framework/mongo/client';
import { secretSessionKey, rootDomain, isTestEnv, shouldServeWebsite } from '@/framework/env';
import { RequestError as OctokitRequestError } from '@octokit/request-error';
import { host, port, maxSessionAgeSeconds, maxBodySizeBytes, shouldRunDbInit } from '@/framework/env';

import type { ServerOptions } from 'https';
import { overrideWebsiteConfig } from './utils/website';
import { initDb } from './framework/mongo/init';

const _gracefulShutdown = async (app: FastifyInstance, signal: string) => {
  app.log.info(`${signal} signal received: closing server`);

  try {
    await app.close();
    app.log.info('server closed');
    process.exit(0);
  } catch (err) {
    app.log.error({ err }, 'Error during server close');
    process.exit(1);
  }
};

interface InitParams {
  isServerless: boolean;
}

async function init({ isServerless }: InitParams) {
  let https: ServerOptions | null = null;

  if (process.argv.includes('--local-certs')) {
    https = {
      key: fs.readFileSync(path.join(__dirname, 'local-certs', 'key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'local-certs', 'cert.pem')),
    };
  }

  const app = fastify({
    https,
    bodyLimit: maxBodySizeBytes,
    logger: {
      level: 'info',
      serializers: {
        req(req) {
          return {
            method: req.method,
            url: req.url,
            hostname: req.hostname,
            remoteAddress: req.ip,
            clientName: req?.headers?.['x-api-client-name'],
            clientVersion: req?.headers?.['x-api-client-version'],
          };
        },
      },
    },
  });

  Object.values(schemas)
    .filter((schema) => !schema.$id.endsWith('RequestSchema'))
    .forEach((schema) => {
      app.addSchema(schema);
    });

  if (shouldServeWebsite) {
    overrideWebsiteConfig();

    app.register(fastifyStatic, {
      root: '/app/service/public',
      prefix: '/',
      wildcard: false,
      index: 'index.html',
      logLevel: 'silent',
    });

    app.setNotFoundHandler((req, res) => {
      if (req.raw.url && req.raw.url.startsWith('/api')) {
        return res.status(404).send({ message: `Route ${req.method}:${req.raw.url} not found`, error: 'Not Found' });
      }

      res.sendFile('index.html');
    });
  }

  app.register(cors, {
    credentials: true,
    origin: true,
  } as FastifyCorsOptions);

  const cookieParseOptions: FastifyCookieOptions['parseOptions'] = {
    path: '/',
    domain: rootDomain,
    httpOnly: true,
    secure: true,
    sameSite: isTestEnv ? 'none' : 'strict',
    maxAge: maxSessionAgeSeconds,
  };

  app.register(cookie, {
    parseOptions: cookieParseOptions,
  } as FastifyCookieOptions);

  app.register(secureSession, {
    cookieName: 'session',
    key: Buffer.from(secretSessionKey, 'hex'),
    cookie: cookieParseOptions,
  } as SecureSessionPluginOptions);
  app.register(routes);

  app.setErrorHandler((error, req, res) => {
    // check if we have a validation error
    if (error.validation) {
      return res.status(400).send({
        message: `A validation error occurred when validating the ${error.validationContext}`,
        errors: error.validation,
      });
    } else if (error instanceof OctokitRequestError) {
      req.log.warn(error);
      return res.status(400).send({
        message: `GitHub error: ${error.message}`,
      });
    } else if (error instanceof fastify.errorCodes.FST_ERR_CTP_BODY_TOO_LARGE) {
      req.log.warn('Request body too large');

      let bodySize: string | number = 'unknown';

      try {
        if (req.headers['content-length']) {
          bodySize = parseInt(req.headers['content-length'] || '');
        }
      } catch (e) {
        // Do nothing
      }

      return res.status(413).send({
        message: 'Request body too large',
        bodySize,
        limitBytes: maxBodySizeBytes,
      });
    }

    req.log.error(error);

    return res.status(500).send('unknown error');
  });

  app.addHook('onClose', () => closeMongoClient());

  process.on('SIGTERM', () => _gracefulShutdown(app, 'SIGTERM'));
  process.on('SIGINT', () => _gracefulShutdown(app, 'SIGINT'));

  if (!isServerless && shouldRunDbInit) {
    await initDb(app.log);
  }

  return app;
}

// If called directly i.e. "node app"
if (require.main === module || process.argv.includes('--listen')) {
  (async () => {
    const app = await init({ isServerless: false });

    app.listen({ host, port }, (err) => {
      if (err) {
        app.log.fatal(err);
        process.exit(1);
      }
    });
  })();
}

// Required as a module => executed on vercel / other serverless platform
export default init;
