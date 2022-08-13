import { getJestConfig } from '../../dev-utils/getJestConfig';
import type { Config } from '@jest/types';

const config: Config.InitialOptions = getJestConfig(__dirname);

export default config;
