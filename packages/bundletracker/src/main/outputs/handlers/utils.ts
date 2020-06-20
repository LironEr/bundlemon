import * as bytes from 'bytes';
import GithubOutput, { GithubOutputOptions } from './GithubOutput';
import { ReportOutput, ReportOutputName } from './types';
import logger from '../../../common/logger';
import type BaseOutput from './BaseOutput';
import type { NormalizedConfig } from '../../types';

function getSignText(num: number): string {
  return num > 0 ? '+' : '';
}

export function getDiffSizeText(size: number): string {
  return `${getSignText(size)}${bytes(size)}`;
}

export function getDiffPercentText(percent: number | null): string {
  if (percent === null) {
    return '';
  }

  return `${getSignText(percent)}${percent}%`;
}

function parseOutput(output: ReportOutput): { name: unknown; options: unknown } {
  if (Array.isArray(output)) {
    return { name: output?.[0], options: output?.[1] };
  }

  return { name: output, options: undefined };
}

export function outputFactory(
  config: NormalizedConfig,
  output: ReportOutput
): BaseOutput<ReportOutputName> | undefined {
  const { name, options } = parseOutput(output);

  switch (name) {
    case ReportOutputName.console: {
      logger.debug(`Console output alreay exists by default`);
      return undefined;
    }
    case ReportOutputName.github: {
      const opts = options as GithubOutputOptions;
      return new GithubOutput({ config, options: opts });
    }
    default: {
      logger.error(`Unknown report output "${name}"`);
    }
  }

  return undefined;
}
