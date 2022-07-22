import * as path from 'node:path';
import * as fs from 'node:fs';
import * as micromatch from 'micromatch';

import type { MatchFile } from '../types';

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

export async function getMatchFiles(
  baseDir: string,
  files: string[],
  patterns: string[],
  stopOnMatch: boolean
): Promise<Record<string, MatchFile[]>> {
  const patternsMap = patterns.map((pattern) => {
    let index = 0;

    return { originalPattern: pattern, pattern: pattern.replace(/<hash>/g, () => getRegexHash(index++)) };
  });

  const filesGroupByPattern: Record<string, MatchFile[]> = {};

  for (const fullPath of files) {
    const relativePath = path.relative(baseDir, fullPath);

    for (const { originalPattern, pattern } of patternsMap) {
      if (micromatch.isMatch(relativePath, pattern)) {
        if (!filesGroupByPattern[originalPattern]) {
          filesGroupByPattern[originalPattern] = [];
        }

        const prettyPath = createPrettyPath(relativePath, pattern);

        filesGroupByPattern[originalPattern].push({ fullPath, prettyPath });

        if (stopOnMatch) {
          break;
        }
      }
    }
  }

  return filesGroupByPattern;
}
