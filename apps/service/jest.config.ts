import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => ({
  displayName: 'service',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/apps/service',
  setupFilesAfterEnv: ['<rootDir>/tests/hooks.ts'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
});
