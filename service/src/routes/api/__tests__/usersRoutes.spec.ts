import { injectAuthorizedRequest } from '@tests/app';
import { generateUserSessionData } from '@tests/utils';

describe('users routes', () => {
  describe('me', () => {
    test('success', async () => {
      const userSessionData = generateUserSessionData();

      const response = await injectAuthorizedRequest(
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
