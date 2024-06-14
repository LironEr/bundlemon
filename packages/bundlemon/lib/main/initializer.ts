import { existsSync as isDirExists } from 'fs';
import logger, { setVerbose } from '../common/logger';
import { validateConfig, getNormalizedConfig } from './utils/configUtils';
import { Config, NormalizedConfig } from './types';
import { initOutputs } from './outputs';
import ciVars from './utils/ci';
import { version } from '../common/consts';

export async function initializer(config: Config): Promise<NormalizedConfig | undefined> {
  setVerbose(config.verbose ?? false);

  logger.info(`Start BundleMon v${version}`);

  const validatedConfig = validateConfig(config);

  if (!validatedConfig) {
    logger.error('Invalid config');
    logger.debug(`Config\n${JSON.stringify(config, null, 2)}`);

    return undefined;
  }

  const normalizedConfig = Object.freeze(await getNormalizedConfig(validatedConfig));

  if (!normalizedConfig) {
    logger.debug(`Config\n${JSON.stringify(config, null, 2)}`);
    return undefined;
  }

  logger.debug(`Normalized config:\n${JSON.stringify(normalizedConfig, null, 2)}`);
  logger.debug(`CI vars:\n${JSON.stringify(ciVars, null, 2)}`);

  const { baseDir } = normalizedConfig;

  logger.info(`base directory: "${baseDir}"`);

  if (!isDirExists(baseDir)) {
    logger.error(`base directory "${baseDir}" not found`);

    return undefined;
  }

  try {
    await initOutputs(normalizedConfig);
  } catch (err) {
    logger.error((err as Error).message);
    return undefined;
  }

  return normalizedConfig;
}
