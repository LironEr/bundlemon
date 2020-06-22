import * as bytes from 'bytes';
import * as chalk from 'chalk';
import logger from '../../../common/logger';
import { ReportData, ReportOutputName } from './types';
import BaseOutput from './BaseOutput';
import { getDiffSizeText, getDiffPercentText } from './utils';
import { DiffChange, Status } from 'bundletracker-utils';

function print(status: Status, change: DiffChange, message: string) {
  const color = status === Status.Pass ? 'green' : 'red';

  logger.log(`${chalk[color](`[${status.toUpperCase()}]`)} (${change}) ${message}`);
}

export default class ConsoleOutput extends BaseOutput<ReportOutputName.console> {
  outputName = ReportOutputName.console;

  areOptionsValid = (): boolean => true;
  isEnabled = (): boolean => true;

  generate = async (reportData: ReportData): Promise<void> => {
    const {
      reportSummary: { files, stats },
      linkToReport,
    } = reportData;

    logger.log('\n');

    files.forEach((f) => {
      const diffPercentText = f.diff.change === DiffChange.Update ? ' ' + getDiffPercentText(f.diff.percent) : '';

      print(
        f.status,
        f.diff.change,
        `${f.path}: ${bytes(f.size)} (${getDiffSizeText(f.diff.bytes)}${diffPercentText})`
      );
    });

    logger.log(
      `\nTotal change ${getDiffSizeText(stats.diff.bytes)} ${
        stats.diff.percent !== Infinity ? getDiffPercentText(stats.diff.percent) : ''
      }`
    );

    if (this.config.shouldRetainReportUrl && linkToReport) {
      logger.log(`\nView report: ${linkToReport}`);
    }

    logger.log('\n');
  };
}
