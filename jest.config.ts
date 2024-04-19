import { getJestProjects } from '@nx/jest';
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  maxWorkers: 1,
  logHeapUsage: true,
  // helps with high heap memory https://github.com/jestjs/jest/issues/11956
  workerIdleMemoryLimit: '1024MB',
  projects: getJestProjects(),
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/',
  collectCoverageFrom: [`<rootDir>/packages/*/src/**/*.ts`, `!**/__tests__/**`],
};

export default config;
