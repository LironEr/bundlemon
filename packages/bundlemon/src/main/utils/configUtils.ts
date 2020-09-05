import * as path from 'path';
import * as yup from 'yup';
import * as bytes from 'bytes';
import ciVars from '../utils/ci';
import { Config, NormalizedConfig, NormalizedFileConfig, GitVars, FileConfig } from '../types';
import logger from '../../common/logger';
import { compressions } from 'bundlemon-utils';
import { validateYup } from './validationUtils';

function normalizedFileConfig(file: FileConfig): NormalizedFileConfig {
  const { maxSize, ...rest } = file;

  return { maxSize: maxSize ? bytes(maxSize) : undefined, ...rest };
}

export function normalizeConfig(config: Config): NormalizedConfig {
  const { baseDir = process.cwd(), files, ...restConfig } = config;

  return {
    baseDir: path.resolve(baseDir),
    verbose: false,
    defaultCompression: 'gzip',
    reportOutput: [],
    onlyLocalAnalyze: false,
    files: files.map(normalizedFileConfig),
    ...restConfig,
  };
}

export function validateConfig(config: Config): config is Config {
  const schema = yup
    .object()
    .required()
    .shape<Config>({
      baseDir: yup.string().optional(),
      verbose: yup.boolean().optional(),
      defaultCompression: yup.string().optional().oneOf(compressions),
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
              maxPercentIncrease: yup.number().optional().positive(),
            })
        ),
    });

  return validateYup(schema, config, 'bundlemon');
}

export function getGitVars(): GitVars | undefined {
  const { branch, commitSha, targetBranch, prNumber } = ciVars;

  if (!branch) {
    logger.error('Missing "CI_BRANCH" env var');
    return undefined;
  }

  if (!commitSha) {
    logger.error('Missing "CI_COMMIT_SHA" env var');
    return undefined;
  }

  return {
    branch,
    commitSha,
    baseBranch: targetBranch,
    prNumber,
  };
}
