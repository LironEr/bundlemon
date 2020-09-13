import { DiffChange, Status, FailReason } from '../consts';
import type { DiffSummary, FileDetails, FileDetailsDiff, DiffStats, FileStatusObject } from '../types';

function roundDecimals(num: number, decimals: number) {
  return Number(Math.round(Number(num + 'e' + decimals)) + 'e-' + decimals);
}

function getPercentageDiff(a: number, b: number) {
  const percent = ((a - b) / b) * 100;

  const diff = Number.isFinite(percent) ? roundDecimals(percent, 2) : percent;

  return Number.isNaN(diff) ? 0 : diff;
}

interface GetStatusParams {
  currBranchFile?: FileDetails;
  change: DiffChange;
  diffPercent: number;
}

function getStatusObject({ currBranchFile, change, diffPercent }: GetStatusParams): FileStatusObject {
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

export function calcDiffSummary(
  currFiles: FileDetails[],
  baseFiles: FileDetails[] = []
): Omit<DiffSummary, 'defaultCompression'> {
  const filesMap = new Map<string, FileDetails>();
  const basefilesMap = new Map<string, FileDetails>();
  let totalStatus = Status.Pass;

  const filesNames = new Set<string>();

  const files: FileDetailsDiff[] = [];
  const stats: Omit<DiffStats, 'diff'> = {
    currBranchSize: 0,
    baseBranchSize: 0,
  };

  currFiles.forEach((f) => {
    filesMap.set(f.path, f);
    filesNames.add(f.path);
  });

  baseFiles.forEach((f) => {
    basefilesMap.set(f.path, f);
    filesNames.add(f.path);
  });

  Array.from(filesNames)
    .sort()
    .forEach((filename) => {
      const currBranchFile = filesMap.get(filename);
      const baseBranchFile = basefilesMap.get(filename);
      const fileDetails = (currBranchFile || baseBranchFile) as FileDetails;

      const diffBytes = (currBranchFile?.size ?? 0) - (baseBranchFile?.size ?? 0);
      const diffPercent = getPercentageDiff(currBranchFile?.size ?? 0, baseBranchFile?.size ?? 0);

      let change: DiffChange = DiffChange.NoChange;

      if (currBranchFile && baseBranchFile) {
        if (diffBytes) {
          change = DiffChange.Update;
        }
      } else if (currBranchFile) {
        change = DiffChange.Add;
      } else if (baseBranchFile) {
        change = DiffChange.Remove;
      }

      const statusObj = getStatusObject({ currBranchFile, change, diffPercent });

      if (statusObj.status === Status.Fail) {
        totalStatus = Status.Fail;
      }

      files.push({
        ...statusObj,
        pattern: fileDetails.pattern,
        path: fileDetails.path,
        size: currBranchFile?.size ?? 0,
        maxSize: currBranchFile?.maxSize,
        maxPercentIncrease: currBranchFile?.maxPercentIncrease,
        diff: {
          change,
          bytes: diffBytes,
          percent: diffPercent,
        },
      });

      stats.currBranchSize += currBranchFile?.size ?? 0;
      stats.baseBranchSize += baseBranchFile?.size ?? 0;
    });

  const diffBytes = stats.currBranchSize - stats.baseBranchSize;
  const diffPercent = getPercentageDiff(stats.currBranchSize, stats.baseBranchSize);

  return {
    files,
    stats: {
      ...stats,
      diff: {
        bytes: diffBytes,
        percent: diffPercent,
      },
    },
    status: totalStatus,
  };
}
