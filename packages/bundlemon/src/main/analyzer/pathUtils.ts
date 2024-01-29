import * as path from 'path';
import * as fs from 'fs';
import * as micromatch from 'micromatch';

import type { MatchFile, PathLabels } from '../types';

export async function getAllPaths(dirPath: string): Promise<string[]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

  const files = entries.filter((file) => !file.isDirectory()).map((file) => path.join(dirPath, file.name));
  const folders = entries.filter((folder) => folder.isDirectory());

  for (const folder of folders) files.push(...(await getAllPaths(path.join(dirPath, folder.name))));

  return files;
}

export function createPrettyPath(pathLabelNames: string[], filePath: string, globPattern: string): string {
  let prettyPath = filePath;
  const re = micromatch.makeRe(globPattern);
  const groups = re.exec(filePath)?.groups || {};

  Object.entries(groups).forEach(([key, value]) => {
    pathLabelNames.forEach((label) => {
      if (new RegExp(`^${label}\\d+`).test(key)) {
        prettyPath = prettyPath.replace(value, `(${label})`);
      }
    });
  });

  return prettyPath;
}

export function getRegexHash(name: string, regex: string, index: number): string {
  return `(?<${name}${index}>${regex})`;
}

export async function getMatchFiles(
  baseDir: string,
  files: string[],
  pathLabels: PathLabels,
  patterns: string[],
  stopOnMatch: boolean
): Promise<Record<string, MatchFile[]>> {
  const patternsMap = patterns.map((originalPattern) => {
    let index = 0;
    let pattern = originalPattern;

    Object.entries(pathLabels).forEach(([name, regex]) => {
      const re = new RegExp(`<${name}>`, 'g');
      pattern = pattern.replace(re, () => getRegexHash(name, regex, index++));
    });

    return { originalPattern, pattern };
  });

  const pathLabelNames = Object.keys(pathLabels);
  const filesGroupByPattern: Record<string, MatchFile[]> = {};

  for (const fullPath of files) {
    const relativePath = path.relative(baseDir, fullPath);

    for (const { originalPattern, pattern } of patternsMap) {
      if (micromatch.isMatch(relativePath, pattern)) {
        if (!filesGroupByPattern[originalPattern]) {
          filesGroupByPattern[originalPattern] = [];
        }

        const prettyPath = createPrettyPath(pathLabelNames, relativePath, pattern);

        filesGroupByPattern[originalPattern].push({ fullPath, prettyPath });

        if (stopOnMatch) {
          break;
        }
      }
    }
  }

  return filesGroupByPattern;
}
