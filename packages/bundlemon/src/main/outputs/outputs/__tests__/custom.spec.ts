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
};

const syncCustomOutputMock = jest.fn((report) => {
  console.log('Hello from mock!');
  return report;
});

const asyncCustomOutputMock = jest.fn(async (report) => {
  console.log('Hello from mock!');
  return Promise.resolve(report);
});

describe('custom output', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mock('./fixtures/sync-custom-output.js', () => syncCustomOutputMock);
    jest.mock('./fixtures/async-custom-output.js', () => asyncCustomOutputMock);
  });

  it('runs synchronous custom output function', async () => {
    const outputParams: OutputCreateParams = {
      config: testNormalizedConfig,
      options: {
        path: 'src/main/outputs/outputs/__tests__/fixtures/sync-custom-output.js',
      },
    };
    const generateCustomOutput: OutputInstance = (await output.create(outputParams)) as OutputInstance;
    expect(generateCustomOutput).not.toBeUndefined();
    await generateCustomOutput.generate(testReport);
    expect(syncCustomOutputMock).toBeCalledTimes(1);
    expect(syncCustomOutputMock).toBeCalledWith(testReport);
  });

  it('runs asynchronous custom output function', async () => {
    const outputParams: OutputCreateParams = {
      config: testNormalizedConfig,
      options: {
        path: 'src/main/outputs/outputs/__tests__/fixtures/async-custom-output.js',
      },
    };
    const generateCustomOutput: OutputInstance = (await output.create(outputParams)) as OutputInstance;
    expect(generateCustomOutput).not.toBeUndefined();
    await generateCustomOutput.generate(testReport);
    expect(asyncCustomOutputMock).toHaveBeenCalledTimes(1);
    expect(asyncCustomOutputMock).toBeCalledWith(testReport);
  });

  it('throws error if custom output does not exist', () => {
    const outputParams: OutputCreateParams = {
      config: testNormalizedConfig,
      options: {
        path: 'incorrect/file/path/test.js',
      },
    };
    expect(() => output.create(outputParams)).toThrow();
  });

  it('throws error if path is not given', () => {
    const outputParams: OutputCreateParams = {
      config: testNormalizedConfig,
      options: {},
    };
    expect(() => output.create(outputParams)).toThrow();
  });
});
