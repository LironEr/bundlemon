import { UserSessionData } from '@/types/auth';
import { InjectOptions } from 'fastify';
import initApp from '../src/app';
import { generateUserSessionData } from './utils';

export const app = initApp();

export async function injectAuthorizedRequest(injectOptions: InjectOptions, overrideUserData?: UserSessionData) {
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
