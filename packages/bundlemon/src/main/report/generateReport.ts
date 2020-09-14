import { generateDiffReport, Report, FileDetails, CommitRecord } from 'bundlemon-utils';
import logger from '../../common/logger';
import { getGitVars } from '../utils/configUtils';
import { saveCommitRecord } from './serviceHelper';
import type { NormalizedConfig } from '../types';

export async function generateReport(config: NormalizedConfig, localFiles: FileDetails[]): Promise<Report | undefined> {
  logger.info('Start generating report');

  let record: CommitRecord | undefined;
  let baseRecord: CommitRecord | undefined;
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

    logger.info(`Save commit record for branch "${branch}"`);

    const result = await saveCommitRecord({
      ...gitVars,
      files: localFiles,
    });

    if (!result) {
      logger.error('Failed to save commit record');
      return undefined;
    }

    ({ record, baseRecord, linkToReport } = result);

    logger.info(`Commit record "${result.record.id}" has been successfully created`);
  }

  const diffReport = generateDiffReport(localFiles, baseRecord?.files);

  logger.info('Finished generating report');

  return {
    ...diffReport,
    metadata: { linkToReport, record, baseRecord },
  };
}
