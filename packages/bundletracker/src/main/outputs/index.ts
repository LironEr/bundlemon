import ConsoleOutput from './handlers/ConsoleOutput';
import { ReportOutputName, ReportData } from './handlers/types';
import { createOutputInstance } from './handlers/factory';
import logger from '../../common/logger';

import type BaseOutput from './handlers/BaseOutput';
import type { NormalizedConfig } from '../types';

const outputs: BaseOutput<ReportOutputName>[] = [];

export async function initOutputs(config: NormalizedConfig): Promise<void> {
  logger.debug('Init outputs');

  outputs.push(new ConsoleOutput({ config, options: undefined }));

  if (config.reportOutput.length > 0) {
    for (const output of config.reportOutput) {
      const instance = createOutputInstance(config, output);

      if (instance) {
        if (!instance.isEnabled()) {
          logger.debug(`Ignoring ${instance.outputName} output`);
          continue;
        }

        logger.debug(`Validate ${instance.outputName} output`);
        if (!(await instance.areOptionsValid())) {
          logger.error(`${instance.outputName} output options are invalid`);
          process.exit(1);
        }

        outputs.push(instance);
      }
    }
  }
}

export async function generateOutputs(reportData: ReportData): Promise<void> {
  logger.debug('generate outputs');

  for await (const output of outputs) {
    logger.debug(`Generate ${output.outputName} output`);
    await output.generate(reportData);
  }
}
