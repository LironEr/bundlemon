import type { ReportSummary } from 'bundletracker-utils';
import type { GithubPrOutputOptions } from './github-pr';

export interface ReportData {
  reportSummary: ReportSummary;
  linkToReport?: string;
}

export enum ReportOutputName {
  console = 'console',
  githubPR = 'github-pr',
}

export type ReportOutputOptions = {
  [ReportOutputName.console]: undefined;
  [ReportOutputName.githubPR]: GithubPrOutputOptions;
};

type OutputWithOptions<Name extends ReportOutputName = ReportOutputName> = [Name, ReportOutputOptions[Name]];

export type ReportOutput = ReportOutputName | OutputWithOptions<ReportOutputName>;
