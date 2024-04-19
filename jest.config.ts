import type { Config } from '@jest/types';
import { getJestProjectsAsync } from '@nx/jest';

export default async (): Promise<Config.InitialOptions> => ({
  projects: [...(await getJestProjectsAsync()), '<rootDir>/path/to/jest.config.ts'],
});
