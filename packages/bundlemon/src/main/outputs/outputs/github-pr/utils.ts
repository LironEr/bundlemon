import * as bytes from 'bytes';
import { DiffChange, Status, FileDetailsDiff } from 'bundlemon-utils';
import { ReportData } from '../../../types';
import { COMMENT_IDENTIFIER } from './consts';
import { getDiffPercentText, getDiffSizeText } from '../../utils';

function generateChangedFilesSection(files: FileDetailsDiff[]) {
  if (files.length === 0) {
    return '';
  }

  let body = `
Changed files (${files.length}):

Status | Change | Path | Size | Max Size
:------------: | :-------------: | ------------- | :-------------: | :-------------:`;

  files.forEach((f) => {
    const diffPercentText = f.diff.change === DiffChange.Update ? ' ' + getDiffPercentText(f.diff.percent) : '';
    body += `\n${f.status === Status.Pass ? ':white_check_mark:' : ':x:'} | ${f.diff.change.toUpperCase()} | ${
      f.path
    } | ${bytes(f.size)} (${getDiffSizeText(f.diff.bytes)}${diffPercentText}) | ${f.maxSize ? bytes(f.maxSize) : '-'}`;
  });

  body += '\n\n';

  return body;
}

function generateUnChangedFilesSection(files: FileDetailsDiff[]) {
  if (files.length === 0) {
    return '';
  }

  let body = `
<details>
<summary>Unchanged files (${files.length})</summary>

Status | Path | Size | Max Size
:------------: | ------------- | :-------------: | :-------------:`;

  files.forEach((f) => {
    const diffPercentText = f.diff.change === DiffChange.Update ? ' ' + getDiffPercentText(f.diff.percent) : '';
    body += `\n${f.status === Status.Pass ? ':white_check_mark:' : ':x:'} | ${f.path} | ${bytes(
      f.size
    )} (${getDiffSizeText(f.diff.bytes)}${diffPercentText}) | ${f.maxSize ? bytes(f.maxSize) : '-'}`;
  });

  body += `\n\n</details>`;

  return body;
}

export function buildPrCommentBody(reportData: ReportData): string {
  const { reportSummary } = reportData;

  const changedFiles: FileDetailsDiff[] = [];
  const unChangedFiles: FileDetailsDiff[] = [];

  reportSummary.files.forEach((f) => {
    if (f.diff.change === DiffChange.NoChange) {
      unChangedFiles.push(f);
    } else {
      changedFiles.push(f);
    }
  });

  let body = `${COMMENT_IDENTIFIER}
## BundleMon

${generateChangedFilesSection(changedFiles)}

${generateUnChangedFilesSection(unChangedFiles)}`;

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
