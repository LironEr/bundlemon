import { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../tests/app';

describe('is alive route', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  test('success', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/is-alive',
    });

    expect(response.statusCode).toEqual(200);
  });
});
