import { analyzeLocalFiles } from '../analyzeLocalFiles';
import { getFilesDetails, groupFilesByPattern } from '../fileDetailsUtils';
import { Compression, FileDetails } from 'bundlemon-utils';
import { getAllPaths } from '../pathUtils';
import { generateNormalizedConfigRemoteOff } from '../../utils/__tests__/configUtils';

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

  jest.mocked(getFilesDetails).mockResolvedValueOnce(files).mockResolvedValueOnce(groupFiles);
  jest.mocked(getAllPaths).mockResolvedValue(['css/a.css', 'some/path/a.ajhs2he2.js', 'some/other/path/b.273ushj.js']);
  jest.mocked(groupFilesByPattern).mockReturnValue(groups);

  const config = generateNormalizedConfigRemoteOff({
    baseDir: 'some_basedir',
    files: [
      {
        path: '**/*.css',
        compression: Compression.Gzip,
      },
      {
        path: 'some/path/*.<hash>.js',
        compression: Compression.None,
      },
    ],
    groups: [
      {
        path: '*.js',
        compression: Compression.Gzip,
      },
    ],
  });

  const result = await analyzeLocalFiles(config);

  expect(getAllPaths).toHaveBeenCalledWith(config.baseDir);
  expect(getFilesDetails).toHaveBeenCalledTimes(2);
  expect(groupFilesByPattern).toHaveBeenCalledWith(groupFiles);

  expect(result).toEqual({
    files,
    groups,
  });
});
