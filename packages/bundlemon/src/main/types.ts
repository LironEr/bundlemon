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
}

export interface BaseNormalizedConfig extends Omit<Required<Config>, 'files' | 'groups'> {
  files: NormalizedFileConfig[];
  groups: NormalizedFileConfig[];
  remote: boolean;
}

export interface NormalizedConfigRemoteOn extends BaseNormalizedConfig {
  remote: true;
  gitVars: GitVars;
  getProjectIdentifiers: () => ProjectIdentifiers;
}

export interface NormalizedConfigRemoteOff extends BaseNormalizedConfig {
  remote: false;
}

export type NormalizedConfig = NormalizedConfigRemoteOn | NormalizedConfigRemoteOff;

// export interface NormalizedConfig extends Omit<Required<Config>, 'files' | 'groups'> {
//   files: NormalizedFileConfig[];
//   groups: NormalizedFileConfig[];
//   remote: boolean;
// }

export interface ProjectIdentifiers {
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
