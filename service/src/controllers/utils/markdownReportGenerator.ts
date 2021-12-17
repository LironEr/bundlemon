import { CommitRecord, generateReportMarkdown, Report } from 'bundlemon-utils';
import { CommitRecordsQueryResolution } from '../../consts/commitRecords';

interface GetReportsPageLinkParams {
  projectId: string;
  branch: string;
  resolution: CommitRecordsQueryResolution;
  text: string;
}

// TODO: get app hostname from env
function getReportsPageLink({ projectId, branch, resolution, text }: GetReportsPageLinkParams): string {
  return `<a href="https://app.bundlemon.dev/projects/${projectId}/reports?branch=${branch}&resolution=${resolution}" target="_blank" rel="noreferrer noopener">${text}</a>`;
}

// TODO: max 65535 chars
export function generateReportMarkdownWithLinks({
  files,
  groups,
  stats,
  status,
  metadata: { linkToReport, record, baseRecord },
}: Report): string {
  // eslint-disable-next-line prefer-const
  let body = generateReportMarkdown({ files, groups, stats, status, metadata: { linkToReport, record, baseRecord } });

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
