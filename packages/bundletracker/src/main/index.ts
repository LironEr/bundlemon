import logger from '../common/logger';
import { analyzeLocalFiles } from './analyzer';
import { Config } from './types';
import { generateOutputs } from './outputs';
import { generateReportData } from './getReportData';
import { initializer } from './initializer';

export default async (config: Config): Promise<void> => {
  const { normalizedConfig, gitConfig } = await initializer(config);

  const localFiles = await analyzeLocalFiles(normalizedConfig);

  const reportData = await generateReportData(normalizedConfig, gitConfig, localFiles);

  await generateOutputs(reportData);

  logger.info('Done');
};
