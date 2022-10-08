import { getFilesDetails, groupFilesByPattern } from '../fileDetailsUtils';
import { NormalizedConfig, MatchFile } from '../../types';
import { getMatchFiles } from '../pathUtils';
import { getFileSize } from '../getFileSize';
import { Compression, FileDetails } from 'bundlemon-utils';

jest.mock('../pathUtils');
jest.mock('../getFileSize');
jest.mock('../../../common/logger');

describe('fileDetailsUtils', () => {
  test('getFilesDetails', async () => {
    const allFiles = ['css/a.css', 'some/path/a.hajdh22.js', 'some/path/b.hj23j2.js', 'logo.png'];
    const matchFiles: Record<string, MatchFile[]> = {
      'css/*.css': [{ fullPath: 'css/a.css', prettyPath: 'css/a.css' }],
      '**/*.<hash>.js': [
        { fullPath: 'some/path/a.hajdh22.js', prettyPath: 'some/path/a.(hash).js' },
        { fullPath: 'some/path/b.hj23j2.js', prettyPath: 'some/path/b.(hash).js' },
      ],
    };

    const mockedGetMatchFiles = jest.mocked(getMatchFiles).mockResolvedValue(matchFiles);
    const mockedGetFileSize = jest.mocked(getFileSize).mockResolvedValue(5000);

    const baseDir = 'some_basedir';
    const config: NormalizedConfig['files'] = [
      {
        friendlyName: 'css files',
        path: 'css/*.css',
        compression: Compression.Gzip,
      },
      {
        path: '**/*.<hash>.js',
        compression: Compression.None,
      },
    ];

    const result = await getFilesDetails({ baseDir, allFiles, config, stopOnMatch: true });

    expect(mockedGetMatchFiles).toHaveBeenCalledTimes(1);
    expect(mockedGetFileSize).toHaveBeenCalledTimes(3);

    const expectedResult: FileDetails[] = [
      {
        friendlyName: 'css files',
        pattern: 'css/*.css',
        path: matchFiles['css/*.css'][0].prettyPath,
        size: 5000,
        compression: Compression.Gzip,
      },
      {
        pattern: '**/*.<hash>.js',
        path: matchFiles['**/*.<hash>.js'][0].prettyPath,
        size: 5000,
        compression: Compression.None,
      },
      {
        pattern: '**/*.<hash>.js',
        path: matchFiles['**/*.<hash>.js'][1].prettyPath,
        size: 5000,
        compression: Compression.None,
      },
    ];

    expect(result).toEqual(expectedResult);
  });

  it('groupFilesByPattern', () => {
    const files: FileDetails[] = [
      {
        pattern: 'css/*.css',
        path: 'css/a.css',
        size: 5000,
        compression: Compression.Gzip,
      },
      {
        pattern: '**/*.<hash>.js',
        path: 'some/path/a.hajdh22.js',
        size: 7000,
        compression: Compression.None,
      },
      {
        pattern: '**/*.<hash>.js',
        path: 'some/path/b.jkasdhj2.js',
        size: 5000,
        compression: Compression.None,
      },
    ];

    const groups = groupFilesByPattern(files);

    expect(groups).toEqual([
      {
        pattern: 'css/*.css',
        path: 'css/*.css',
        size: 5000,
        compression: Compression.Gzip,
      },
      {
        pattern: '**/*.<hash>.js',
        path: '**/*.<hash>.js',
        size: 12000,
        compression: Compression.None,
      },
    ]);
  });
});
