import type { Compression, ReportSummary, Report } from 'bundlemon-utils';

export interface FileConfig {
  path: string;
  maxSize?: string;
}

export interface NormalizedFileConfig extends Omit<FileConfig, 'maxSize'> {
  maxSize?: number;
}

export interface Config {
  baseDir?: string;
  files: FileConfig[];
  verbose?: boolean;
  defaultCompression?: Compression;
  reportOutput?: (string | [string, unknown])[];
  onlyLocalAnalyze?: boolean;
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

export interface GitVars {
  branch: string;
  commitSha: string;
  baseBranch?: string;
  prNumber?: string;
}

export interface ReportData {
  reportSummary: ReportSummary;
  linkToReport?: string;
  report?: Report;
  baseReport?: Report;
}
