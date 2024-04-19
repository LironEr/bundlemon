import { Compression, FileDetails } from 'bundlemon-utils';
import { filesToWatchedFileHits, watchedFileHitsToFiles } from '../utils';

describe('DB commit records utils', () => {
  test('files transform', () => {
    const files: FileDetails[] = [
      { path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None },
      { path: 'file2.js', pattern: '*.js', size: 150, compression: Compression.None },
      { path: 'file.css', pattern: '*.css', size: 150, compression: Compression.Gzip, maxPercentIncrease: 5 },
      { path: 'index.html', pattern: 'index.html', size: 100, compression: Compression.Brotli, maxSize: 500 },
      {
        path: 'file.png',
        pattern: '*.png',
        size: 150,
        compression: Compression.Gzip,
        maxSize: 500,
        maxPercentIncrease: 5,
      },
    ];

    const hits = filesToWatchedFileHits(files);
    const filesAfterTransform = watchedFileHitsToFiles(hits);

    expect(filesAfterTransform).toEqual(files);
  });

  test('groups transform', () => {
    const groups: FileDetails[] = [
      { path: '*.js', pattern: '*.js', size: 100, compression: Compression.None },
      { path: '*.css', pattern: '*.css', size: 150, compression: Compression.Gzip, maxPercentIncrease: 5 },
      { path: 'index.html', pattern: 'index.html', size: 100, compression: Compression.Brotli, maxSize: 500 },
      {
        path: '*.png',
        pattern: '*.png',
        size: 150,
        compression: Compression.Gzip,
        maxSize: 500,
        maxPercentIncrease: 5,
      },
    ];

    const hits = filesToWatchedFileHits(groups);
    const groupsAfterTransform = watchedFileHitsToFiles(hits);

    expect(groupsAfterTransform).toEqual(groups);
  });
});
