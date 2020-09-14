import * as fs from 'fs';
import * as gzipSize from 'gzip-size';
import { Compression } from 'bundlemon-utils';

export async function getFileSize(path: string, compression: Compression): Promise<number> {
  switch (compression) {
    case Compression.Gzip: {
      return await gzipSize.file(path);
    }
    case Compression.None:
    default:
      return (await fs.promises.readFile(path)).byteLength;
  }
}
