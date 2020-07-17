import { getReportSummary, Report, FileDetails, CurrentFilesDetails } from 'bundlemon-utils';
import logger from '../../common/logger';
import { getGitVars } from '../utils/configUtils';
import { saveReport, getBaseReport } from './serviceHelper';
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
    const gitConfig = getGitVars();

    if (!gitConfig) {
      logger.error(`Missing git env variables`);
      return undefined;
    } else {
      const { branch, baseBranch } = gitConfig;

      if (config.trackBranches.includes(branch)) {
        logger.info('Save report');

        const result = await saveReport(gitConfig, currFilesDetails);

        if (result) {
          ({ report, baseReport, linkToReport } = result);
          logger.info(`Report "${result.report.id}" has been successfully created`);
        } else {
          logger.warn('Failed to save report');
        }
      } else if (baseBranch) {
        if (config.trackBranches.includes(baseBranch)) {
          logger.info('Fetch base report');
          baseReport = await getBaseReport(gitConfig);

          if (baseReport) {
            logger.info(`Base branch report "${baseReport.id}" has been successfully fetched`);
          } else {
            logger.warn('Base branch report not found, cant show diff from base branch');
          }
        } else {
          logger.warn(
            `Base branch (${baseBranch}) not includes in track branches [${config.trackBranches.join(
              ', '
            )}], cant fetch base report`
          );
        }
      }
    }
  }

  const reportSummary = getReportSummary(currFilesDetails, baseReport);

  logger.info('Finished generating report data');

  return { reportSummary, linkToReport, report, baseReport };
}
