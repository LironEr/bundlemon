import { getReportSummary, Report, FileDetails, CurrentFilesDetails } from 'bundlemon-utils';
import logger from '../../common/logger';
import { getGitVars } from '../utils/configUtils';
import { saveReport } from './serviceHelper';
import type { NormalizedConfig, ReportData } from '../types';

export async function generateReportData(
  config: NormalizedConfig,
  localFiles: FileDetails[]
): Promise<ReportData | undefined> {
  logger.info('Start generating report data');

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
    const gitVars = getGitVars();

    if (!gitVars) {
      logger.error(`Missing git env variables`);
      return undefined;
    }

    const { branch } = gitVars;

    logger.info(`Save report for branch "${branch}"`);

    const result = await saveReport(gitVars, currFilesDetails);

    if (!result) {
      logger.error('Failed to save report');
      return undefined;
    }

    ({ report, baseReport, linkToReport } = result);

    logger.info(`Report "${result.report.id}" has been successfully created`);
  }

  const reportSummary = getReportSummary(currFilesDetails, baseReport);

  logger.info('Finished generating report data');

  return { reportSummary, linkToReport, report, baseReport };
}
