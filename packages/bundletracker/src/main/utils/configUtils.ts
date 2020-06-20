import * as yup from 'yup';
import * as bytes from 'bytes';
import { Config, NormalizedConfig, NormalizedFileConfig, ProjectConfig, GitConfig } from '../types';
import logger from '../../common/logger';
import { compressions } from 'bundletracker-utils';
import { validateYup } from './validationUtils';

export function normalizeConfig(config: Config): NormalizedConfig {
  return {
    ...config,
    verbose: config.verbose ?? false,
    defaultCompression: config.defaultCompression ?? 'gzip',
    trackBranches: config.trackBranches || ['master'],
    reportOutput: config.reportOutput || [],
    shouldRetainReportUrl: config.shouldRetainReportUrl ?? true,
    files: config.files.map(
      (f): NormalizedFileConfig => {
        const { maxSize, ...rest } = f;

        return { maxSize: maxSize ? bytes(maxSize) : undefined, ...rest };
      }
    ),
  };
}

export function validateConfig(config: Config): asserts config is Config {
  const schema = yup
    .object()
    .required()
    .shape<Config>({
      baseDir: yup.string().required(),
      verbose: yup.boolean().optional(),
      defaultCompression: yup.string().optional().oneOf(compressions),
      trackBranches: yup.array().optional().of(yup.string().required()),
      shouldRetainReportUrl: yup.boolean().optional(),
      files: yup
        .array()
        .required()
        .of(
          yup
            .object()
            .required()
            .shape({
              path: yup.string().required(),
              maxSize: yup
                .string()
                .optional()
                .test(
                  'maxSize',
                  (params) => `${params.path} not a valid max size`,
                  (value: string | undefined) => {
                    if (value === undefined) {
                      return true;
                    }
                    const sizeInBytes = bytes(value);

                    return !isNaN(sizeInBytes);
                  }
                ),
            })
        ),
    });

  validateYup(schema, config, 'bundletracker');
}

export function validateProjectConfig(config: ProjectConfig): asserts config is ProjectConfig {
  const { projectId, apiKey } = config;

  if (!projectId) {
    logger.error('Missing "BUNDLETRACKER_PROJECT_ID" env var');
    process.exit(1);
  }

  if (!apiKey) {
    logger.error('Missing "BUNDLETRACKER_APIKEY" env var');
    process.exit(1);
  }
}

export function validateGitConfig(config: Partial<GitConfig>): asserts config is GitConfig {
  const { branch, commitSha } = config;

  if (!branch) {
    logger.error('Missing "CI_BRANCH" env var');
    process.exit(1);
  }

  if (!commitSha) {
    logger.error('Missing "CI_COMMIT_SHA" env var');
    process.exit(1);
  }
}
