import type { Compression, ProjectProvider } from 'bundlemon-utils';
import type { CreateCommitRecordAuthType } from '../common/consts';

export type PathLabels = Record<string, string>;

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
  files?: FileConfig[];
  groups?: FileConfig[];
  pathLabels?: PathLabels;
  verbose?: boolean;
  defaultCompression?: Compression;
  reportOutput?: (string | [string, unknown])[];
  includeCommitMessage?: boolean;
}

export interface BaseNormalizedConfig extends Omit<Required<Config>, 'files' | 'groups' | 'subProject' | 'pathLabels'> {
  subProject?: string;
  files: NormalizedFileConfig[];
  groups: NormalizedFileConfig[];
  pathLabels: PathLabels;
  remote: boolean;
}

export interface NormalizedConfigRemoteOn extends BaseNormalizedConfig {
  remote: true;
  projectId: string;
  gitVars: GitVars;
  getCreateCommitRecordAuthParams: () => CreateCommitRecordAuthParams;
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
  commitMsg?: string;
}

export type CreateCommitRecordProjectApiKeyAuthQuery = {
  authType: CreateCommitRecordAuthType.ProjectApiKey;
  token: string;
};

export type CreateCommitRecordGithubActionsAuthQuery = {
  authType: CreateCommitRecordAuthType.GithubActions;
  runId: string;
};

export type CreateCommitRecordAuthParams =
  | CreateCommitRecordProjectApiKeyAuthQuery
  | CreateCommitRecordGithubActionsAuthQuery;

export interface GitDetails {
  provider: ProjectProvider;
  owner: string;
  repo: string;
}
