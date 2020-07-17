import * as consts from '../consts';

describe('consts', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('default snapshot', () => {
    expect(consts).toMatchSnapshot();
  });

  test('serviceUrl env var exists', () => {
    const newUrl = 'https://my-bundlemon-service.com';
    process.env[consts.EnvVar.serviceURL] = newUrl;

    const { serviceUrl } = require('../consts');

    expect(serviceUrl).toEqual(newUrl);
  });
});
