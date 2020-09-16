import { mocked } from 'ts-jest/utils';
import * as fs from 'fs';
import { Compression } from 'bundlemon-utils';
import { validateConfig, normalizeConfig } from '../utils/configUtils';
import { initializer } from '../initializer';
import { Config, NormalizedConfig } from '../types';
import { initOutputs } from '../outputs';

jest.mock('fs');
jest.mock('../../common/logger');
jest.mock('../utils/configUtils');
jest.mock('../outputs');

const config: Config = {
  files: [],
};

const expectedNormalizedConfig: NormalizedConfig = {
  baseDir: 'some_dir',
  files: [],
  defaultCompression: Compression.Gzip,
  onlyLocalAnalyze: false,
  reportOutput: [],
  verbose: false,
};

describe('initializer', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('validate config failed', async () => {
    const mockedValidateConfig = mocked(validateConfig).mockReturnValue(false);

    const result = await initializer(config);

    expect(mockedValidateConfig).toBeCalledWith(config);
    expect(result).toEqual(undefined);
  });

  test('base dir not found', async () => {
    const mockedValidateConfig = mocked(validateConfig).mockReturnValue(true);
    const mockedNormalizeConfig = mocked(normalizeConfig).mockReturnValue(expectedNormalizedConfig);
    const mockedExistsSync = mocked(fs.existsSync).mockReturnValue(false);

    const result = await initializer(config);

    expect(mockedValidateConfig).toBeCalledWith(config);
    expect(mockedNormalizeConfig).toBeCalledWith(config);
    expect(mockedExistsSync).toBeCalledWith(expectedNormalizedConfig.baseDir);
    expect(result).toEqual(undefined);
  });

  test('failed to initialize outputs', async () => {
    const mockedValidateConfig = mocked(validateConfig).mockReturnValue(true);
    const mockedNormalizeConfig = mocked(normalizeConfig).mockReturnValue(expectedNormalizedConfig);
    const mockedExistsSync = mocked(fs.existsSync).mockReturnValue(true);
    const mockedInitOutputs = mocked(initOutputs).mockRejectedValue(new Error('error'));

    const result = await initializer(config);

    expect(mockedValidateConfig).toBeCalledWith(config);
    expect(mockedNormalizeConfig).toBeCalledWith(config);
    expect(mockedExistsSync).toBeCalledWith(expectedNormalizedConfig.baseDir);
    expect(mockedInitOutputs).toBeCalledWith(expectedNormalizedConfig);
    expect(result).toEqual(undefined);
  });

  test('success', async () => {
    const mockedValidateConfig = mocked(validateConfig).mockReturnValue(true);
    const mockedNormalizeConfig = mocked(normalizeConfig).mockReturnValue(expectedNormalizedConfig);
    const mockedExistsSync = mocked(fs.existsSync).mockReturnValue(true);
    const mockedInitOutputs = mocked(initOutputs).mockResolvedValue();

    const result = await initializer(config);

    expect(mockedValidateConfig).toBeCalledWith(config);
    expect(mockedNormalizeConfig).toBeCalledWith(config);
    expect(mockedExistsSync).toBeCalledWith(expectedNormalizedConfig.baseDir);
    expect(mockedInitOutputs).toBeCalledWith(expectedNormalizedConfig);
    expect(result).toEqual(expectedNormalizedConfig);
  });
});
