import bytes from 'bytes';
import { Status, FailReason } from './consts';

import type { Report, FileDetailsDiff } from './types';

export function getSignText(num: number): string {
  return num > 0 ? '+' : '';
}

export function getDiffSizeText(size: number): string {
  return `${getSignText(size)}${bytes(size)}`;
}

export function getDiffPercentText(percent: number): string {
  if (Number.isFinite(percent)) {
    return `${getSignText(percent)}${percent}%`;
  }

  return '-';
}

export function getLimitsCellText(file: FileDetailsDiff) {
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

export function getReportConclusionText(report: Report): string {
  const { stats, status, files } = report;

  if (status === Status.Pass) {
    return stats.diff.bytes === 0
      ? 'No change in files bundle size'
      : `Total files change ${getDiffSizeText(stats.diff.bytes)} ${
          Number.isFinite(stats.diff.percent) ? getDiffPercentText(stats.diff.percent) : ''
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
