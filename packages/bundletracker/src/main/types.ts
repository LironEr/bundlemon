import type { Compression } from 'bundletracker-utils';
import type { ReportOutput } from './outputs/handlers/types';

export interface FileConfig {
  path: string;
  maxSize?: string;
}

export interface NormalizedFileConfig extends Omit<FileConfig, 'maxSize'> {
  maxSize?: number;
}

export interface Config {
  baseDir: string;
  files: FileConfig[];
  verbose?: boolean;
  defaultCompression?: Compression;
  trackBranches?: string[];
  reportOutput?: ReportOutput[];
  shouldRetainReportUrl?: boolean;
}

export interface NormalizedConfig extends Omit<Required<Config>, 'files'> {
  files: NormalizedFileConfig[];
}

export interface ProjectConfig {
  projectId: string;
  apiKey: string;
}

export interface MatchFile extends Omit<NormalizedFileConfig, 'path'> {
  fullPath: string;
  prettyPath: string;
}

export interface GitConfig {
  branch: string;
  commitSha: string;
  baseBranch?: string;
}
