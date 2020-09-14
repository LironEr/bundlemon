import { Compression } from 'bundlemon-utils';
import { NormalizedConfig } from '../../types';

export function generateNormalizedConfig(override: Partial<NormalizedConfig> = {}): NormalizedConfig {
  return {
    baseDir: '',
    defaultCompression: Compression.Gzip,
    files: [],
    onlyLocalAnalyze: false,
    reportOutput: [],
    verbose: false,
    ...override,
  };
}
