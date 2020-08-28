import { mocked } from 'ts-jest/utils';
import { analyzeLocalFiles } from '../analyzeLocalFiles';
import { NormalizedConfig, MatchFile } from '../../types';
import { getMatchFiles } from '../getMatchFiles';
import { getFileSize } from '../getFileSize';
import { FileDetails } from 'bundlemon-utils';

jest.mock('../getMatchFiles');
jest.mock('../getFileSize');
jest.mock('../../../common/logger');

test('analyzeLocalFiles', async () => {
  const matchFiles: MatchFile[] = [
    { fullPath: 'css/a.css', prettyPath: 'css/a.css' },
    { fullPath: 'some/path/a.hajdh22.js', prettyPath: 'some/path/a.(hash).js' },
    { fullPath: 'some/path/b.hj23j2.js', prettyPath: 'some/path/b.(hash).js' },
  ];
  const mockedGetMatchFiles = mocked(getMatchFiles).mockResolvedValue(matchFiles);
  const mockedGetFileSize = mocked(getFileSize)
    .mockResolvedValueOnce(5000)
    .mockResolvedValueOnce(15000)
    .mockResolvedValueOnce(2000);

  const baseDir = 'some_basedir';
  const files: NormalizedConfig['files'] = [
    {
      path: '**/*.css',
    },
    {
      path: 'some/path/*.<hash>.js',
    },
  ];

  const config: NormalizedConfig = {
    baseDir,
    files,
    defaultCompression: 'gzip',
    onlyLocalAnalyze: false,
    reportOutput: [],
    verbose: false,
  };

  const result = await analyzeLocalFiles(config);

  expect(mockedGetMatchFiles).toBeCalledWith(baseDir, files);
  expect(mockedGetFileSize).toHaveBeenCalledTimes(matchFiles.length);
  mockedGetFileSize.mock.calls.forEach((call, index) => {
    expect(call).toEqual([matchFiles[index].fullPath, config.defaultCompression]);
  });

  const expectedResult: FileDetails[] = [
    {
      path: matchFiles[0].prettyPath,
      size: 5000,
    },
    {
      path: matchFiles[1].prettyPath,
      size: 15000,
    },
    {
      path: matchFiles[2].prettyPath,
      size: 2000,
    },
  ];

  expect(result).toEqual(expectedResult);
});
