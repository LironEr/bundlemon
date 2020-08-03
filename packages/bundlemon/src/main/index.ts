import { Status } from 'bundlemon-utils';
import logger from '../common/logger';
import { analyzeLocalFiles } from './analyzer';
import { Config } from './types';
import { generateOutputs } from './outputs';
import { generateReportData } from './reportData';
import { initializer } from './initializer';

export default async (config: Config): Promise<void> => {
  const { normalizedConfig } = await initializer(config);

  const localFiles = await analyzeLocalFiles(normalizedConfig);

  if (localFiles.length === 0) {
    logger.error('No files found');
    process.exit(1);
  }

  const reportData = await generateReportData(normalizedConfig, localFiles);

  if (!reportData) {
    process.exit(1);
  }

  try {
    await generateOutputs(reportData);
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
  }

  logger.info('Done');

  process.exit(reportData.reportSummary.status === Status.Pass ? 0 : 1);
};
