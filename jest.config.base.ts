import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  maxWorkers: 1,
  logHeapUsage: true,
  // helps with high heap memory https://github.com/jestjs/jest/issues/11956
  workerIdleMemoryLimit: '1.5G',
};

export default config;
