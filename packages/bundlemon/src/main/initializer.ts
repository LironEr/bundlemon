import logger, { setVerbose } from '../common/logger';
import { normalizeConfig, validateConfig } from './utils/configUtils';
import { Config, NormalizedConfig } from './types';
import { initOutputs } from './outputs';

interface InitializerResult {
  normalizedConfig: NormalizedConfig;
}

export async function initializer(config: Config): Promise<InitializerResult> {
  setVerbose(config.verbose ?? false);

  logger.debug(`Config\n${JSON.stringify(config, null, 2)}`);

  if (!validateConfig(config)) {
    process.exit(1);
  }

  const normalizedConfig = normalizeConfig(config);

  try {
    await initOutputs(normalizedConfig);
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
  }

  return { normalizedConfig };
}
