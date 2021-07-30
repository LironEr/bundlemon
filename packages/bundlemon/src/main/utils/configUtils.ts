import * as path from 'path';
import * as yup from 'yup';
import bytes from 'bytes';
import { getCIVars } from '../utils/ci';
import {
  Config,
  NormalizedConfig,
  NormalizedFileConfig,
  FileConfig,
  BaseNormalizedConfig,
  AuthHeaders,
} from '../types';
import logger from '../../common/logger';
import { Compression } from 'bundlemon-utils';
import { validateYup } from './validationUtils';
import { EnvVar } from '../../common/consts';
import { getEnvVar } from './utils';
import { CIEnvVars } from './ci/types';

function normalizedFileConfig(file: FileConfig, defaultCompression: Compression): NormalizedFileConfig {
  const { maxSize, ...rest } = file;

  return { maxSize: maxSize ? bytes(maxSize) : undefined, compression: defaultCompression, ...rest };
}

function getConfigSchema() {
  const fileSchema = yup
    .object()
    .required()
    .shape({
      path: yup.string().required(),
      compression: yup.string().optional().oneOf(Object.values(Compression)),
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
    });

  const configSchema = yup
    .object()
    .required()
    .shape<Config>({
      baseDir: yup.string().optional(),
      verbose: yup.boolean().optional(),
      defaultCompression: yup.string().optional().oneOf(Object.values(Compression)),
      reportOutput: yup
        .array()
        .of(
          yup.lazy((val) => (typeof val === 'string' ? yup.string().required() : yup.array().required().min(2).max(2)))
        ),
      files: yup.array().required().min(1).of(fileSchema),
      groups: yup.array().optional().of(fileSchema),
    });

  return configSchema;
}

export function validateConfig(config: Config): NormalizedConfig | undefined {
  const validatedConfig = validateYup(getConfigSchema(), config, 'bundlemon');

  if (!validatedConfig) {
    return undefined;
  }

  const {
    baseDir = process.cwd(),
    files,
    groups = [],
    defaultCompression: defaultCompressionOption,
    ...restConfig
  } = config;
  const defaultCompression: Compression = defaultCompressionOption || Compression.Gzip;

  const ciVars = getCIVars();
  const isRemote = ciVars.ci && process.env[EnvVar.remoteFlag] !== 'false';

  const baseNormalizedConfig: Omit<BaseNormalizedConfig, 'remote'> = {
    baseDir: path.resolve(baseDir),
    verbose: false,
    defaultCompression,
    reportOutput: [],
    files: files.map((f) => normalizedFileConfig(f, defaultCompression)),
    groups: groups.map((f) => normalizedFileConfig(f, defaultCompression)),
    ...restConfig,
  };

  if (!isRemote) {
    return { ...baseNormalizedConfig, remote: false };
  }

  // Remote is enabled, validate remote config

  const projectId = process.env[EnvVar.projectId];

  if (!projectId) {
    logger.error(`Missing "${EnvVar.projectId}" env var`);
    return undefined;
  }

  const authHeaders = getAuthHeaders(ciVars);

  if (!authHeaders) {
    return undefined;
  }

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
    ...baseNormalizedConfig,
    projectId,
    remote: true,
    gitVars: { branch, commitSha, baseBranch: targetBranch, prNumber },
    getAuthHeaders: () => authHeaders,
  };
}

export function getAuthHeaders(ciVars: CIEnvVars): AuthHeaders | undefined {
  const apiKey = getEnvVar(EnvVar.projectApiKey);

  if (apiKey) {
    return {
      'BundleMon-Auth-Type': 'API_KEY',
      'x-api-key': apiKey,
    };
  }

  if (ciVars.provider === 'github') {
    const { owner, repo, buildId } = ciVars;

    if (owner && repo && buildId) {
      return {
        'BundleMon-Auth-Type': 'GITHUB_ACTION',
        'GitHub-Owner': owner,
        'GitHub-Repo': repo,
        'GitHub-Run-ID': buildId,
      };
    }
  }

  // TODO: add explanation about other options
  logger.error(`Missing "${EnvVar.projectApiKey}" env var`);

  return undefined;
}
