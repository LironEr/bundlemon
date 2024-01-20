import { getFileSize } from './getFileSize';
import { getMatchFiles } from './pathUtils';

import type { FileDetails } from 'bundlemon-utils';
import type { NormalizedFileConfig, PathLabels } from '../types';

interface GetFilesDetailsParams {
  baseDir: string;
  pathLabels: PathLabels;
  config: NormalizedFileConfig[];
  allFiles: string[];
  stopOnMatch: boolean;
}

export async function getFilesDetails({
  baseDir,
  pathLabels,
  config,
  allFiles,
  stopOnMatch,
}: GetFilesDetailsParams): Promise<FileDetails[]> {
  const filesConfigMap: Record<string, NormalizedFileConfig> = config.reduce((acc, curr) => {
    return { ...acc, [curr.path]: curr };
  }, {});

  const matchFiles = await getMatchFiles(baseDir, allFiles, pathLabels, Object.keys(filesConfigMap), stopOnMatch);

  const files: FileDetails[] = [];

  await Promise.all(
    Object.entries(matchFiles).map(async ([pattern, matchFiles]) => {
      const { path, ...restFileConfig } = filesConfigMap[pattern];

      for (const { fullPath, prettyPath } of matchFiles) {
        const size = await getFileSize(fullPath, restFileConfig.compression);

        files.push({
          ...restFileConfig,
          pattern,
          path: prettyPath,
          size,
        });
      }
    })
  );

  return files;
}

export function groupFilesByPattern(files: FileDetails[]): FileDetails[] {
  const groupsMap: Record<string, FileDetails> = {};

  for (const file of files) {
    const { pattern, size } = file;

    if (!groupsMap[pattern]) {
      groupsMap[pattern] = {
        ...file,
        path: pattern,
        pattern,
        size: 0,
      };
    }

    groupsMap[pattern].size += size;
  }

  return Object.values(groupsMap);
}
