import base from './jest.config.base';

import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  ...base,
  projects: ['<rootDir>/packages/*/jest.config.ts'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/',
  collectCoverageFrom: [`<rootDir>/packages/*/src/**/*.ts`, `!**/__tests__/**`],
};

export default config;
