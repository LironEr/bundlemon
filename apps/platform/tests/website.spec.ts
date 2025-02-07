import { BASE_URL, BASE_URL_NO_WEBSITE } from './consts';

describe('serve website', () => {
  test('platform', async () => {
    const response = await fetch(BASE_URL);

    expect(response.status).toEqual(200);
  });

  test('no website', async () => {
    const response = await fetch(BASE_URL_NO_WEBSITE);

    expect(response.status).toEqual(404);
  });
});
