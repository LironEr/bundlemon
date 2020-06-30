import * as fs from 'fs';
import * as gzipSize from 'gzip-size';

import type { Compression } from 'bundlemon-utils';

export async function getFileSize(path: string, compression: Compression): Promise<number> {
  switch (compression) {
    case 'gzip':
      return await gzipSize(path);
    case 'none':
    default:
      return (await fs.promises.readFile(path)).byteLength;
  }
}
