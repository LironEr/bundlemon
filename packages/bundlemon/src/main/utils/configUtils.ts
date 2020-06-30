import * as yup from 'yup';
import * as bytes from 'bytes';
import { branch, sha, pull_request_target_branch } from 'ci-env';
import { Config, NormalizedConfig, NormalizedFileConfig, GitConfig } from '../types';
import logger from '../../common/logger';
import { compressions } from 'bundlemon-utils';
import { validateYup } from './validationUtils';

export function normalizeConfig(config: Config): NormalizedConfig {
  return {
    verbose: false,
    defaultCompression: 'gzip',
    trackBranches: ['master'],
    reportOutput: [],
    shouldRetainReportUrl: true,
    onlyLocalAnalyze: false,
    ...config,
    files: config.files.map(
      (f): NormalizedFileConfig => {
        const { maxSize, ...rest } = f;

        return { maxSize: maxSize ? bytes(maxSize) : undefined, ...rest };
      }
    ),
  };
}

export function validateConfig(config: Config): config is Config {
  const schema = yup
    .object()
    .required()
    .shape<Config>({
      baseDir: yup.string().required(),
      verbose: yup.boolean().optional(),
      defaultCompression: yup.string().optional().oneOf(compressions),
      trackBranches: yup.array().optional().of(yup.string().required()),
      shouldRetainReportUrl: yup.boolean().optional(),
      onlyLocalAnalyze: yup.boolean().optional(),
      reportOutput: yup
        .array()
        .of(
          yup.lazy((val) => (typeof val === 'string' ? yup.string().required() : yup.array().required().min(2).max(2)))
        ),
      files: yup
        .array()
        .required()
        .min(1)
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

  return validateYup(schema, config, 'bundlemon');
}

export function getGitConfig(): GitConfig | undefined {
  if (!branch) {
    logger.error('Missing "CI_BRANCH" env var');
    return undefined;
  }

  if (!sha) {
    logger.error('Missing "CI_COMMIT_SHA" env var');
    return undefined;
  }

  return { branch, commitSha: sha, baseBranch: pull_request_target_branch };
}
