import { Status } from 'bundlemon-utils';
import logger from '../common/logger';
import { analyzeLocalFiles } from './analyzer';
import { Config } from './types';
import { generateOutputs } from './outputs';
import { generateReport } from './report';
import { initializer } from './initializer';

export default async (config: Config): Promise<void> => {
  const normalizedConfig = await initializer(config);

  if (!normalizedConfig) {
    process.exit(1);
  }

  const { files, groups } = await analyzeLocalFiles(normalizedConfig);

  if (files.length === 0 && groups.length === 0) {
    logger.error('No files found');
    process.exit(1);
  }

  const report = await generateReport(normalizedConfig, { files, groups });

  if (!report) {
    process.exit(1);
  }

  try {
    await generateOutputs(report);
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
  }

  logger.info('Done');

  process.exit(report.status === Status.Pass ? 0 : 1);
};
