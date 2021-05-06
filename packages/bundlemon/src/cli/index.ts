import { program } from 'commander';
import { Status } from 'bundlemon-utils';
import bundlemon from '../main';
import logger from '../common/logger';
import { version } from '../common/consts';
import type { CliOptions } from './types';
import { loadConfigFile } from './configFile';

program.version(version).option('-c, --config [path]', 'Config file path');

export default async (): Promise<void> => {
  try {
    program.parse(process.argv);

    const options: CliOptions = program.opts();

    const config = await loadConfigFile(options.config);

    if (!config) {
      logger.error('Cant find config or the config file is empty');
      process.exit(1);
    }

    const report = await bundlemon(config);

    process.exit(report.status === Status.Pass ? 0 : 1);
  } catch (err) {
    logger.error('Unhandled error', err);
    process.exit(1);
  }
};
