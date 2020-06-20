import { getReportSummary, Report, ReportPayload, FileDetails } from 'bundletracker-utils';
import logger from '../common/logger';
import { createReport, getLatestBranchReport } from '../common/service';
import { NormalizedConfig, GitConfig } from './types';
import { EnvVar } from '../common/consts';
import { ReportData } from './outputs/handlers/types';

export async function generateReportData(
  config: NormalizedConfig,
  gitConfig: GitConfig,
  localFiles: FileDetails[]
): Promise<ReportData> {
  const { branch, commitSha, baseBranch } = gitConfig;
  let report: ReportPayload = {
    branch,
    commitSha,
    baseBranch,
    files: localFiles,
    defaultCompression: config.defaultCompression,
  };
  let baseReport: Report | undefined;
  let linkToReport: string | undefined;

  if (config.trackBranches.includes(branch) || config.shouldRetainReportUrl) {
    logger.info('Create report');

    const projectId = process.env[EnvVar.projectId];
    const apiKey = process.env[EnvVar.projectApiKey];

    if (!projectId) {
      logger.error(`Missing "${EnvVar.projectId}" env var`);
      process.exit(1);
    }

    if (!apiKey) {
      logger.error(`Missing "${EnvVar.projectApiKey}" env var`);
      process.exit(1);
    }

    const response = await createReport({ projectId, apiKey }, report);

    if (!response) {
      process.exit(1);
    }

    ({ report, baseReport, linkToReport } = response);
  } else if (baseBranch) {
    logger.info('Fetch base report');

    const projectId = process.env[EnvVar.projectId];

    if (!projectId) {
      logger.error(`Missing "${EnvVar.projectId}" env var`);
      process.exit(1);
    }

    baseReport = await getLatestBranchReport({ projectId, branch });

    if (!baseReport) {
      logger.warn('Base report not found');
    }
  } else {
    logger.debug('Generating local report');
  }

  const reportSummary = getReportSummary(report, baseReport);

  return { reportSummary, linkToReport };
}
