import { GithubPrOutput, GithubPrOutputOptions } from './github-pr';
import { ReportOutput, ReportOutputName } from './types';
import logger from '../../../common/logger';
import type BaseOutput from './BaseOutput';
import type { NormalizedConfig } from '../../types';

function parseOutput(output: ReportOutput): { name: unknown; options: unknown } {
  if (Array.isArray(output)) {
    return { name: output?.[0], options: output?.[1] };
  }

  return { name: output, options: undefined };
}

export function createOutputInstance(
  config: NormalizedConfig,
  output: ReportOutput
): BaseOutput<ReportOutputName> | undefined {
  const { name, options } = parseOutput(output);

  switch (name) {
    case ReportOutputName.console: {
      logger.debug(`Console output alreay exists by default`);
      return undefined;
    }
    case ReportOutputName.githubPR: {
      const opts = options as GithubPrOutputOptions;
      return new GithubPrOutput({ config, options: opts });
    }
    default: {
      logger.error(`Unknown report output "${name}"`);
    }
  }

  return undefined;
}
