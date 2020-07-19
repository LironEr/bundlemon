import { NormalizedConfig } from '../../types';

export function generateNormalizedConfig(override: Partial<NormalizedConfig> = {}): NormalizedConfig {
  return {
    baseDir: '',
    defaultCompression: 'gzip',
    files: [],
    onlyLocalAnalyze: false,
    reportOutput: [],
    verbose: false,
    ...override,
  };
}
