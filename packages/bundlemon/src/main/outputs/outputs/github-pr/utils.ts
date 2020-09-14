import * as bytes from 'bytes';
import { DiffChange, Status, FileDetailsDiff, FailReason, Report } from 'bundlemon-utils';
import { COMMENT_IDENTIFIER } from './consts';
import { getDiffPercentText, getDiffSizeText } from '../../utils';

function escapeMarkdown(str: string): string {
  return str.replace(/~/g, '\\~');
}

function normalizePath(path: string): string {
  return escapeMarkdown(path.replace(/(.{1,45})/g, '$1<br/>'));
}

function getLimitsCellText(file: FileDetailsDiff) {
  const limits: string[] = [];

  if (file.maxSize) {
    limits.push(bytes(file.maxSize));
  }

  if (file.maxPercentIncrease) {
    limits.push(`+${file.maxPercentIncrease}%`);
  }

  if (limits.length === 0) {
    return '-';
  }

  return limits.join(' / ');
}

interface FormatTextOptions {
  bold?: boolean;
}

function formatText(text: string, { bold = false }: FormatTextOptions) {
  if (bold) {
    return `**${text}**`;
  }

  return text;
}

function getSizeCellText(file: FileDetailsDiff) {
  const diffPercentText =
    file.diff.change === DiffChange.Update
      ? ' ' +
        formatText(getDiffPercentText(file.diff.percent), {
          bold: file.failReasons?.includes(FailReason.MaxPercentIncrease),
        })
      : '';

  const prettySize = bytes(file.size);
  const sizeText = formatText(prettySize, { bold: file.failReasons?.includes(FailReason.MaxSize) });

  return `${sizeText} (${getDiffSizeText(file.diff.bytes)}${diffPercentText})`;
}

function generateChangedFilesSection(files: FileDetailsDiff[]) {
  if (files.length === 0) {
    return '';
  }

  let body = `
Changed files (${files.length}):

Status | Change | Path | Size | Limits
:------------: | :-------------: | ------------- | :-------------: | :-------------:`;

  files.forEach((f) => {
    body += `\n${
      f.status === Status.Pass ? ':white_check_mark:' : ':x:'
    } | ${f.diff.change.toUpperCase()} | ${normalizePath(f.path)} | ${getSizeCellText(f)} | ${getLimitsCellText(f)}`;
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

Status | Path | Size | Limits
:------------: | ------------- | :-------------: | :-------------:`;

  files.forEach((f) => {
    body += `\n${f.status === Status.Pass ? ':white_check_mark:' : ':x:'} | ${normalizePath(
      f.path
    )} | ${getSizeCellText(f)} | ${getLimitsCellText(f)}`;
  });

  body += `\n\n</details>`;

  return body;
}

export function buildPrCommentBody(report: Report): string {
  const {
    files,
    stats,
    status,
    metadata: { linkToReport },
  } = report;

  const changedFiles: FileDetailsDiff[] = [];
  const unChangedFiles: FileDetailsDiff[] = [];

  files.forEach((f) => {
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

  if (stats.diff.bytes === 0) {
    body += 'No change in bundle size';
  } else {
    body += `Total change ${getDiffSizeText(stats.diff.bytes)} ${
      stats.diff.percent !== Infinity ? getDiffPercentText(stats.diff.percent) : ''
    }`;
  }

  body += `\n\nFinal result: ${status === Status.Pass ? ':white_check_mark:' : ':x:'}`;

  if (linkToReport) {
    body += `\n\n[View report in BundleMon website ➡️](${linkToReport})`;
  }

  return body;
}

export function getStatusCheckDescription(report: Report): string {
  const { stats, status, files } = report;

  if (status === Status.Pass) {
    return stats.diff.bytes === 0
      ? 'No change in bundle size'
      : `Total change ${getDiffSizeText(stats.diff.bytes)} ${
          stats.diff.percent !== Infinity ? getDiffPercentText(stats.diff.percent) : ''
        }`;
  }

  const fails = files.filter((f) => f.status === Status.Fail);

  if (fails.length > 1) {
    return 'limits exceeded in multiple files';
  }

  const singleFailFile = fails[0];

  if (!singleFailFile.failReasons) {
    // Shouldn't happen
    return 'check failed';
  }

  if (singleFailFile.failReasons.length > 1) {
    return `multiple limits exceeded (${singleFailFile.path})`;
  } else if (singleFailFile.failReasons.length === 1) {
    if (singleFailFile.maxSize && singleFailFile.failReasons[0] === FailReason.MaxSize) {
      return `${bytes(singleFailFile.size)} > ${bytes(singleFailFile.maxSize)} (${singleFailFile.path})`;
    } else if (singleFailFile.maxPercentIncrease && singleFailFile.failReasons[0] === FailReason.MaxPercentIncrease) {
      return `+${singleFailFile.diff.percent}% > +${singleFailFile.maxPercentIncrease}% (${singleFailFile.path})`;
    } else {
      return `some limits exceeded (${singleFailFile.path})`;
    }
  } else {
    return 'check failed';
  }
}
