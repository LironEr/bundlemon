import * as path from 'path';
import * as fs from 'fs';
import * as micromatch from 'micromatch';

import type { MatchFile, NormalizedFileConfig } from '../types';

export async function getAllPaths(dirPath: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  const files = entries.filter((file) => !file.isDirectory()).map((file) => path.join(dirPath, file.name));
  const folders = entries.filter((folder) => folder.isDirectory());

  for (const folder of folders) files.push(...(await getAllPaths(path.join(dirPath, folder.name))));

  return files;
}

export function createPrettyPath(filePath: string, globPattern: string): string {
  let prettyPath = filePath;
  const re = micromatch.makeRe(globPattern);
  const groups = re.exec(filePath)?.groups || {};

  Object.entries(groups).forEach(([key, value]) => {
    if (key.startsWith('hash')) {
      prettyPath = prettyPath.replace(value, '(hash)');
    }
  });

  return prettyPath;
}

export function getRegexHash(index: number): string {
  return `(?<hash${index}>[a-zA-Z0-9]+)`;
}

export async function getMatchFiles(baseDir: string, filesConfig: NormalizedFileConfig[]): Promise<MatchFile[]> {
  const transformedFilesConfig = filesConfig.map((f) => {
    const { path: filePattern, ...rest } = f;
    let index = 0;

    return { ...rest, path: filePattern.replace(/<hash>/g, () => getRegexHash(index++)) };
  });

  const allFiles = await getAllPaths(baseDir);

  const matchFiles: MatchFile[] = [];

  for (const fullPath of allFiles) {
    const relativePath = path.relative(baseDir, fullPath);

    for (const fileConfig of transformedFilesConfig) {
      const { path: pattern, ...restConfig } = fileConfig;

      if (micromatch.isMatch(relativePath, pattern)) {
        const prettyPath = createPrettyPath(relativePath, pattern);

        matchFiles.push({ ...restConfig, fullPath, prettyPath });

        break;
      }
    }
  }

  return matchFiles;
}
