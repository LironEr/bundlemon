import * as bytes from 'bytes';
import { ReportData } from '../../../types';
import { COMMENT_IDENTIFIER } from './consts';
import { DiffChange, Status } from 'bundlemon-utils';
import { getDiffPercentText, getDiffSizeText } from '../../utils';

export function buildPrCommentBody(reportData: ReportData): string {
  const { reportSummary } = reportData;

  let body = `${COMMENT_IDENTIFIER}
## Bundlemon
Status | Change | Path | Size | Max Size
:------------: | :-------------: | ------------- | :-------------: | :-------------:`;

  reportSummary.files.forEach((f) => {
    const diffPercentText = f.diff.change === DiffChange.Update ? ' ' + getDiffPercentText(f.diff.percent) : '';
    body += `\n${f.status === Status.Pass ? ':white_check_mark:' : ':x:'} | ${f.diff.change.toUpperCase()} | ${
      f.path
    } | ${bytes(f.size)} (${getDiffSizeText(f.diff.bytes)}${diffPercentText}) | ${f.maxSize ? bytes(f.maxSize) : '-'}`;
  });

  body += `\n\nTotal change ${getDiffSizeText(reportSummary.stats.diff.bytes)} ${
    reportSummary.stats.diff.percent !== Infinity ? getDiffPercentText(reportSummary.stats.diff.percent) : ''
  }`;

  body += `\n\nFinal result: ${reportSummary.status === Status.Pass ? ':white_check_mark:' : ':x:'}`;

  return body;
}
