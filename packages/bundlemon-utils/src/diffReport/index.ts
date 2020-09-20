import { DiffChange, Status } from '../consts';
import type { FileDetails, FileDetailsDiff, DiffReport, DiffStats, DiffReportInput } from '../types';
import { getPercentageDiff, getStatusObject } from './utils';

interface GenerateDiffFilesResult {
  files: FileDetailsDiff[];
  stats: DiffStats;
  status: Status;
}

export function calcDiffFiles(currFiles: FileDetails[], baseFiles: FileDetails[] = []): GenerateDiffFilesResult {
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
        compression: fileDetails.compression,
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

export function generateDiffReport(currInput: DiffReportInput, baseInput?: DiffReportInput): DiffReport {
  const filesDiffReport = calcDiffFiles(currInput.files, baseInput?.files);
  const groupsDiffReport = calcDiffFiles(currInput.groups, baseInput?.groups);

  const status =
    filesDiffReport.status === Status.Fail || groupsDiffReport.status === Status.Fail ? Status.Fail : Status.Pass;

  return { files: filesDiffReport.files, groups: groupsDiffReport.files, stats: filesDiffReport.stats, status };
}
