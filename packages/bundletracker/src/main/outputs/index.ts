import logger from '../../common/logger';
import availableOutputs from './outputs';
import consoleOutput from './outputs/console';
import { parseOutput } from './utils';
import type { OutputInstance, Output } from './types';
import type { NormalizedConfig, ReportData } from '../types';

const outputCreator: Record<string, Output['create']> = availableOutputs.reduce((prev, curr) => {
  return { ...prev, [curr.name]: curr.create };
}, {});

const outputs: { name: string; instance: OutputInstance }[] = [];

export async function initOutputs(config: NormalizedConfig): Promise<void> {
  logger.debug('Init outputs');

  const consoleOutputInstance = consoleOutput.create({ config, options: undefined });
  if (!consoleOutputInstance) {
    logger.error('Failed to create console output instance');
    process.exit(1);
  }

  outputs.push({ name: consoleOutput.name, instance: consoleOutputInstance });

  if (config.reportOutput.length > 0) {
    for (const output of config.reportOutput) {
      const { name, options } = parseOutput(output);

      if (!outputCreator[name]) {
        logger.error(`Cant find output "${name}"`);
        process.exit(1);
      }
      try {
        const instance = outputCreator[name]({ config, options });

        if (instance) {
          outputs.push({ name, instance });
        } else {
          logger.info(`Ignoring output "${name}"`);
        }
      } catch (err) {
        logger.error(`Error while creating "${name}"`, err);
        process.exit(1);
      }
    }
  }
}

export async function generateOutputs(reportData: ReportData): Promise<void> {
  logger.debug('generate outputs');

  for await (const output of outputs) {
    const { name, instance } = output;
    logger.info(`Generate ${name} output`);

    await instance.generate(reportData);
  }
}
