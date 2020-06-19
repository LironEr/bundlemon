import { Report, EnhancedReport, FileDetails, FileDetailsDiff, DiffChange, DiffStats, Status } from './types';

export function getEnhancedReport(report: Report, base?: Report): EnhancedReport {
  const { files: reportFiles, ...baseReport } = report;

  const enhancedReport = calcEnhancedReport(reportFiles, base?.files);

  return { ...baseReport, ...enhancedReport };
}

function roundDecimals(num: number, decimals: number) {
  return Number(Math.round(Number(num + 'e' + decimals)) + 'e-' + decimals);
}

function getPercentageDiff(a: number, b: number) {
  const percent = ((a - b) / b) * 100;

  return Number.isFinite(percent) ? roundDecimals(percent, 2) : percent;
}

interface CalcEnhancedReportResult {
  files: FileDetailsDiff[];
  stats: DiffStats;
  status: Status;
}

function calcEnhancedReport(currFiles: FileDetails[], baseFiles: FileDetails[] = []): CalcEnhancedReportResult {
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

  filesNames.forEach((filename) => {
    const currBranchFile = filesMap.get(filename);
    const baseBranchFile = basefilesMap.get(filename);
    const fileDetails = (currBranchFile || baseBranchFile) as FileDetails;

    const diffBytes = (currBranchFile?.size ?? 0) - (baseBranchFile?.size ?? 0);
    const diffPercent = getPercentageDiff(currBranchFile?.size ?? 0, baseBranchFile?.size ?? 0);

    let change: DiffChange = DiffChange.NoChange;

    if (currBranchFile && baseBranchFile) {
      if (Object.values(diffBytes).some((s) => s !== 0)) {
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
      size: fileDetails.size,
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
