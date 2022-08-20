import { generateDiffReport, Report } from 'bundlemon-utils';
import type { CommitRecordWithBase } from '../framework/mongo/commitRecords';
import { generateLinkToReport } from './linkUtils';

export function generateReport({ record, baseRecord }: CommitRecordWithBase): Report {
  const diffReport = generateDiffReport(record, baseRecord);

  return {
    ...diffReport,
    metadata: {
      subProject: record.subProject,
      linkToReport: generateLinkToReport({ projectId: record.projectId, commitRecordId: record.id }),
      record,
      baseRecord,
    },
  };
}

export function truncateString(input: string, maxLength: number) {
  if (input.length > maxLength) {
    return input.substring(0, maxLength) + '...';
  }

  return input;
}
