import { BASE_URL } from './consts';

test('is alive', async () => {
  const response = await fetch(`${BASE_URL}/is-alive`);

  expect(response.status).toEqual(200);
});
