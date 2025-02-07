import { BASE_URL, BASE_URL_NO_WEBSITE } from './consts';

describe('is alive', () => {
  test('platform', async () => {
    const response = await fetch(`${BASE_URL}/is-alive`);

    expect(response.status).toEqual(200);
  });

  test('no website', async () => {
    const response = await fetch(`${BASE_URL_NO_WEBSITE}/is-alive`);

    expect(response.status).toEqual(200);
  });
});
