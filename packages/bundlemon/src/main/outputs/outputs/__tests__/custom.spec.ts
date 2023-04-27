const loggerMock = {
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  clone: jest.fn(),
};

jest.mock('../../../../common/logger', () => ({
  __esModule: true,
  createLogger: jest.fn(() => loggerMock),
  default: loggerMock,
}));

import * as path from 'path';
import { Compression, Report, Status } from 'bundlemon-utils';
import { NormalizedConfig } from '../../../types';
import { OutputInstance, OutputCreateParams } from '../../types';
import output from '../custom';

const testReport: Report = {
  metadata: {},
  files: [],
  groups: [],
  stats: { diff: { bytes: 0, percent: 0 }, currBranchSize: 0, baseBranchSize: 0 },
  status: Status.Pass,
};

const testNormalizedConfig: NormalizedConfig = {
  remote: false,
  files: [],
  groups: [],
  baseDir: '',
  verbose: true,
  defaultCompression: Compression.None,
  reportOutput: ['custom'],
  includeCommitMessage: false,
};

describe('custom output', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('runs synchronous custom output function', async () => {
    const outputFuncMock = jest.fn();
    jest.mock('./fixtures/sync-custom-output.js', () => outputFuncMock);
    const outputParams: OutputCreateParams = {
      config: testNormalizedConfig,
      options: {
        path: path.join(__dirname, 'fixtures/sync-custom-output.js'),
      },
    };
    const generateCustomOutput: OutputInstance = (await output.create(outputParams)) as OutputInstance;
    expect(generateCustomOutput).toBeDefined();
    await generateCustomOutput.generate(testReport);
    expect(outputFuncMock).toHaveBeenCalledTimes(1);
    expect(outputFuncMock).toHaveBeenCalledWith(testReport);
  });

  it('runs asynchronous custom output function', async () => {
    const outputFuncMock = jest.fn().mockResolvedValue(undefined);
    jest.mock('./fixtures/async-custom-output.js', () => outputFuncMock);
    const outputParams: OutputCreateParams = {
      config: testNormalizedConfig,
      options: {
        path: path.join(__dirname, 'fixtures/async-custom-output.js'),
      },
    };
    const generateCustomOutput: OutputInstance = (await output.create(outputParams)) as OutputInstance;
    expect(generateCustomOutput).toBeDefined();
    await generateCustomOutput.generate(testReport);
    expect(outputFuncMock).toHaveBeenCalledTimes(1);
    expect(outputFuncMock).toHaveBeenCalledWith(testReport);
  });

  it('sync output throws error', async () => {
    const error = new Error('error');
    const outputFuncMock = jest.fn().mockImplementation(() => {
      throw error;
    });
    jest.mock('./fixtures/sync-custom-output-throw.js', () => outputFuncMock);
    const outputParams: OutputCreateParams = {
      config: testNormalizedConfig,
      options: {
        path: path.join(__dirname, 'fixtures/sync-custom-output-throw.js'),
      },
    };
    const generateCustomOutput: OutputInstance = (await output.create(outputParams)) as OutputInstance;
    expect(generateCustomOutput).toBeDefined();

    await expect(generateCustomOutput.generate(testReport)).rejects.toThrow(error);
    expect(outputFuncMock).toHaveBeenCalledTimes(1);
    expect(outputFuncMock).toHaveBeenCalledWith(testReport);
  });

  it('async output throws error', async () => {
    const error = new Error('error');
    const outputFuncMock = jest.fn().mockRejectedValue(error);
    jest.mock('./fixtures/async-custom-output-throw.js', () => outputFuncMock);
    const outputParams: OutputCreateParams = {
      config: testNormalizedConfig,
      options: {
        path: path.join(__dirname, 'fixtures/async-custom-output-throw.js'),
      },
    };
    const generateCustomOutput: OutputInstance = (await output.create(outputParams)) as OutputInstance;
    expect(generateCustomOutput).toBeDefined();

    await expect(generateCustomOutput.generate(testReport)).rejects.toThrow(error);
    expect(outputFuncMock).toHaveBeenCalledTimes(1);
    expect(outputFuncMock).toHaveBeenCalledWith(testReport);
  });

  it('throws error if custom output does not exist', async () => {
    const outputParams: OutputCreateParams = {
      config: testNormalizedConfig,
      options: {
        path: path.join(__dirname, 'incorrect/file/path/test.js'),
      },
    };
    await expect(output.create(outputParams)).rejects.toThrow();
  });

  it('throws error if path is not given', async () => {
    const outputParams: OutputCreateParams = {
      config: testNormalizedConfig,
      options: {},
    };
    await expect(output.create(outputParams)).rejects.toThrow();
  });

  it('throws error if custom output does not export default function', async () => {
    const outputParams: OutputCreateParams = {
      config: testNormalizedConfig,
      options: {
        path: path.join(__dirname, 'fixtures/not-a-function-custom-output.js'),
      },
    };
    await expect(output.create(outputParams)).rejects.toThrow();
  });
});
