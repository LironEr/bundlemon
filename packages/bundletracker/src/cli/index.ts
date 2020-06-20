import { cosmiconfig } from 'cosmiconfig';
import bundletracker from '../main';
import { Config } from '../main/types';
import logger from '../common/logger';

const explorer = cosmiconfig('bundletracker');

export default async (): Promise<void> => {
  try {
    const cosmiconfigResult = await explorer.search();

    if (!cosmiconfigResult || cosmiconfigResult.isEmpty) {
      logger.error('Cant find config or the config file is empty');
      process.exit(1);
    }

    const config: Config = cosmiconfigResult.config;

    await bundletracker(config);

    process.exit(0);
  } catch (err) {
    logger.error('Unhandled error', err);
    process.exit(1);
  }
};
