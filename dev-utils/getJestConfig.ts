/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';
import base from '../jest.config.base';

import type { Config } from '@jest/types';

export function getJestConfig(dirname: string): Config.InitialOptions {
  const packageJSON = require(`${dirname}/package`);

  return {
    ...base,
    displayName: packageJSON.name,
    rootDir: path.resolve(__dirname, '..'),
    testMatch: [`${dirname}/**/__tests__/**/*.spec.ts`],
  };
}
