import { DiffChange, Status, FailReason } from '../consts';
import type { FileDetails, FileStatusObject } from '../types';

function roundDecimals(num: number, decimals: number) {
  return Number(Math.round(Number(num + 'e' + decimals)) + 'e-' + decimals);
}

export function getPercentageDiff(a: number, b: number): number {
  const percent = ((a - b) / b) * 100;

  const diff = Number.isFinite(percent) ? roundDecimals(percent, 2) : percent;

  return Number.isNaN(diff) ? 0 : diff;
}

interface GetStatusParams {
  currBranchFile?: FileDetails;
  change: DiffChange;
  diffPercent: number;
}

export function getStatusObject({ currBranchFile, change, diffPercent }: GetStatusParams): FileStatusObject {
  const failReasons: FailReason[] = [];

  if (currBranchFile?.maxSize && currBranchFile.size > currBranchFile.maxSize) {
    failReasons.push(FailReason.MaxSize);
  }

  if (
    change === DiffChange.Update &&
    currBranchFile?.maxPercentIncrease &&
    diffPercent > currBranchFile.maxPercentIncrease
  ) {
    failReasons.push(FailReason.MaxPercentIncrease);
  }

  if (failReasons.length === 0) {
    return { status: Status.Pass, failReasons: undefined };
  }

  return { status: Status.Fail, failReasons };
}
