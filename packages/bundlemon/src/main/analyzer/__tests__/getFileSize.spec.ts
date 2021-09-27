import { mocked } from 'ts-jest/utils';
import * as fs from 'fs';
import * as gzipSize from 'gzip-size';
import * as brotliSize from 'brotli-size';
import { getFileSize } from '../getFileSize';
import { Compression } from 'bundlemon-utils';

jest.mock('fs', () => ({ promises: { readFile: jest.fn() } }));
jest.mock('gzip-size');
jest.mock('brotli-size');

const expectedSize = 5000;

describe('getFileSize', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('comperssion: none', async () => {
    // @ts-expect-error
    mocked(fs.promises.readFile).mockResolvedValue({ byteLength: expectedSize });

    const size = await getFileSize('path', Compression.None);

    expect(size).toEqual(expectedSize);
  });

  test('comperssion: gzip', async () => {
    mocked(gzipSize.file).mockResolvedValue(expectedSize);

    const size = await getFileSize('path', Compression.Gzip);

    expect(size).toEqual(expectedSize);
  });

  test('comperssion: brotli', async () => {
    mocked(brotliSize.file).mockResolvedValue(expectedSize);

    const size = await getFileSize('path', Compression.Brotli);

    expect(size).toEqual(expectedSize);
  });

  test('comperssion: unknown', async () => {
    // @ts-expect-error
    mocked(fs.promises.readFile).mockResolvedValue({ byteLength: expectedSize });

    // @ts-expect-error
    const size = await getFileSize('path', 'kjasdkjaskd');

    expect(size).toEqual(expectedSize);
  });
});
