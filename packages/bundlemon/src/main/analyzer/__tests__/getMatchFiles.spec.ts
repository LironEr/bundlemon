import * as fs from 'fs';
import * as path from 'path';
import { getAllPaths, createPrettyPath, getRegexHash } from '../getMatchFiles';

describe('getFiles', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllPaths', () => {
    it('recursive directories', async () => {
      const paths = await getAllPaths(__dirname + '/fixtures/getAllPaths/1');

      const fileNames = paths.map((fullPath) => path.basename(fullPath));

      expect(fileNames.sort()).toEqual(['a.html', 'a.js', 'ac.css', 'g.aa.bbb'].sort());
    });

    it('empty directory', async () => {
      const dirPath = __dirname + '/fixtures/getAllPaths/2';
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
      }

      const paths = await getAllPaths(dirPath);

      expect(paths).toMatchSnapshot();
    });
  });

  describe('createPrettyPath', () => {
    it('simple file name', async () => {
      expect(createPrettyPath('index.html', 'index.html')).toEqual('index.html');
      expect(createPrettyPath('a/index.html', 'test')).toEqual('a/index.html');
    });

    it('not match glob pettern -> doesnt change path', async () => {
      expect(createPrettyPath('a/index.html', 'test')).toEqual('a/index.html');
    });

    it('glob star', async () => {
      expect(createPrettyPath('index.html', '**/*')).toEqual('index.html');
      expect(createPrettyPath('a/b/c.ts', '**/*')).toEqual('a/b/c.ts');
    });

    it('transform hash', async () => {
      expect(createPrettyPath('main.jhag2djh.css', '**/*.(?<hash0>[a-zA-Z0-9]+).css')).toEqual('main.(hash).css');
      expect(createPrettyPath('a/b/main.hasdhj.css', '**/*.(?<hash0>[a-zA-Z0-9]+).css')).toEqual('a/b/main.(hash).css');
    });

    it('transform multiple hashes', async () => {
      expect(
        createPrettyPath(
          'jhasdhj/a/test.hjas2djh.chunk.css',
          '(?<hash0>[a-zA-Z0-9]+)/**/*.(?<hash1>[a-zA-Z0-9]+).chunk.css'
        )
      ).toEqual('(hash)/a/test.(hash).chunk.css');

      expect(
        createPrettyPath(
          'jhasdhj/test.252343.chunk.css',
          '(?<hash0>[a-zA-Z0-9]+)/**/*.(?<hash1>[a-zA-Z0-9]+).chunk.css'
        )
      ).toEqual('(hash)/test.(hash).chunk.css');

      expect(createPrettyPath('jh2asjhd.252s343.css', '(?<hash0>[a-zA-Z0-9]+).(?<hash1>[a-zA-Z0-9]+).css')).toEqual(
        '(hash).(hash).css'
      );
    });

    it('transform only hashes', async () => {
      expect(
        createPrettyPath(
          'jhasdhj/a/test.aaaaa.chunk.css',
          '(?<hash0>[a-zA-Z0-9]+)/**/*.(?<group0>[a-zA-Z0-9]+).(?<hash1>[a-zA-Z0-9]+).css'
        )
      ).toEqual('(hash)/a/test.aaaaa.(hash).css');
    });
  });

  it('getRegexHash', async () => {
    expect(getRegexHash(0)).toMatchSnapshot();
    expect(getRegexHash(0)).toMatchSnapshot();
  });
});
