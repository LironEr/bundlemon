import { maxSessionAgeSeconds } from '@/framework/env';
import { loginWithCode } from '@/framework/github';
import { RequestError as OctokitRequestError } from '@octokit/request-error';
import { createTestApp, injectAuthorizedRequest } from '@tests/app';
import { generateRandomString, generateUserSessionData } from '@tests/utils';
import { FastifyInstance } from 'fastify';

jest.mock('@/framework/github');

describe('auth routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  describe('login', () => {
    test('success', async () => {
      const expiresAt = new Date(new Date().getTime() + 1000 * 60 * 60);
      expiresAt.setMilliseconds(0);
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
      expect(response.cookies).toEqual([
        {
          name: 'isSessionExists',
          value: expect.any(String),
          maxAge: maxSessionAgeSeconds,
          domain: 'localhost',
          path: '/',
          expires: expiresAt,
          secure: true,
          sameSite: 'Strict',
        },
        {
          name: 'session',
          value: expect.any(String),
          maxAge: maxSessionAgeSeconds,
          domain: 'localhost',
          path: '/',
          expires: expiresAt,
          httpOnly: true,
          secure: true,
          sameSite: 'Strict',
        },
      ]);
      expect(mockedLoginWithCode).toHaveBeenCalledWith(code);
    });

    test('failed', async () => {
      jest.mocked(loginWithCode).mockRejectedValue(
        new OctokitRequestError('some message', 403, {
          request: {
            url: 'https://url',
            method: 'POST',
            headers: {},
          },
          response: {
            url: 'https://url',
            status: 403,
            headers: {},
            data: {},
          },
        })
      );
      const code = generateRandomString();
      const response = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: {
          provider: 'github',
          code,
        },
      });

      expect(response.statusCode).toEqual(401);
      expect(response.headers['set-cookie']).toBeUndefined();
      expect(response.cookies).toEqual([]);

      const responseJson = response.json();
      expect(responseJson.message).toEqual('GitHub error: some message');
    });
  });

  test('logout', async () => {
    const response = await injectAuthorizedRequest(app, {
      method: 'POST',
      url: `/v1/auth/logout`,
    });

    expect(response.statusCode).toEqual(200);
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.cookies).toEqual([
      {
        name: 'isSessionExists',
        value: '',
        domain: 'localhost',
        path: '/',
        expires: new Date(0),
        secure: true,
        sameSite: 'Strict',
      },
      {
        name: 'session',
        value: '',
        maxAge: 0,
        domain: 'localhost',
        path: '/',
        expires: new Date(0),
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
      },
    ]);
  });
});
