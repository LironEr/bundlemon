import type { Config } from '@jest/types';

module.exports = async (): Promise<Config.InitialOptions> => ({
  displayName: 'service',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/apps/service',
  setupFiles: ['<rootDir>/tests/setup.ts'],
});
