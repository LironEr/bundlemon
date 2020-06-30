import { mocked } from 'ts-jest/utils';
import * as fs from 'fs';
import * as gzipSize from 'gzip-size';
import { getFileSize } from '../getFileSize';

jest.mock('fs', () => ({ promises: { readFile: jest.fn() } }));
jest.mock('gzip-size');

const expectedSize = 5000;

describe('getFileSize', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('comperssion: none', async () => {
    // @ts-expect-error
    mocked(fs.promises.readFile).mockResolvedValue({ byteLength: expectedSize });

    const size = await getFileSize('path', 'none');

    expect(size).toEqual(expectedSize);
  });

  test('comperssion: gzip', async () => {
    mocked(gzipSize).mockResolvedValue(expectedSize);

    const size = await getFileSize('path', 'gzip');

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
