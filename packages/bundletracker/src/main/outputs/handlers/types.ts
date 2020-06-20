import type { ReportSummary } from 'bundletracker-utils';
import type { GithubOutputOptions } from './GithubOutput';

export interface ReportData {
  reportSummary: ReportSummary;
  linkToReport?: string;
}

export enum ReportOutputName {
  console = 'console',
  github = 'github',
}

export type ReportOutputOptions = {
  [ReportOutputName.console]: undefined;
  [ReportOutputName.github]: GithubOutputOptions;
};

type OutputWithOptions<Name extends ReportOutputName = ReportOutputName> = [Name, ReportOutputOptions[Name]];

export type ReportOutput = ReportOutputName | OutputWithOptions<ReportOutputName>;
