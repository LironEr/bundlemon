import { cosmiconfig } from 'cosmiconfig';
import logger from '../common/logger';
import type { Config } from '../main/types';

const explorer = cosmiconfig('bundlemon');

export async function loadConfigFile(configPath?: string): Promise<Config | undefined> {
  if (configPath) {
    logger.debug(`Load config file from "${configPath}"`);
  }

  try {
    const cosmiconfigResult = await (configPath ? explorer.load(configPath) : explorer.search());

    if (!cosmiconfigResult || cosmiconfigResult.isEmpty) {
      return undefined;
    }

    logger.debug(`Config file loaded from "${cosmiconfigResult.filepath}"`);

    return cosmiconfigResult.config;
  } catch (e) {
    logger.error(`Error loading config file: ${e}`);
    return undefined;
  }
}
