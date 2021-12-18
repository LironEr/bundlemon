import { URLSearchParams } from 'url';
import { generateReportMarkdown } from 'bundlemon-markdown-output';
import { CommitRecordsQueryResolution } from '../../consts/commitRecords';
import type { Report, CommitRecord } from 'bundlemon-utils';

interface GetReportsPageLinkParams {
  projectId: string;
  subProject?: string;
  branch: string;
  resolution: CommitRecordsQueryResolution;
  text: string;
}

function getReportsPageLink({ projectId, subProject, branch, resolution, text }: GetReportsPageLinkParams): string {
  const query = new URLSearchParams({ branch, resolution });

  if (subProject) {
    query.append('subProject', subProject);
  }

  return `<a href="https://app.bundlemon.dev/projects/${projectId}/reports?${query.toString()}" target="_blank" rel="noreferrer noopener">${text}</a>`;
}

// TODO: max 65535 chars
export function generateReportMarkdownWithLinks(report: Report): string {
  const {
    metadata: { record, baseRecord },
  } = report;

  const body = generateReportMarkdown(report);

  if (record || baseRecord) {
    const { projectId, subProject } = (record || baseRecord) as CommitRecord;

    const links: string[] = [];

    if (record) {
      links.push(
        getReportsPageLink({
          projectId,
          subProject,
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
          subProject,
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
