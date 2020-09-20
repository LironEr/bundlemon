import type { Compression } from 'bundlemon-utils';

export interface FileConfig {
  path: string;
  compression?: Compression;
  maxSize?: string;
  maxPercentIncrease?: number;
}

export interface NormalizedFileConfig extends Omit<FileConfig, 'maxSize' | 'compression'> {
  compression: Compression;
  maxSize?: number;
}

export interface Config {
  baseDir?: string;
  files: FileConfig[];
  groups?: FileConfig[];
  verbose?: boolean;
  defaultCompression?: Compression;
  reportOutput?: (string | [string, unknown])[];
  onlyLocalAnalyze?: boolean;
}

export interface NormalizedConfig extends Omit<Required<Config>, 'files' | 'groups'> {
  files: NormalizedFileConfig[];
  groups: NormalizedFileConfig[];
}

export interface ProjectConfig {
  projectId: string;
  apiKey: string;
}

export interface MatchFile {
  fullPath: string;
  prettyPath: string;
}

export interface GitVars {
  branch: string;
  commitSha: string;
  baseBranch?: string;
  prNumber?: string;
}
