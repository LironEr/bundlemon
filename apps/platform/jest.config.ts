import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => ({
  displayName: 'platform',
  preset: '../../jest.preset.js',
});
