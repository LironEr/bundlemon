/* eslint-disable @typescript-eslint/no-var-requires */

// When using import on top of the file mocks wont mock, so use require inside the hooks

beforeAll(async () => {
  const { app } = require('./app');
  await app.ready();
});

afterAll(async () => {
  const { app } = require('./app');
  await app.close();
});
