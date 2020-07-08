import * as path from 'path';
import * as fs from 'fs';
import { getFileSize } from './getFileSize';
import { getMatchFiles } from './getMatchFiles';
import logger from '../../common/logger';

import type { FileDetails } from 'bundlemon-utils';
import type { NormalizedConfig } from '../types';

const cwd = process.cwd();

export async function analyzeLocalFiles(config: NormalizedConfig): Promise<FileDetails[]> {
  logger.info(`Start analyzing files`);
  const baseDir = path.join(cwd, config.baseDir) + '/';
  logger.info(`baseDir "${baseDir}"`);

  if (!fs.existsSync(baseDir)) {
    logger.error(`baseDir "${baseDir}" not found`);
    process.exit(1);
  }

  const matchFiles = await getMatchFiles(baseDir, config.files);

  logger.info(`Found ${matchFiles.length} files`);

  logger.debug('Calculate file size');

  const files: FileDetails[] = [];

  await Promise.all(
    matchFiles.map(async (f) => {
      const { fullPath, prettyPath, ...restFile } = f;

      const size = await getFileSize(fullPath, config.defaultCompression);

      files.push({
        ...restFile,
        path: prettyPath,
        size,
      });
    })
  );

  logger.info(`Finished analyzing`);

  return files;
}
