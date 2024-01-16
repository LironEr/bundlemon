import * as fs from 'fs';
import * as path from 'path';
import { getAllPaths, createPrettyPath, getRegexHash, getMatchFiles } from '../pathUtils';
import { MatchFile } from '../../types';

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

  describe('getFilesGroupByPattern', () => {
    const fixturePath = __dirname + '/fixtures/getFilesGroupByPattern';

    const files = [
      path.join(fixturePath, 'index.html'),
      path.join(fixturePath, 'service.js'),
      path.join(fixturePath, 'static/js/about.hja-sj2u.js'),
      path.join(fixturePath, 'static/js/login.a2j21i.js'),
      path.join(fixturePath, 'static/js/main.jh2j2ks.js'),
      path.join(fixturePath, 'static/js/other.js'),
      path.join(fixturePath, 'static/js/test.jks22892s.chunk.js'),
      path.join(fixturePath, 'static/js/test2.js2k2kxj.chunk.js'),
      path.join(fixturePath, 'static/styles/main.hjsj2ks.css'),
      path.join(fixturePath, 'static/styles/other.css'),
    ];

    it('stop on match: true', async () => {
      const patterns: string[] = [
        'index.html',
        '**/*.<hash>.chunk.js',
        '**/main.<hash>.js',
        '**/*.<hash>.js',
        '**/*.js',
      ];

      const expectedMatchFiles: Record<string, MatchFile[]> = {
        'index.html': [{ fullPath: path.join(fixturePath, '/index.html'), prettyPath: 'index.html' }],
        '**/*.js': [
          { fullPath: path.join(fixturePath, '/service.js'), prettyPath: 'service.js' },
          { fullPath: path.join(fixturePath, '/static/js/other.js'), prettyPath: 'static/js/other.js' },
        ],
        '**/*.<hash>.js': [
          { fullPath: path.join(fixturePath, '/static/js/about.hja-sj2u.js'), prettyPath: 'static/js/about.(hash).js' },
          { fullPath: path.join(fixturePath, '/static/js/login.a2j21i.js'), prettyPath: 'static/js/login.(hash).js' },
        ],
        '**/main.<hash>.js': [
          { fullPath: path.join(fixturePath, '/static/js/main.jh2j2ks.js'), prettyPath: 'static/js/main.(hash).js' },
        ],
        '**/*.<hash>.chunk.js': [
          {
            fullPath: path.join(fixturePath, '/static/js/test.jks22892s.chunk.js'),
            prettyPath: 'static/js/test.(hash).chunk.js',
          },
          {
            fullPath: path.join(fixturePath, '/static/js/test2.js2k2kxj.chunk.js'),
            prettyPath: 'static/js/test2.(hash).chunk.js',
          },
        ],
      };

      const matchFiles = await getMatchFiles(fixturePath, files, patterns, true);

      expect(matchFiles).toEqual(expectedMatchFiles);
    });

    it('stop on match: false', async () => {
      const patterns: string[] = ['index.html', '**/*.<hash>.chunk.js', '**/*.js'];

      const expectedMatchFiles: Record<string, MatchFile[]> = {
        'index.html': [{ fullPath: path.join(fixturePath, '/index.html'), prettyPath: 'index.html' }],
        '**/*.js': [
          { fullPath: path.join(fixturePath, '/service.js'), prettyPath: 'service.js' },
          {
            fullPath: path.join(fixturePath, '/static/js/about.hja-sj2u.js'),
            prettyPath: 'static/js/about.hja-sj2u.js',
          },
          { fullPath: path.join(fixturePath, '/static/js/login.a2j21i.js'), prettyPath: 'static/js/login.a2j21i.js' },
          { fullPath: path.join(fixturePath, '/static/js/main.jh2j2ks.js'), prettyPath: 'static/js/main.jh2j2ks.js' },
          { fullPath: path.join(fixturePath, '/static/js/other.js'), prettyPath: 'static/js/other.js' },
          {
            fullPath: path.join(fixturePath, '/static/js/test.jks22892s.chunk.js'),
            prettyPath: 'static/js/test.jks22892s.chunk.js',
          },
          {
            fullPath: path.join(fixturePath, '/static/js/test2.js2k2kxj.chunk.js'),
            prettyPath: 'static/js/test2.js2k2kxj.chunk.js',
          },
        ],
        '**/*.<hash>.chunk.js': [
          {
            fullPath: path.join(fixturePath, '/static/js/test.jks22892s.chunk.js'),
            prettyPath: 'static/js/test.(hash).chunk.js',
          },
          {
            fullPath: path.join(fixturePath, '/static/js/test2.js2k2kxj.chunk.js'),
            prettyPath: 'static/js/test2.(hash).chunk.js',
          },
        ],
      };

      const matchFiles = await getMatchFiles(fixturePath, files, patterns, false);

      expect(matchFiles).toEqual(expectedMatchFiles);
    });
  });
});
