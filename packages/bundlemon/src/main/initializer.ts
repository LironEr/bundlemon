import { existsSync as isDirExists } from 'fs';
import logger, { setVerbose } from '../common/logger';
import { normalizeConfig, validateConfig } from './utils/configUtils';
import { Config, NormalizedConfig } from './types';
import { initOutputs } from './outputs';
import ciVars from './utils/ci';

export async function initializer(config: Config): Promise<NormalizedConfig | undefined> {
  setVerbose(config.verbose ?? false);

  logger.debug(`Config\n${JSON.stringify(config, null, 2)}`);

  if (!validateConfig(config)) {
    return undefined;
  }

  logger.debug(`CI vars\n${JSON.stringify(ciVars, null, 2)}`);

  const normalizedConfig = normalizeConfig(config);

  const { baseDir } = normalizedConfig;

  logger.info(`base directory: "${baseDir}"`);

  if (!isDirExists(baseDir)) {
    logger.error(`base directory "${baseDir}" not found`);

    return undefined;
  }

  try {
    await initOutputs(normalizedConfig);
  } catch (err) {
    logger.error(err.message);
    return undefined;
  }

  return normalizedConfig;
}
