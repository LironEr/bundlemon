import { mocked } from 'ts-jest/utils';
import { analyzeLocalFiles } from '../analyzeLocalFiles';
import { NormalizedConfig } from '../../types';
import { getFilesDetails, groupFilesByPattern } from '../fileDetailsUtils';
import { Compression, FileDetails } from 'bundlemon-utils';
import { getAllPaths } from '../pathUtils';

jest.mock('../pathUtils');
jest.mock('../fileDetailsUtils');
jest.mock('../../../common/logger');

test('analyzeLocalFiles', async () => {
  const files: FileDetails[] = [
    {
      pattern: 'css/*.css',
      path: 'css/a.css',
      size: 5000,
      compression: Compression.Gzip,
    },
    {
      pattern: '**/*.<hash>.js',
      path: 'some/path/a.ajhs2he2.js',
      size: 5000,
      compression: Compression.Gzip,
    },
    {
      pattern: '**/*.<hash>.js',
      path: 'some/other/path/b.273ushj.js',
      size: 5000,
      compression: Compression.Gzip,
    },
  ];

  const groupFiles: FileDetails[] = [
    {
      pattern: '**/*.<hash>.js',
      path: 'some/path/a.ajhs2he2.js',
      size: 5000,
      compression: Compression.Gzip,
    },
    {
      pattern: '**/*.<hash>.js',
      path: 'some/other/path/b.273ushj.js',
      size: 5000,
      compression: Compression.Gzip,
    },
  ];

  const groups = [{ pattern: '**/*.<hash>.js', path: '**/*.<hash>.js', size: 10000, compression: Compression.Gzip }];

  mocked(getFilesDetails).mockResolvedValueOnce(files).mockResolvedValueOnce(groupFiles);
  mocked(getAllPaths).mockResolvedValue(['css/a.css', 'some/path/a.ajhs2he2.js', 'some/other/path/b.273ushj.js']);
  mocked(groupFilesByPattern).mockReturnValue(groups);

  const baseDir = 'some_basedir';
  const filesConfig: NormalizedConfig['files'] = [
    {
      path: '**/*.css',
      compression: Compression.Gzip,
    },
    {
      path: 'some/path/*.<hash>.js',
      compression: Compression.None,
    },
  ];
  const groupsConfig: NormalizedConfig['files'] = [
    {
      path: '*.js',
      compression: Compression.Gzip,
    },
  ];

  const config: NormalizedConfig = {
    baseDir,
    files: filesConfig,
    groups: groupsConfig,
    defaultCompression: Compression.Gzip,
    onlyLocalAnalyze: false,
    reportOutput: [],
    verbose: false,
  };

  const result = await analyzeLocalFiles(config);

  expect(getAllPaths).toBeCalledWith(baseDir);
  expect(getFilesDetails).toBeCalledTimes(2);
  expect(groupFilesByPattern).toBeCalledWith(groupFiles);

  expect(result).toEqual({
    files,
    groups,
  });
});
