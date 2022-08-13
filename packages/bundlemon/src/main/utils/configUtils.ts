import * as path from 'path';
import * as yup from 'yup';
import bytes from 'bytes';
import { getCIVars } from '../utils/ci';
import logger from '../../common/logger';
import { Compression, ProjectProvider } from 'bundlemon-utils';
import { validateYup } from './validationUtils';
import { CreateCommitRecordAuthType, EnvVar } from '../../common/consts';
import { getEnvVar } from './utils';
import { getOrCreateProjectId } from '../../common/service';

import type {
  Config,
  NormalizedConfig,
  NormalizedFileConfig,
  FileConfig,
  BaseNormalizedConfig,
  CreateCommitRecordAuthParams,
} from '../types';
import type { CIEnvVars } from './ci/types';

function normalizedFileConfig(file: FileConfig, defaultCompression: Compression): NormalizedFileConfig {
  const { maxSize, ...rest } = file;

  return { maxSize: maxSize ? bytes(maxSize) : undefined, compression: defaultCompression, ...rest };
}

function getConfigSchema() {
  const fileSchema: yup.SchemaOf<FileConfig> = yup
    .object()
    .required()
    .shape({
      friendlyName: yup.string().optional().min(1).max(50),
      path: yup.string().required(),
      compression: yup.mixed<Compression>().optional().oneOf(Object.values(Compression)),
      maxSize: yup
        .string()
        .optional()
        .test(
          'maxSize',
          (params) => `${params.path} not a valid max size`,
          (value: string | null | undefined) => {
            if (value === undefined || value === null) {
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
    .shape({
      subProject: yup
        .string()
        .optional()
        .min(1, "subProject cant be an empty string, set undefined or dont set it if you don't need it")
        .max(100)
        .matches(/^[A-Za-z0-9_\-. ]*$/),
      baseDir: yup.string().optional(),
      verbose: yup.boolean().optional(),
      defaultCompression: yup.mixed<Compression>().optional().oneOf(Object.values(Compression)),
      reportOutput: yup.array().of(
        // @ts-expect-error
        yup.lazy((val) => (typeof val === 'string' ? yup.string().required() : yup.array().required().min(2).max(2)))
      ),
      files: yup.array().optional().of(fileSchema),
      groups: yup.array().optional().of(fileSchema),
    });

  return configSchema;
}

export async function validateConfig(config: Config): Promise<NormalizedConfig | undefined> {
  const validatedConfig = validateYup(getConfigSchema(), config, 'bundlemon');

  if (!validatedConfig) {
    return undefined;
  }

  const {
    subProject,
    baseDir = process.cwd(),
    files = [],
    groups = [],
    defaultCompression: defaultCompressionOption,
    ...restConfig
  } = config;
  const defaultCompression: Compression = defaultCompressionOption || Compression.Gzip;

  const ciVars = getCIVars();
  const isRemote = ciVars.ci && process.env[EnvVar.remoteFlag] !== 'false';

  const baseNormalizedConfig: Omit<BaseNormalizedConfig, 'remote'> = {
    subProject,
    baseDir: path.resolve(baseDir),
    verbose: false,
    defaultCompression,
    reportOutput: [],
    files: files.map((f) => normalizedFileConfig(f, defaultCompression)),
    groups: groups.map((f) => normalizedFileConfig(f, defaultCompression)),
    ...restConfig,
  };

  if (process.env[EnvVar.subProject]) {
    logger.debug('overwrite sub project from env var');
    baseNormalizedConfig.subProject = process.env[EnvVar.subProject];
  }

  if (!isRemote) {
    return { ...baseNormalizedConfig, remote: false };
  }

  // Remote is enabled, validate remote config

  const projectId = await getProjectId(ciVars);

  if (!projectId) {
    return undefined;
  }

  const createCommitRecordAuthParams = getCreateCommitRecordAuthParams(ciVars);

  if (!createCommitRecordAuthParams) {
    return undefined;
  }

  logger.debug(`Project ID: ${projectId}`);

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
    getCreateCommitRecordAuthParams: () => createCommitRecordAuthParams,
  };
}

export function getCreateCommitRecordAuthParams(ciVars: CIEnvVars): CreateCommitRecordAuthParams | undefined {
  const apiKey = getEnvVar(EnvVar.projectApiKey);

  if (apiKey) {
    return {
      authType: CreateCommitRecordAuthType.ProjectApiKey,
      token: apiKey,
    };
  }

  if (ciVars.provider === 'github') {
    const { owner, repo, buildId } = ciVars;

    if (owner && repo && buildId) {
      return {
        authType: CreateCommitRecordAuthType.GithubActions,
        runId: buildId,
      };
    }
  }

  // TODO: add explanation about other options
  logger.error(`Missing "${EnvVar.projectApiKey}" env var`);

  return undefined;
}

async function getProjectId(ciVars: CIEnvVars) {
  let projectId = process.env[EnvVar.projectId];

  if (!projectId) {
    const { provider, owner, repo, buildId, commitSha } = ciVars;

    if (provider === ProjectProvider.GitHub && owner && repo && buildId && commitSha) {
      logger.info('fetch project id');
      projectId = await getOrCreateProjectId(
        { provider: ProjectProvider.GitHub, owner, repo },
        { runId: buildId, commitSha }
      );

      if (!projectId) {
        logger.error(`Project id returned undefined`);
      }
    } else {
      logger.error(`Missing "${EnvVar.projectId}" env var`);
    }
  }

  return projectId;
}
