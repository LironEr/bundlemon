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
  const { stats, status, files, groups } = report;

  if (status === Status.Pass) {
    return stats.diff.bytes === 0
      ? 'No change in files bundle size'
      : `${getDiffSizeText(stats.diff.bytes)} ${
          Number.isFinite(stats.diff.percent) ? getDiffPercentText(stats.diff.percent) : ''
        } total files change`;
  }

  const fileFails = files.filter((f) => f.status === Status.Fail);
  const groupFails = groups.filter((g) => g.status === Status.Fail);

  if (fileFails.length > 1 || groupFails.length > 1 || (fileFails.length > 0 && groupFails.length > 0)) {
    return 'Multiple limits exceeded';
  }

  if (fileFails?.[0]) {
    return getReportConclusionTextForSingleFail(fileFails[0], 'file');
  } else if (groupFails?.[0]) {
    return getReportConclusionTextForSingleFail(groupFails[0], 'group');
  }

  // Shouldn't happen
  return 'Check failed';
}

function getReportConclusionTextForSingleFail(singleFail: FileDetailsDiff, type: 'file' | 'group'): string {
  if (!singleFail.failReasons) {
    // Shouldn't happen
    return 'Check failed';
  }

  if (singleFail.failReasons.length > 1) {
    return `Multiple limits exceeded in ${type}: ${singleFail.path}`;
  } else if (singleFail.failReasons.length === 1) {
    if (singleFail.maxSize && singleFail.failReasons[0] === FailReason.MaxSize) {
      return `Max size exceeded in ${type} "${singleFail.path}": ${bytes(singleFail.size)} > ${bytes(
        singleFail.maxSize
      )}`;
    } else if (singleFail.maxPercentIncrease && singleFail.failReasons[0] === FailReason.MaxPercentIncrease) {
      return `Max percent increase exceeded ${type} "${singleFail.path}": +${singleFail.diff.percent}% > +${singleFail.maxPercentIncrease}%`;
    } else {
      return `Some limits exceeded in ${type}: ${singleFail.path}`;
    }
  } else {
    return 'Check failed';
  }
}
