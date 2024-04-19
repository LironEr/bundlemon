import path from 'path';
import { loadConfigFile } from '../configFile';

const SUCCESS_FILE_CONFIG = {
  baseDir: 'build',
  verbose: true,
};
describe('load config file', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('success', async () => {
    const config = await loadConfigFile(path.join(__dirname, 'assets', 'success.json'));

    expect(config).toEqual(SUCCESS_FILE_CONFIG);
  });

  describe('failure', () => {
    test('empty', async () => {
      const config = await loadConfigFile(path.join(__dirname, 'assets', 'empty.json'));

      expect(config).toBeUndefined();
    });

    test('bad format JSON', async () => {
      const config = await loadConfigFile(path.join(__dirname, 'assets', 'bad-format.json'));

      expect(config).toBeUndefined();
    });

    test('bad format YAML', async () => {
      const config = await loadConfigFile(path.join(__dirname, 'assets', 'bad-format.yaml'));

      expect(config).toBeUndefined();
    });

    test('bad format JS', async () => {
      const config = await loadConfigFile(path.join(__dirname, 'assets', 'bad-format.js'));

      expect(config).toBeUndefined();
    });

    test('not found', async () => {
      const config = await loadConfigFile('not-found');

      expect(config).toBeUndefined();
    });
  });
});
