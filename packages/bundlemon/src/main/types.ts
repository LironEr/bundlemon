import type { Compression } from 'bundlemon-utils';

export interface FileConfig {
  friendlyName?: string;
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
  subProject?: string;
  baseDir?: string;
  files: FileConfig[];
  groups?: FileConfig[];
  verbose?: boolean;
  defaultCompression?: Compression;
  reportOutput?: (string | [string, unknown])[];
}

export interface BaseNormalizedConfig extends Omit<Required<Config>, 'files' | 'groups' | 'subProject'> {
  subProject?: string;
  files: NormalizedFileConfig[];
  groups: NormalizedFileConfig[];
  remote: boolean;
}

export interface NormalizedConfigRemoteOn extends BaseNormalizedConfig {
  remote: true;
  projectId: string;
  gitVars: GitVars;
  getAuthHeaders: () => AuthHeaders;
}

export interface NormalizedConfigRemoteOff extends BaseNormalizedConfig {
  remote: false;
}

export type NormalizedConfig = NormalizedConfigRemoteOn | NormalizedConfigRemoteOff;

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

export interface ProjectAuthHeaders {
  'BundleMon-Auth-Type': 'API_KEY';
  'x-api-key': string;
}

export interface GithubActionsAuthHeaders {
  'BundleMon-Auth-Type': 'GITHUB_ACTION';
  'GitHub-Owner': string;
  'GitHub-Repo': string;
  'GitHub-Run-ID': string;
}

export type AuthHeaders = ProjectAuthHeaders | GithubActionsAuthHeaders;
