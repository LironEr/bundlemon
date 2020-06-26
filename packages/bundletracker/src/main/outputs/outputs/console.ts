import * as bytes from 'bytes';
import * as chalk from 'chalk';
import { Status, DiffChange } from 'bundletracker-utils';
import logger from '../../../common/logger';
import { getDiffSizeText, getDiffPercentText } from '../utils';
import type { Output } from '../types';

function print(status: Status, change: DiffChange, message: string) {
  const color = status === Status.Pass ? 'green' : 'red';

  logger.log(`${chalk[color](`[${status.toUpperCase()}]`)} (${change}) ${message}`);
}

const output: Output = {
  name: 'console',
  create: ({ config }) => {
    return {
      generate: (reportData) => {
        const {
          reportSummary: { files, stats },
          linkToReport,
          baseReport,
        } = reportData;

        logger.log('\n');

        files.forEach((f) => {
          const diffPercentText = f.diff.change === DiffChange.Update ? ' ' + getDiffPercentText(f.diff.percent) : '';
          const diffText = baseReport ? ` (${getDiffSizeText(f.diff.bytes)}${diffPercentText})` : '';
          const maxSizeText = f.maxSize ? ` ${f.size <= f.maxSize ? '<' : '>'} ${bytes(f.maxSize)}` : '';

          print(f.status, f.diff.change, `${f.path}: ${bytes(f.size)}${diffText}${maxSizeText}`);
        });

        logger.log(
          `\nTotal change ${getDiffSizeText(stats.diff.bytes)} ${
            stats.diff.percent !== Infinity ? getDiffPercentText(stats.diff.percent) : ''
          }`
        );

        if (config.shouldRetainReportUrl && linkToReport) {
          logger.log(`\nView report: ${linkToReport}`);
        }

        logger.log('\n');
      },
    };
  },
};

export default output;
