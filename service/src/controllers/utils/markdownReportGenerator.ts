import { generateReportMarkdown } from 'bundlemon-markdown-output';
import { CommitRecordsQueryResolution } from '../../consts/commitRecords';
import { generateLinkToReports, GenerateLinkToReportskParams } from '../../utils/linkUtils';

import type { Report, CommitRecord } from 'bundlemon-utils';

interface GetReportsPageLinkParams extends GenerateLinkToReportskParams {
  text: string;
}

function getReportsPageLink({ text, ...linkParams }: GetReportsPageLinkParams): string {
  return `<a href="${generateLinkToReports(linkParams)}" target="_blank" rel="noreferrer noopener">${text}</a>`;
}

// TODO: max 65535 chars
export function generateReportMarkdownWithLinks(report: Report): string {
  const {
    metadata: { record, baseRecord },
  } = report;

  let body = generateReportMarkdown(report);

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

    body += `\n\n---\n<p align="center">${links.join(' | ')}</p>`;
  }

  return body;
}
