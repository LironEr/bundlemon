import * as path from 'path';
import * as fs from 'fs';
import * as micromatch from 'micromatch';

import type { MatchFile, NormalizedFileConfig } from '../types';

async function getFilesPaths(dirPath = './'): Promise<string[]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  const files = entries.filter((file) => !file.isDirectory()).map((file) => path.join(dirPath, file.name));
  const folders = entries.filter((folder) => folder.isDirectory());

  for (const folder of folders) files.push(...(await getFilesPaths(path.join(dirPath, folder.name))));

  return files;
}

function createPrettyPath(filePath: string, globPattern: string): string {
  let prettyPath = filePath;
  const re = micromatch.makeRe(globPattern);
  const groups = re.exec(filePath)?.groups || {};

  // TODO: filter only hash keys?
  Object.values(groups).forEach((value) => {
    prettyPath = prettyPath.replace(value, '<hash>');
  });

  return prettyPath;
}

function getRegexHash(index: number) {
  return `(?<hash${index}>[a-zA-Z0-9]+)`;
}

export async function getFiles(baseDir: string, filesConfig: NormalizedFileConfig[]): Promise<MatchFile[]> {
  const transformedFilesConfig = filesConfig.map((f) => {
    const { path: filePattern, ...rest } = f;
    let index = 0;

    return { ...rest, path: filePattern.replace(/<hash>/g, () => getRegexHash(index++)) };
  });

  const allFiles = await getFilesPaths(baseDir);

  const matchFiles: (MatchFile | undefined)[] = allFiles.map((fullPath) => {
    const relativePath = fullPath.replace(baseDir, '');

    for (const fileConfig of transformedFilesConfig) {
      const { path: globPattern, ...restConfig } = fileConfig;
      if (micromatch.isMatch(relativePath, globPattern)) {
        const prettyPath = createPrettyPath(relativePath, globPattern);

        return { ...restConfig, fullPath, prettyPath };
      }
    }

    return undefined;
  });

  return matchFiles.filter((f) => !!f) as MatchFile[];
}
