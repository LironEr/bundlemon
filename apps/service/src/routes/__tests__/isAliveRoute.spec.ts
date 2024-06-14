import { app } from '../../../tests/app';

test('is alive', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/is-alive',
  });

  expect(response.statusCode).toEqual(200);
});
