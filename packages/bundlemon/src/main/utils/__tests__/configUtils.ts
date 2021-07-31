import { Compression } from 'bundlemon-utils';
import { BaseNormalizedConfig, NormalizedConfigRemoteOn, NormalizedConfigRemoteOff, AuthHeaders } from '../../types';

const baseNormalizedConfig: Omit<BaseNormalizedConfig, 'remote'> = {
  baseDir: '',
  defaultCompression: Compression.Gzip,
  files: [],
  groups: [],
  reportOutput: [],
  verbose: false,
};

export function generateNormalizedConfigRemoteOn(
  override: Partial<NormalizedConfigRemoteOn> = {}
): NormalizedConfigRemoteOn {
  const authHeaders: AuthHeaders = {
    'BundleMon-Auth-Type': 'API_KEY',
    'x-api-key': generateRandomString(),
  };

  return {
    ...baseNormalizedConfig,
    remote: true,
    projectId: generateRandomString(),
    gitVars: {
      branch: generateRandomString(),
      commitSha: generateRandomString(),
    },
    getAuthHeaders: () => authHeaders,
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
