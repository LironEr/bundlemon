import { UserSessionData } from '@/types/auth';
import { FastifyInstance, InjectOptions } from 'fastify';
import { generateUserSessionData } from './utils';
import initApp from '@/app';

export async function createTestApp() {
  const app = await initApp({ isServerless: false });
  await app.ready();

  return app;
}

export async function injectAuthorizedRequest(
  app: FastifyInstance,
  injectOptions: InjectOptions,
  overrideUserData?: UserSessionData
) {
  const userSessionData = overrideUserData ?? generateUserSessionData();

  const session = app.createSecureSession({ user: userSessionData });
  const cookieData = app.encodeSecureSession(session);

  const response = await app.inject({
    ...injectOptions,
    cookies: {
      ...injectOptions.cookies,
      session: cookieData,
    },
  });

  return response;
}
