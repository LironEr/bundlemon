import logger from '../../common/logger';
import { getAllOutputs } from './outputs';
import consoleOutput from './outputs/console';
import { parseOutput } from './utils';
import type { OutputInstance, Output } from './types';
import type { NormalizedConfig, ReportData } from '../types';

export class OutputManager {
  private outputs: { name: string; instance: OutputInstance }[] = [];
  private outputCreator: Record<string, Output['create']> = getAllOutputs().reduce((prev, curr) => {
    return { ...prev, [curr.name]: curr.create };
  }, {});

  initOutputs = async (config: NormalizedConfig): Promise<void> => {
    logger.debug('Init outputs');

    const consoleOutputInstance = await consoleOutput.create({ config, options: undefined });

    if (!consoleOutputInstance) {
      throw new Error('Failed to create console output instance');
    }

    this.outputs.push({ name: consoleOutput.name, instance: consoleOutputInstance });

    if (config.reportOutput.length > 0) {
      for (const output of config.reportOutput) {
        const { name, options } = parseOutput(output);

        if (!this.outputCreator[name]) {
          throw new Error(`Cant find output "${name}"`);
        }
        try {
          const instance = await this.outputCreator[name]({ config, options });

          if (instance) {
            this.outputs.push({ name, instance });
          } else {
            logger.debug(`Ignoring output "${name}"`);
          }
        } catch (err) {
          throw new Error(`Error while creating "${name}". ${err.message}`);
        }
      }
    }
  };

  generateOutputs = async (reportData: ReportData): Promise<void> => {
    logger.debug('generate outputs');

    for await (const output of this.getOutputs()) {
      const { name, instance } = output;
      logger.info(`Generate ${name} output`);
      try {
        await instance.generate(reportData);
      } catch (err) {
        throw new Error(`Error while generating "${name}" output. ${err.message}`);
      }
    }
  };

  getOutputs = (): OutputManager['outputs'] => this.outputs;
}

export const { initOutputs, generateOutputs } = new OutputManager();
