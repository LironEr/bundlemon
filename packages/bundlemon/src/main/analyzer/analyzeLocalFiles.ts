import { getAllPaths } from './pathUtils';
import { getFilesDetails, groupFilesByPattern } from './fileDetailsUtils';
import logger from '../../common/logger';

import type { FileDetails } from 'bundlemon-utils';
import type { NormalizedConfig } from '../types';

export async function analyzeLocalFiles(
  config: NormalizedConfig
): Promise<{ files: FileDetails[]; groups: FileDetails[] }> {
  logger.info(`Start analyzing`);

  const { baseDir, files: filesConfig, groups: groupsConfig } = config;

  const allFiles = await getAllPaths(config.baseDir);

  const [files, groupFiles] = await Promise.all([
    getFilesDetails({ baseDir, allFiles, config: filesConfig, stopOnMatch: true }),
    getFilesDetails({ baseDir, allFiles, config: groupsConfig, stopOnMatch: false }),
  ]);

  const groups = groupFilesByPattern(groupFiles);

  logger.info(`Finished analyzing`);

  return { files, groups };
}
