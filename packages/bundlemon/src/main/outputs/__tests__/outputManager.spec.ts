import { mocked } from 'ts-jest/utils';
import { OutputManager } from '../outputManager';
import consoleOutput from '../outputs/console';
import { Output } from '../types';
import { getAllOutputs } from '../outputs';
import { generateNormalizedConfigRemoteOn } from '../../utils/__tests__/configUtils';

jest.mock('../outputs', () => ({
  __esModule: true,
  getAllOutputs: jest.fn().mockReturnValue([]),
}));
jest.mock('../../../common/logger');
jest.mock('../outputs/console', () => ({
  __esModule: true,
  default: {
    name: 'console',
    create: jest.fn(),
  },
}));

describe('outputManager', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mocked(consoleOutput.create).mockResolvedValue({ generate: jest.fn() });
    mocked(getAllOutputs).mockReturnValue([]);
  });

  describe('initOutputs', () => {
    test('failed to create console output', async () => {
      mocked(consoleOutput.create).mockResolvedValue(undefined);

      const manager = new OutputManager();

      await expect(manager.initOutputs(generateNormalizedConfigRemoteOn())).rejects.toThrow();
    });

    test('no outputs in config', async () => {
      const manager = new OutputManager();

      await manager.initOutputs(generateNormalizedConfigRemoteOn());

      const outputs = manager.getOutputs();

      expect(outputs).toHaveLength(1);
      expect(outputs[0].name).toEqual('console');
    });

    test('mock output', async () => {
      const mockGenerate = jest.fn();
      const mockOutput: Output = {
        name: 'mock',
        create: jest.fn(() => {
          return {
            generate: mockGenerate,
          };
        }),
      };

      mocked(getAllOutputs).mockReturnValue([mockOutput]);

      const config = generateNormalizedConfigRemoteOn({ reportOutput: [mockOutput.name] });

      const manager = new OutputManager();

      await manager.initOutputs(config);

      const outputs = manager.getOutputs();

      expect(outputs).toHaveLength(2);
      expect(outputs.map((o) => o.name)).toEqual(['console', mockOutput.name]);
      expect(outputs[1].instance.generate).toEqual(mockGenerate);
    });

    test('ignore mock output', async () => {
      const mockOutput: Output = {
        name: 'mock',
        create: jest.fn().mockResolvedValue(undefined),
      };

      mocked(getAllOutputs).mockReturnValue([mockOutput]);

      const config = generateNormalizedConfigRemoteOn({ reportOutput: [mockOutput.name] });

      const manager = new OutputManager();

      await manager.initOutputs(config);

      const outputs = manager.getOutputs();

      expect(outputs).toHaveLength(1);
      expect(outputs[0].name).toEqual('console');
    });

    test('create mock output throws', async () => {
      const mockOutput: Output = {
        name: 'mock',
        create: jest.fn().mockRejectedValue(new Error('error')),
      };

      mocked(getAllOutputs).mockReturnValue([mockOutput]);

      const config = generateNormalizedConfigRemoteOn({ reportOutput: [mockOutput.name] });

      const manager = new OutputManager();

      await expect(manager.initOutputs(config)).rejects.toThrow();
    });

    test('unknown output name', async () => {
      const mockOutput: Output = {
        name: 'mock',
        create: jest.fn(() => {
          return {
            generate: jest.fn(),
          };
        }),
      };

      mocked(getAllOutputs).mockReturnValue([mockOutput]);

      const config = generateNormalizedConfigRemoteOn({ reportOutput: ['unknown-name'] });

      const manager = new OutputManager();

      await expect(manager.initOutputs(config)).rejects.toThrow();
    });
  });

  describe('generateOutputs', () => {
    test('validate generate output called', async () => {
      const manager = new OutputManager();

      const outputs: ReturnType<typeof manager.getOutputs> = [
        {
          name: 'a',
          instance: { generate: jest.fn().mockResolvedValue(undefined) },
        },
        {
          name: 'b',
          instance: { generate: jest.fn() },
        },
      ];

      manager.getOutputs = () => outputs;
      const reportData: any = { data: 'data' };

      await expect(manager.generateOutputs(reportData)).resolves.toEqual(undefined);

      expect(outputs[0].instance.generate).toHaveBeenCalledWith(reportData);
      expect(outputs[1].instance.generate).toHaveBeenCalledWith(reportData);
    });

    test('generate output throws', async () => {
      const manager = new OutputManager();

      const outputs: ReturnType<typeof manager.getOutputs> = [
        {
          name: 'a',
          instance: { generate: jest.fn().mockResolvedValue(undefined) },
        },
        {
          name: 'b',
          instance: { generate: jest.fn().mockRejectedValue(new Error('err')) },
        },
        { name: 'c', instance: { generate: jest.fn() } },
      ];

      manager.getOutputs = () => outputs;

      const reportData: any = { data: 'data' };
      await expect(manager.generateOutputs(reportData)).rejects.toThrow();

      expect(outputs[0].instance.generate).toHaveBeenCalledWith(reportData);
      expect(outputs[1].instance.generate).toHaveBeenCalledWith(reportData);
      expect(outputs[2].instance.generate).toHaveBeenCalledTimes(0);
    });
  });
});
