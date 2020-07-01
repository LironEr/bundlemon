import { getReportSummary, Report, ReportPayload, FileDetails, CurrentFilesDetails } from 'bundlemon-utils';
import logger from '../common/logger';
import { createReport, getLatestBranchReport } from '../common/service';
import { EnvVar } from '../common/consts';
import { getGitConfig } from './utils/configUtils';
import type { NormalizedConfig, GitConfig, ReportData } from './types';

async function saveReport(gitConfig: GitConfig, currFilesDetails: CurrentFilesDetails) {
  const report: ReportPayload = {
    ...currFilesDetails,
    ...gitConfig,
  };

  const projectId = process.env[EnvVar.projectId];
  const apiKey = process.env[EnvVar.projectApiKey];

  if (!projectId) {
    logger.error(`Missing "${EnvVar.projectId}" env var`);
    return undefined;
  }

  if (!apiKey) {
    logger.error(`Missing "${EnvVar.projectApiKey}" env var`);
    return undefined;
  }

  const response = await createReport({ projectId, apiKey }, report);

  return response;
}

async function getBaseReport({ branch }: GitConfig) {
  const projectId = process.env[EnvVar.projectId];

  if (!projectId) {
    logger.error(`Missing "${EnvVar.projectId}" env var`);
    return undefined;
  }

  const baseReport = await getLatestBranchReport({ projectId, branch });

  return baseReport;
}

export async function generateReportData(
  config: NormalizedConfig,
  localFiles: FileDetails[]
): Promise<ReportData | undefined> {
  const currFilesDetails: CurrentFilesDetails = {
    files: localFiles,
    defaultCompression: config.defaultCompression,
  };

  let report: Report | undefined;
  let baseReport: Report | undefined;
  let linkToReport: string | undefined;

  if (config.onlyLocalAnalyze) {
    logger.info('Only local analyze is ON - showing only local results');
  } else {
    const gitConfig = getGitConfig();

    if (!gitConfig) {
      return undefined;
    } else {
      const { branch, baseBranch } = gitConfig;

      if (config.trackBranches.includes(branch) || config.shouldRetainReportUrl) {
        logger.info('Save report');

        const result = await saveReport(gitConfig, currFilesDetails);

        if (result) {
          ({ report, baseReport, linkToReport } = result);
          logger.info(`Report "${result.report.id}" has been successfully created`);
        } else {
          logger.warn('Failed to save report, cant show diff from base branch');
        }
      } else if (baseBranch) {
        // TODO: should check if config.trackBranches includes baseBranch?

        logger.info('Fetch base report');
        baseReport = await getBaseReport(gitConfig);

        if (baseReport) {
          logger.info(`Base branch report "${baseReport.id}" has been successfully fetched`);
        } else {
          logger.warn('Base branch report not found, cant show diff from base branch');
        }
      }
    }
  }

  const reportSummary = getReportSummary(currFilesDetails, baseReport);

  return { reportSummary, linkToReport, report, baseReport };
}
