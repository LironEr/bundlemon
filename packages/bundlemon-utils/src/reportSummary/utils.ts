import { ReportSummary, FileDetails, FileDetailsDiff, DiffChange, DiffStats, Status } from '../types';

function roundDecimals(num: number, decimals: number) {
  return Number(Math.round(Number(num + 'e' + decimals)) + 'e-' + decimals);
}

function getPercentageDiff(a: number, b: number) {
  const percent = ((a - b) / b) * 100;

  const diff = Number.isFinite(percent) ? roundDecimals(percent, 2) : percent;

  return Number.isNaN(diff) ? 0 : diff;
}

export function calcReportSummary(
  currFiles: FileDetails[],
  baseFiles: FileDetails[] = []
): Omit<ReportSummary, 'defaultCompression'> {
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

      let status = Status.Pass;

      if (currBranchFile?.maxSize && currBranchFile.size > currBranchFile.maxSize) {
        status = Status.Fail;
      }

      if (status === Status.Fail) {
        totalStatus = Status.Fail;
      }

      files.push({
        status,
        path: fileDetails.path,
        size: currBranchFile?.size ?? 0,
        maxSize: currBranchFile?.maxSize,
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
