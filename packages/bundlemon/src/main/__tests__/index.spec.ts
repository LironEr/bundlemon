import { mocked } from 'ts-jest/utils';
import { Compression, DiffChange, FileDetails, Report, Status } from 'bundlemon-utils';
import main from '..';
import { analyzeLocalFiles } from '../analyzer';
import { generateOutputs } from '../outputs';
import { generateReport } from '../report';
import { initializer } from '../initializer';
import { Config } from '../types';
import { generateNormalizedConfigRemoteOn } from '../utils/__tests__/configUtils';

jest.mock('fs');
jest.mock('../../common/logger');
jest.mock('../analyzer');
jest.mock('../outputs');
jest.mock('../report');
jest.mock('../initializer');

const config: Config = {
  files: [],
};

const files: FileDetails[] = [{ path: 'bundle.js', compression: Compression.Gzip, pattern: '**/*.js', size: 1200 }];
const groups: FileDetails[] = [{ path: '*.css', compression: Compression.Gzip, pattern: '*.css', size: 500 }];
const report: Report = {
  files: [
    {
      pattern: '**/*.js',
      path: 'path/to/file.js',
      compression: Compression.Gzip,
      maxSize: 1500,
      diff: { change: DiffChange.Update, bytes: 200, percent: 20 },
      size: 1200,
      status: Status.Pass,
    },
  ],
  groups: [
    {
      pattern: '*.css',
      path: '*.css',
      compression: Compression.Gzip,
      maxSize: 700,
      diff: { change: DiffChange.NoChange, bytes: 0, percent: 0 },
      size: 500,
      status: Status.Pass,
    },
  ],
  stats: { baseBranchSize: 1000, currBranchSize: 1200, diff: { bytes: 200, percent: 20 } },
  status: Status.Pass,
  metadata: {},
};
describe('main', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('success', () => {
    test('files and groups exists', async () => {
      const normalizedConfig = generateNormalizedConfigRemoteOn();
      const mockedInitializer = mocked(initializer).mockResolvedValue(normalizedConfig);
      const analyzeResult = { files, groups };
      const mockedAnalyzeLocalFiles = mocked(analyzeLocalFiles).mockResolvedValue(analyzeResult);
      const mockedGenerateReport = mocked(generateReport).mockResolvedValue(report);
      const mockedGenerateOutputs = mocked(generateOutputs).mockResolvedValue();

      const result = await main(config);

      expect(mockedInitializer).toBeCalledWith(config);
      expect(mockedAnalyzeLocalFiles).toBeCalledWith(normalizedConfig);
      expect(mockedGenerateReport).toBeCalledWith(normalizedConfig, analyzeResult);
      expect(mockedGenerateOutputs).toBeCalledWith(report);
      expect(result).toEqual(report);
    });

    test('only files', async () => {
      const normalizedConfig = generateNormalizedConfigRemoteOn();
      const mockedInitializer = mocked(initializer).mockResolvedValue(normalizedConfig);
      const analyzeResult = { files, groups: [] };
      const mockedAnalyzeLocalFiles = mocked(analyzeLocalFiles).mockResolvedValue(analyzeResult);
      const mockedGenerateReport = mocked(generateReport).mockResolvedValue(report);
      const mockedGenerateOutputs = mocked(generateOutputs).mockResolvedValue();

      const result = await main(config);

      expect(mockedInitializer).toBeCalledWith(config);
      expect(mockedAnalyzeLocalFiles).toBeCalledWith(normalizedConfig);
      expect(mockedGenerateReport).toBeCalledWith(normalizedConfig, analyzeResult);
      expect(mockedGenerateOutputs).toBeCalledWith(report);
      expect(result).toEqual(report);
    });

    test('only groups', async () => {
      const normalizedConfig = generateNormalizedConfigRemoteOn();
      const mockedInitializer = mocked(initializer).mockResolvedValue(normalizedConfig);
      const analyzeResult = { files: [], groups };
      const mockedAnalyzeLocalFiles = mocked(analyzeLocalFiles).mockResolvedValue(analyzeResult);
      const mockedGenerateReport = mocked(generateReport).mockResolvedValue(report);
      const mockedGenerateOutputs = mocked(generateOutputs).mockResolvedValue();

      const result = await main(config);

      expect(mockedInitializer).toBeCalledWith(config);
      expect(mockedAnalyzeLocalFiles).toBeCalledWith(normalizedConfig);
      expect(mockedGenerateReport).toBeCalledWith(normalizedConfig, analyzeResult);
      expect(mockedGenerateOutputs).toBeCalledWith(report);
      expect(result).toEqual(report);
    });
  });

  describe('fail', () => {
    test('initializer failed', async () => {
      const mockedInitializer = mocked(initializer).mockResolvedValue(undefined);
      const mockedAnalyzeLocalFiles = mocked(analyzeLocalFiles).mockResolvedValue({ files, groups });
      const mockedGenerateReport = mocked(generateReport).mockResolvedValue(report);
      const mockedGenerateOutputs = mocked(generateOutputs).mockResolvedValue();

      await expect(main(config)).rejects.toThrow('Failed to initialize');

      expect(mockedInitializer).toHaveBeenCalledTimes(1);
      expect(mockedAnalyzeLocalFiles).toHaveBeenCalledTimes(0);
      expect(mockedGenerateReport).toHaveBeenCalledTimes(0);
      expect(mockedGenerateOutputs).toHaveBeenCalledTimes(0);
    });

    test('empty files and groups', async () => {
      const normalizedConfig = generateNormalizedConfigRemoteOn();
      const mockedInitializer = mocked(initializer).mockResolvedValue(normalizedConfig);
      const mockedAnalyzeLocalFiles = mocked(analyzeLocalFiles).mockResolvedValue({ files: [], groups: [] });
      const mockedGenerateReport = mocked(generateReport).mockResolvedValue(report);
      const mockedGenerateOutputs = mocked(generateOutputs).mockResolvedValue();

      await expect(main(config)).rejects.toThrow('No files or groups found');

      expect(mockedInitializer).toHaveBeenCalledTimes(1);
      expect(mockedAnalyzeLocalFiles).toHaveBeenCalledTimes(1);
      expect(mockedGenerateReport).toHaveBeenCalledTimes(0);
      expect(mockedGenerateOutputs).toHaveBeenCalledTimes(0);
    });

    test('generate report failed', async () => {
      const normalizedConfig = generateNormalizedConfigRemoteOn();
      const mockedInitializer = mocked(initializer).mockResolvedValue(normalizedConfig);
      const mockedAnalyzeLocalFiles = mocked(analyzeLocalFiles).mockResolvedValue({ files, groups });
      const mockedGenerateReport = mocked(generateReport).mockResolvedValue(undefined);
      const mockedGenerateOutputs = mocked(generateOutputs).mockResolvedValue();

      await expect(main(config)).rejects.toThrow('Failed to generate report');

      expect(mockedInitializer).toHaveBeenCalledTimes(1);
      expect(mockedAnalyzeLocalFiles).toHaveBeenCalledTimes(1);
      expect(mockedGenerateReport).toHaveBeenCalledTimes(1);
      expect(mockedGenerateOutputs).toHaveBeenCalledTimes(0);
    });
  });
});
