import bytes from 'bytes';
import chalk from 'chalk';
import { Status, DiffChange, FileDetailsDiff, getReportConclusionText } from 'bundlemon-utils';
import logger from '../../../common/logger';
import { getDiffSizeText, getDiffPercentText } from '../utils';
import type { Output } from '../types';

function print(status: Status, changeText: string, message: string) {
  const color = status === Status.Pass ? 'green' : 'red';

  logger.log(`  ${chalk[color](`[${status.toUpperCase()}]`)} ${changeText}${message}`);
}

function printDiffSection(files: FileDetailsDiff[], haveBaseRecord: boolean) {
  files.forEach((f) => {
    const changeText = haveBaseRecord ? `(${f.diff.change}) ` : '';
    const diffPercentText = f.diff.change === DiffChange.Update ? ' ' + getDiffPercentText(f.diff.percent) : '';
    const diffText = haveBaseRecord ? ` (${getDiffSizeText(f.diff.bytes)}${diffPercentText})` : '';
    const maxSizeText = f.maxSize ? ` ${f.size <= f.maxSize ? '<' : '>'} ${bytes(f.maxSize)}` : '';

    print(f.status, changeText, `${f.path}: ${bytes(f.size)}${diffText}${maxSizeText}`);
  });
}

const output: Output = {
  name: 'console',
  create: () => {
    return {
      generate: (report) => {
        const {
          files,
          groups,
          metadata: { linkToReport, baseRecord },
        } = report;

        logger.log('\n');

        logger.log('Files:');
        printDiffSection(files, !!baseRecord);
        logger.log('\n');

        if (groups.length > 0) {
          logger.log('Groups:');
          printDiffSection(groups, !!baseRecord);
          logger.log('\n');
        }

        logger.log(getReportConclusionText(report));

        if (linkToReport) {
          logger.log(`\nView report: ${linkToReport}`);
        }

        logger.log('\n');
      },
    };
  },
};

export default output;
