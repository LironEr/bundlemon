import { getEnhancedReport } from 'bundletracker-utils';
import logger from '../common/logger';
import { analyzeLocalFiles } from './analyzer';
import { createReport } from '../common/service';
import { normalizeConfig, validateConfig, validateGitConfig, validateProjectConfig } from './utils/configUtils';
import { Config, ProjectConfig, BundleTrackerResult, GitConfig } from './types';

export default async (
  config: Config,
  gitConfig: GitConfig,
  projectConfig: ProjectConfig
): Promise<BundleTrackerResult | undefined> => {
  logger.init({ verbose: config.verbose ?? false });

  logger.debug(`Config\n${JSON.stringify(config, null, 2)}`);
  logger.debug(`Git Config\n${JSON.stringify(gitConfig, null, 2)}`);

  validateConfig(config);
  validateGitConfig(gitConfig);
  validateProjectConfig(projectConfig);

  const normalizedConfig = normalizeConfig(config);

  const localFiles = await analyzeLocalFiles(normalizedConfig);

  const { branch, commitSha, baseBranch } = gitConfig;

  const response = await createReport(projectConfig, {
    branch,
    commitSha,
    baseBranch,
    files: localFiles,
    defaultCompression: normalizedConfig.defaultCompression,
  });

  if (!response) {
    return undefined;
  }

  const { url, report, baseReport } = response;

  const enhancedReport = getEnhancedReport(report, baseReport);

  return { url, report: enhancedReport };
};
