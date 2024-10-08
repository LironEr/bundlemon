import * as fs from 'fs';
import { file as calcGzipFileSize } from 'gzip-size';
import { file as calcBrotliFileSize } from 'brotli-size';
import { getFileSize } from '../getFileSize';
import { Compression } from 'bundlemon-utils';

jest.mock('fs', () => ({ readFile: jest.fn(), readFileSync: jest.fn(), promises: { readFile: jest.fn() } }));
jest.mock('gzip-size');
jest.mock('brotli-size');

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

let expectedSize = 0;

describe('getFileSize', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    expectedSize = randomInt(1000, 5000);
  });

  test('comperssion: none', async () => {
    // @ts-expect-error mock only the needed properties that we need for the test
    jest.mocked(fs.promises.readFile).mockResolvedValue({ byteLength: expectedSize });

    const size = await getFileSize('path', Compression.None);

    expect(size).toEqual(expectedSize);
  });

  test('comperssion: gzip', async () => {
    jest.mocked(calcGzipFileSize).mockResolvedValue(expectedSize);

    const size = await getFileSize('path', Compression.Gzip);

    expect(size).toEqual(expectedSize);
  });

  test('comperssion: brotli', async () => {
    jest.mocked(calcBrotliFileSize).mockResolvedValue(expectedSize);

    const size = await getFileSize('path', Compression.Brotli);

    expect(size).toEqual(expectedSize);
  });

  test('comperssion: unknown', async () => {
    // @ts-expect-error mock only the needed properties that we need for the test
    jest.mocked(fs.promises.readFile).mockResolvedValue({ byteLength: expectedSize });

    // @ts-expect-error mock only the needed properties that we need for the test
    const size = await getFileSize('path', 'kjasdkjaskd');

    expect(size).toEqual(expectedSize);
  });
});
