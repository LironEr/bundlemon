import { loginWithCode } from '@/framework/github';
import { app } from '@tests/app';

import { generateRandomString, generateUserSessionData } from '@tests/utils';

jest.mock('@/framework/github');

describe('auth routes', () => {
  describe('login', () => {
    test('success', async () => {
      const expiresAt = new Date(new Date().getTime() + 1000 * 60 * 60);
      const sessionData = generateUserSessionData();

      const mockedLoginWithCode = jest.mocked(loginWithCode).mockResolvedValue({
        sessionData,
        expiresAt,
      });
      const code = generateRandomString();
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          provider: 'github',
          code,
        },
      });

      expect(response.statusCode).toEqual(200);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(mockedLoginWithCode).toHaveBeenCalledWith(code);
    });
  });
});
