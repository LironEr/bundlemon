import ConsoleOutput from './handlers/ConsoleOutput';
import { ReportOutputName, ReportData } from './handlers/types';
import { outputFactory } from './handlers/utils';

import type BaseOutput from './handlers/BaseOutput';
import type { NormalizedConfig } from '../types';
import logger from '../../common/logger';

const outputs: BaseOutput<ReportOutputName>[] = [];

export async function initOutputs(config: NormalizedConfig): Promise<void> {
  outputs.push(new ConsoleOutput({ config, options: undefined }));

  if (config.reportOutput.length > 0) {
    for (const output of config.reportOutput) {
      const instance = outputFactory(config, output);

      if (instance) {
        await instance.validate();
      }
    }
  }
}

export async function generateOutputs(reportData: ReportData): Promise<void> {
  logger.debug('generate outputs');

  for await (const output of outputs) {
    await output.generate(reportData);
  }
}
