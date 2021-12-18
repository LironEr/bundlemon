import { appDomain } from '../framework/env';
import { URLSearchParams } from 'url';
import { CommitRecordsQueryResolution } from '../consts/commitRecords';

interface GenerateLinkToReport {
  projectId: string;
  commitRecordId: string;
}

export function generateLinkToReport({ projectId, commitRecordId }: GenerateLinkToReport) {
  return `https://${appDomain}/projects/${projectId}/reports/${commitRecordId}`;
}

export interface GenerateLinkToReportskParams {
  projectId: string;
  subProject?: string;
  branch: string;
  resolution: CommitRecordsQueryResolution;
}

export function generateLinkToReports({ projectId, subProject, branch, resolution }: GenerateLinkToReportskParams) {
  const query = new URLSearchParams({ branch, resolution });

  if (subProject) {
    query.append('subProject', subProject);
  }

  return `https://${appDomain}/projects/${projectId}/reports?${query.toString()}`;
}
