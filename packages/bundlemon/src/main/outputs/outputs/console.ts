import * as bytes from 'bytes';
import * as chalk from 'chalk';
import { Status, DiffChange } from 'bundlemon-utils';
import logger from '../../../common/logger';
import { getDiffSizeText, getDiffPercentText } from '../utils';
import type { Output } from '../types';

function print(status: Status, changeText: string, message: string) {
  const color = status === Status.Pass ? 'green' : 'red';

  logger.log(`${chalk[color](`[${status.toUpperCase()}]`)} ${changeText}${message}`);
}

const output: Output = {
  name: 'console',
  create: () => {
    return {
      generate: (reportData) => {
        const {
          reportSummary: { files, stats },
          linkToReport,
          baseReport,
        } = reportData;

        logger.log('\n');

        files.forEach((f) => {
          const changeText = baseReport ? `(${f.diff.change}) ` : '';
          const diffPercentText = f.diff.change === DiffChange.Update ? ' ' + getDiffPercentText(f.diff.percent) : '';
          const diffText = baseReport ? ` (${getDiffSizeText(f.diff.bytes)}${diffPercentText})` : '';
          const maxSizeText = f.maxSize ? ` ${f.size <= f.maxSize ? '<' : '>'} ${bytes(f.maxSize)}` : '';

          print(f.status, changeText, `${f.path}: ${bytes(f.size)}${diffText}${maxSizeText}`);
        });

        logger.log('\n');

        if (stats.diff.bytes === 0) {
          logger.log('No change in bundle size');
        } else {
          logger.log(
            `Total change ${getDiffSizeText(stats.diff.bytes)} ${
              stats.diff.percent !== Infinity ? getDiffPercentText(stats.diff.percent) : ''
            }`
          );
        }

        if (linkToReport) {
          logger.log(`\nView report: ${linkToReport}`);
        }

        logger.log('\n');
      },
    };
  },
};

export default output;
