import * as bytes from 'bytes';
import logger from '../../../common/logger';
import { ReportData, ReportOutputName } from './types';
import BaseOutput from './BaseOutput';
import { getDiffSizeText, getDiffPercentText } from './utils';

export default class ConsoleOutput extends BaseOutput<ReportOutputName.console> {
  generate = async (reportData: ReportData): Promise<void> => {
    const {
      reportSummary: { files, stats },
      linkToReport,
    } = reportData;
    files.forEach((f) => {
      logger.info(
        `${f.path}: ${bytes(f.size)} (${getDiffSizeText(f.diff.bytes)} ${getDiffPercentText(f.diff.percent)})`
      );
    });

    logger.log(`Total change ${getDiffSizeText(stats.diff.bytes)} (${getDiffPercentText(stats.diff.percent)})`);

    if (this.config.shouldRetainReportUrl && linkToReport) {
      logger.log(`View report: ${linkToReport}`);
    }
  };
}
