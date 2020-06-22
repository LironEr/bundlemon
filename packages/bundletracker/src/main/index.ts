import { Status } from 'bundletracker-utils';
import logger from '../common/logger';
import { analyzeLocalFiles } from './analyzer';
import { Config } from './types';
import { generateOutputs } from './outputs';
import { generateReportData } from './getReportData';
import { initializer } from './initializer';

export default async (config: Config): Promise<void> => {
  const { normalizedConfig } = await initializer(config);

  const localFiles = await analyzeLocalFiles(normalizedConfig);

  const reportData = await generateReportData(normalizedConfig, localFiles);

  if (!reportData) {
    process.exit(1);
  }

  await generateOutputs(reportData);

  logger.info('Done');

  process.exit(reportData.reportSummary.status === Status.Pass ? 0 : 1);
};
