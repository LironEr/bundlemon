import { Report, Status, getReportConclusionText } from 'bundlemon-utils';
import logger from '../common/logger';
import { analyzeLocalFiles } from './analyzer';
import { generateOutputs } from './outputs';
import { generateReport } from './report';
import { initializer } from './initializer';
import type { Config } from './types';

export default async (config: Config): Promise<Report> => {
  const normalizedConfig = await initializer(config);

  if (!normalizedConfig) {
    throw new Error('Failed to initialize');
  }

  const { files, groups } = await analyzeLocalFiles(normalizedConfig);

  if (files.length === 0 && groups.length === 0) {
    throw new Error('No files or groups found');
  }

  const report = await generateReport(normalizedConfig, { files, groups });

  if (!report) {
    throw new Error('Failed to generate report');
  }

  await generateOutputs(report);

  logger.info(`Done - ${report.status === Status.Pass ? 'Success' : 'Failure'} - ${getReportConclusionText(report)}`);

  return report;
};
