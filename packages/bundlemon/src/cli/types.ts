import type { Compression } from 'bundlemon-utils';

export interface CliOptions {
  config?: string;
  subProject?: string;
  defaultCompression?: Compression;
}
