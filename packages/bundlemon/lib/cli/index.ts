import { program, Option } from 'commander';
import { Compression, Status } from 'bundlemon-utils';
import bundlemon from '../main';
import logger from '../common/logger';
import { version } from '../common/consts';
import { loadConfigFile } from './configFile';

import type { CliOptions } from './types';
import type { Config } from '../main/types';

program
  .version(version)
  .addOption(new Option('-c, --config <path>', 'config file path'))
  .addOption(new Option('--subProject <name>', 'sub project name'))
  .addOption(
    new Option('--defaultCompression <compression>', 'default compression').choices(Object.values(Compression))
  );

export default async (): Promise<void> => {
  try {
    program.parse(process.argv);

    const options: CliOptions = program.opts();

    const config = await loadConfigFile(options.config);

    if (!config) {
      logger.error('Cant find config or the config file is empty');
      process.exit(1);
    }

    const report = await bundlemon(mergeCliOptions(config, options));

    process.exit(report.status === Status.Pass ? 0 : 1);
  } catch (err) {
    logger.error('Unhandled error', err);
    process.exit(1);
  }
};

function mergeCliOptions(config: Config, options: CliOptions): Config {
  const newConfig = { ...config };

  if (options.subProject) {
    newConfig.subProject = options.subProject;
  }

  if (options.defaultCompression) {
    newConfig.defaultCompression = options.defaultCompression;
  }

  return newConfig;
}
