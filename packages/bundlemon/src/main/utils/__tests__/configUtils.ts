import { Compression } from 'bundlemon-utils';
import { CreateCommitRecordAuthType } from '../../../common/consts';
import {
  BaseNormalizedConfig,
  NormalizedConfigRemoteOn,
  NormalizedConfigRemoteOff,
  CreateCommitRecordAuthParams,
} from '../../types';

const baseNormalizedConfig: Omit<BaseNormalizedConfig, 'remote'> = {
  baseDir: '',
  defaultCompression: Compression.Gzip,
  files: [],
  groups: [],
  reportOutput: [],
  verbose: false,
  includeCommitMessage: false,
};

export function generateNormalizedConfigRemoteOn(
  override: Partial<NormalizedConfigRemoteOn> = {}
): NormalizedConfigRemoteOn {
  const authHeaders: CreateCommitRecordAuthParams = {
    authType: CreateCommitRecordAuthType.ProjectApiKey,
    token: generateRandomString(),
  };

  return {
    ...baseNormalizedConfig,
    remote: true,
    projectId: generateRandomString(),
    gitVars: {
      branch: generateRandomString(),
      commitSha: generateRandomString(),
    },
    getCreateCommitRecordAuthParams: () => authHeaders,
    ...override,
  };
}

export function generateNormalizedConfigRemoteOff(
  override: Partial<NormalizedConfigRemoteOff> = {}
): NormalizedConfigRemoteOff {
  return {
    ...baseNormalizedConfig,
    remote: false,
    ...override,
  };
}

export function generateRandomString(length = 10) {
  return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))
    .toString(36)
    .slice(1);
}
