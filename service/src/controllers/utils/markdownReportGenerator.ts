import bytes from 'bytes';
import { DiffChange, Status, FileDetailsDiff, FailReason, Report, CommitRecord } from 'bundlemon-utils';
import { getDiffPercentText, getDiffSizeText, getLimitsCellText } from 'bundlemon-utils/lib/cjs/textUtils';
import { escapeMarkdown, formatText, generateMarkdownTable } from './markdownUtils';
import { CommitRecordsQueryResolution } from '../../consts/commitRecords';

function sortBySizeDESC(a: FileDetailsDiff, b: FileDetailsDiff) {
  return b.size - a.size;
}

function sortByDiffSizeASC(a: FileDetailsDiff, b: FileDetailsDiff) {
  return a.diff.bytes - b.diff.bytes;
}

function sortByDiffSizeDESC(a: FileDetailsDiff, b: FileDetailsDiff) {
  return b.diff.bytes - a.diff.bytes;
}

interface DiffSectionConfig {
  compareFn: (a: FileDetailsDiff, b: FileDetailsDiff) => number;
  isSectionOpen: boolean;
}

const diffSectionConfig: Record<DiffChange, DiffSectionConfig> = {
  [DiffChange.Add]: {
    compareFn: sortBySizeDESC,
    isSectionOpen: true,
  },
  [DiffChange.Remove]: {
    compareFn: sortByDiffSizeASC,
    isSectionOpen: true,
  },
  [DiffChange.Update]: {
    compareFn: sortByDiffSizeDESC,
    isSectionOpen: true,
  },
  [DiffChange.NoChange]: {
    compareFn: sortBySizeDESC,
    isSectionOpen: false,
  },
};

function normalizePath(path: string): string {
  return escapeMarkdown(path.replace(/(.{1,45})/g, '$1<br/>'));
}

function getSizeCellText(file: FileDetailsDiff) {
  const prettySize = bytes(file.size);
  const sizeText = formatText(prettySize, { bold: file.failReasons?.includes(FailReason.MaxSize) });

  switch (file.diff.change) {
    case DiffChange.NoChange:
      return sizeText;
    case DiffChange.Add:
      return formatText(getDiffSizeText(file.size), { bold: file.failReasons?.includes(FailReason.MaxSize) });
    case DiffChange.Remove:
      return getDiffSizeText(file.diff.bytes);
    case DiffChange.Update:
    default:
      return sizeText.concat(
        ` (${getDiffSizeText(file.diff.bytes)} ${formatText(getDiffPercentText(file.diff.percent), {
          bold: file.failReasons?.includes(FailReason.MaxPercentIncrease),
        })})`
      );
  }
}

function getSectionTitle(change: DiffChange, isGroup = false) {
  const type = isGroup ? 'Groups' : 'Files';

  switch (change) {
    case DiffChange.Add:
      return `${type} added`;
    case DiffChange.Remove:
      return `${type} removed`;
    case DiffChange.Update:
      return `${type} updated`;
    case DiffChange.NoChange:
      return `Unchanged ${type.toLowerCase()}`;
  }
}

function generateDiffTables(files: FileDetailsDiff[], isGroup: boolean) {
  const filesByChange: Record<DiffChange, FileDetailsDiff[]> = {
    [DiffChange.Add]: [],
    [DiffChange.Remove]: [],
    [DiffChange.Update]: [],
    [DiffChange.NoChange]: [],
  };

  files.forEach((f) => {
    filesByChange[f.diff.change].push(f);
  });

  return `
  ${generateFileDetailsDiffSection({
    change: DiffChange.Add,
    filesByChange,
    isGroup,
  })}
  
  ${generateFileDetailsDiffSection({
    change: DiffChange.Remove,
    filesByChange,
    isGroup,
  })}
  
  ${generateFileDetailsDiffSection({
    change: DiffChange.Update,
    filesByChange,
    isGroup,
  })}
  
  ${generateFileDetailsDiffSection({
    change: DiffChange.NoChange,
    filesByChange,
    isGroup,
  })}
`;
}

interface GetReportsPageLinkParams {
  projectId: string;
  branch: string;
  resolution: CommitRecordsQueryResolution;
  text: string;
}

function getReportsPageLink({ projectId, branch, resolution, text }: GetReportsPageLinkParams): string {
  return `<a href="https://bundlemon.now.sh/projects/${projectId}/reports?branch=${branch}&resolution=${resolution}" target="_blank" rel="noreferrer noopener">${text}</a>`;
}

interface GenerateFileDetailsDiffSectionParams {
  change: DiffChange;
  filesByChange: Record<DiffChange, FileDetailsDiff[]>;
  isGroup: boolean;
}

function generateFileDetailsDiffSection({ filesByChange, change, isGroup }: GenerateFileDetailsDiffSectionParams) {
  const { isSectionOpen, compareFn } = diffSectionConfig[change];
  const files = filesByChange[change].sort(compareFn);

  if (files.length === 0) {
    return '';
  }

  let body = `
<details${isSectionOpen ? ' open' : ''}>
<summary>${getSectionTitle(change, isGroup)} (${files.length})</summary>\n\n`;

  body += generateMarkdownTable({
    columns: [
      { label: 'Status', center: true },
      { label: 'Path', center: false },
      { label: 'Size', center: true },
      { label: 'Limits', center: true },
    ],
    rows: files.map((file) => [
      file.status === Status.Pass ? ':white_check_mark:' : ':x:',
      normalizePath(file.path),
      getSizeCellText(file),
      getLimitsCellText(file),
    ]),
  });

  body += '</details>\n';

  return body;
}

// TODO: max 65535 chars
export function generateReportMarkdown({
  files,
  groups,
  stats,
  status,
  metadata: { linkToReport, record, baseRecord },
}: Report): string {
  let body = '';

  if (files.length > 0) {
    body += `${generateDiffTables(files, false)}\n\n`;
  }

  if (stats.diff.bytes === 0) {
    body += 'No change in files bundle size';
  } else {
    body += `Total files change ${getDiffSizeText(stats.diff.bytes)} ${
      Number.isFinite(stats.diff.percent) ? getDiffPercentText(stats.diff.percent) : ''
    }`;
  }

  body += '\n\n';

  if (groups.length > 0) {
    body += `${generateDiffTables(groups, true)}\n\n`;
  }

  body += `Final result: ${status === Status.Pass ? ':white_check_mark:' : ':x:'}`;

  if (linkToReport) {
    body += `\n\n[View report in BundleMon website ➡️](${linkToReport})`;
  }

  if (record || baseRecord) {
    const projectId = ((record || baseRecord) as CommitRecord).projectId;

    const links: string[] = [];

    if (record) {
      links.push(
        getReportsPageLink({
          projectId,
          branch: record.branch,
          resolution: CommitRecordsQueryResolution.All,
          text: 'Current branch size history',
        })
      );
    }

    if (baseRecord) {
      links.push(
        getReportsPageLink({
          projectId,
          branch: baseRecord.branch,
          resolution: CommitRecordsQueryResolution.Days,
          text: 'Target branch size history',
        })
      );
    }

    // TODO: temp
    // body += `\n\n---\n<p align="center">${links.join(' | ')}</p>`;
  }

  return body;
}
