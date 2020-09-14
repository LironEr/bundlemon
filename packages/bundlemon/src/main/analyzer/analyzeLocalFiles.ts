import { getFileSize } from './getFileSize';
import { getMatchFiles } from './getMatchFiles';
import logger from '../../common/logger';

import type { FileDetails } from 'bundlemon-utils';
import type { NormalizedConfig, MatchFile } from '../types';

async function calcFilesDetails(matchFiles: MatchFile[]): Promise<FileDetails[]> {
  const files: FileDetails[] = [];

  await Promise.all(
    matchFiles.map(async (f) => {
      const { fullPath, prettyPath, ...restFile } = f;

      const size = await getFileSize(fullPath, restFile.compression);

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

export async function analyzeLocalFiles(config: NormalizedConfig): Promise<FileDetails[]> {
  logger.info(`Start analyzing files`);

  const matchFiles = await getMatchFiles(config.baseDir, config.files);

  logger.info(`Found ${matchFiles.length} files`);

  logger.debug('Calculate file size');

  const files = await calcFilesDetails(matchFiles);

  logger.info(`Finished analyzing`);

  return files;
}
