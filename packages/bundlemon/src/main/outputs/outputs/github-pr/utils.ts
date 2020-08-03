import * as bytes from 'bytes';
import { DiffChange, Status } from 'bundlemon-utils';
import { ReportData } from '../../../types';
import { COMMENT_IDENTIFIER } from './consts';
import { getDiffPercentText, getDiffSizeText } from '../../utils';

export function buildPrCommentBody(reportData: ReportData): string {
  const { reportSummary } = reportData;

  let body = `${COMMENT_IDENTIFIER}
## BundleMon
Status | Change | Path | Size | Max Size
:------------: | :-------------: | ------------- | :-------------: | :-------------:`;

  reportSummary.files.forEach((f) => {
    const diffPercentText = f.diff.change === DiffChange.Update ? ' ' + getDiffPercentText(f.diff.percent) : '';
    body += `\n${f.status === Status.Pass ? ':white_check_mark:' : ':x:'} | ${f.diff.change.toUpperCase()} | ${
      f.path
    } | ${bytes(f.size)} (${getDiffSizeText(f.diff.bytes)}${diffPercentText}) | ${f.maxSize ? bytes(f.maxSize) : '-'}`;
  });

  body += '\n\n';

  if (reportSummary.stats.diff.bytes === 0) {
    body += 'No change in bundle size';
  } else {
    body += `Total change ${getDiffSizeText(reportSummary.stats.diff.bytes)} ${
      reportSummary.stats.diff.percent !== Infinity ? getDiffPercentText(reportSummary.stats.diff.percent) : ''
    }`;
  }

  body += `\n\nFinal result: ${reportSummary.status === Status.Pass ? ':white_check_mark:' : ':x:'}`;

  return body;
}

export function getStatusCheckDescription(reportData: ReportData): string {
  const { stats, status, files } = reportData.reportSummary;

  if (status === Status.Pass) {
    return stats.diff.bytes === 0
      ? 'No change in bundle size'
      : `Total change ${getDiffSizeText(stats.diff.bytes)} ${
          stats.diff.percent !== Infinity ? getDiffPercentText(stats.diff.percent) : ''
        }`;
  }

  const fails = files.filter((f) => f.status === Status.Fail);

  if (fails.length > 1) {
    return 'max file size exceeded in multiple files';
  }

  const singleFailFile = fails[0];

  if (singleFailFile?.maxSize) {
    return `${bytes(singleFailFile.size)} > ${bytes(singleFailFile.maxSize)} (${singleFailFile.path})`;
  } else {
    return 'check failed';
  }
}
