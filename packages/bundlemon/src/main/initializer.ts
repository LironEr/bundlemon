import { existsSync as isDirExists } from 'fs';
import logger, { setVerbose } from '../common/logger';
import { normalizeConfig, validateConfig } from './utils/configUtils';
import { Config, NormalizedConfig } from './types';
import { initOutputs } from './outputs';

export async function initializer(config: Config): Promise<NormalizedConfig | undefined> {
  setVerbose(config.verbose ?? false);

  logger.debug(`Config\n${JSON.stringify(config, null, 2)}`);

  if (!validateConfig(config)) {
    return undefined;
  }

  const normalizedConfig = normalizeConfig(config);

  const { baseDir } = normalizedConfig;

  logger.debug(`baseDir "${baseDir}"`);

  if (!isDirExists(baseDir)) {
    logger.error(`baseDir "${baseDir}" not found`);

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
