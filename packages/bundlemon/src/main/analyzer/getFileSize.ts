import * as fs from 'fs';
import { file as calcGzipFileSize } from 'gzip-size';
import { file as calcBrotliFileSize } from 'brotli-size';
import { Compression } from 'bundlemon-utils';

export async function getFileSize(path: string, compression: Compression): Promise<number> {
  switch (compression) {
    case Compression.Gzip: {
      return await calcGzipFileSize(path);
    }
    case Compression.Brotli: {
      return await calcBrotliFileSize(path);
    }
    case Compression.None:
    default:
      return (await fs.promises.readFile(path)).byteLength;
  }
}
