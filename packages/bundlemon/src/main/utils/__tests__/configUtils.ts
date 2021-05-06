import { Compression } from 'bundlemon-utils';
import {
  BaseNormalizedConfig,
  NormalizedConfigRemoteOn,
  NormalizedConfigRemoteOff,
  ProjectIdentifiers,
} from '../../types';

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
  const projectIdentifiers: ProjectIdentifiers = {
    projectId: generateRandomString(),
    apiKey: generateRandomString(),
  };

  return {
    ...baseNormalizedConfig,
    remote: true,
    gitVars: {
      branch: generateRandomString(),
      commitSha: generateRandomString(),
    },
    getProjectIdentifiers: () => projectIdentifiers,
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

function generateRandomString(length = 10) {
  return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))
    .toString(36)
    .slice(1);
}
