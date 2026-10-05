import { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../tests/app';
import * as init from '@/framework/mongo/init';

jest.mock('@/framework/env', () => ({ ...jest.requireActual('@/framework/env'), cronSecret: 'test-cron-secret' }));

describe('init db route', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('401 without authorization', async () => {
    const initDb = jest.spyOn(init, 'initDb');

    const response = await app.inject({ method: 'POST', url: '/internal/init-db' });

    expect(response.statusCode).toEqual(401);
    expect(initDb).not.toHaveBeenCalled();
  });

  test('401 with wrong secret', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/internal/init-db',
      headers: { authorization: 'Bearer wrong' },
    });

    expect(response.statusCode).toEqual(401);
  });

  test('initializes the db', async () => {
    const initDb = jest.spyOn(init, 'initDb');

    const response = await app.inject({
      method: 'POST',
      url: '/internal/init-db',
      headers: { authorization: 'Bearer test-cron-secret' },
    });

    expect(response.statusCode).toEqual(200);
    expect(initDb).toHaveBeenCalledTimes(1);
  });
});
