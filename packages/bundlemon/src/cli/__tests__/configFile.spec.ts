import { loadConfigFile } from '../configFile';

describe('load config file', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('failure', () => {
    test('empty', async () => {
      const config = await loadConfigFile('src/cli/__tests__/assets/empty.json');

      expect(config).toBeUndefined();
    });

    test('bad format JSON', async () => {
      const config = await loadConfigFile('src/cli/__tests__/assets/bad-format.json');

      expect(config).toBeUndefined();
    });

    test('bad format YAML', async () => {
      const config = await loadConfigFile('src/cli/__tests__/assets/bad-format.yaml');

      expect(config).toBeUndefined();
    });

    test('bad format JS', async () => {
      const config = await loadConfigFile('src/cli/__tests__/assets/bad-format.js');

      expect(config).toBeUndefined();
    });

    test('not found', async () => {
      const config = await loadConfigFile('not-found');

      expect(config).toBeUndefined();
    });
  });
});
