import { branch, sha as commitSha, pull_request_target_branch as baseBranch } from 'ci-env';
import logger from '../common/logger';
import { normalizeConfig, validateConfig, validateGitConfig } from './utils/configUtils';
import { Config, GitConfig, NormalizedConfig } from './types';
import { initOutputs } from './outputs';

interface InitializerResult {
  normalizedConfig: NormalizedConfig;
  gitConfig: GitConfig;
}

export async function initializer(config: Config): Promise<InitializerResult> {
  logger.init({ verbose: config.verbose ?? false });

  logger.debug(`Config\n${JSON.stringify(config, null, 2)}`);

  validateConfig(config);

  const gitConfig: Partial<GitConfig> = { branch, commitSha, baseBranch };
  logger.debug(`Git Config\n${JSON.stringify(gitConfig, null, 2)}`);

  validateGitConfig(gitConfig);

  const normalizedConfig = normalizeConfig(config);

  await initOutputs(normalizedConfig);

  return { normalizedConfig, gitConfig };
}
