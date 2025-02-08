import { createTestApp, injectAuthorizedRequest } from '@tests/app';
import { generateUserSessionData } from '@tests/utils';
import { FastifyInstance } from 'fastify';

describe('users routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  describe('me', () => {
    test('user not logged in', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/v1/users/me`,
      });

      expect(response.statusCode).toEqual(401);
    });

    test('success', async () => {
      const userSessionData = generateUserSessionData();

      const response = await injectAuthorizedRequest(
        app,
        {
          method: 'GET',
          url: `/v1/users/me`,
        },
        userSessionData
      );

      expect(response.statusCode).toEqual(200);

      const responseJson = response.json();

      expect(responseJson).toEqual({
        provider: userSessionData.provider,
        name: userSessionData.name,
      });
    });
  });
});
