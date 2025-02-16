import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => ({
  displayName: 'service',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/apps/service',
  setupFiles: ['<rootDir>/tests/setup.ts'],
});
