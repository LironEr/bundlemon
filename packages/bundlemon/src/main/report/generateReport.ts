import { generateDiffReport, Report, CommitRecord, DiffReportInput } from 'bundlemon-utils';
import logger from '../../common/logger';
import { createCommitRecord } from '../../common/service';

import type { NormalizedConfig } from '../types';

export async function generateReport(config: NormalizedConfig, input: DiffReportInput): Promise<Report | undefined> {
  logger.info('Start generating report');

  const subProject = config.subProject;
  let record: CommitRecord | undefined;
  let baseRecord: CommitRecord | undefined;
  let linkToReport: string | undefined;

  if (!config.remote) {
    logger.warn('remote flag is OFF, showing only local results');
  } else {
    const { gitVars } = config;

    logger.info(`Create commit record for branch "${gitVars.branch}"`);

    const result = await createCommitRecord(
      config.projectId,
      {
        subProject,
        ...gitVars,
        ...input,
      },
      config.getCreateCommitRecordAuthParams()
    );

    if (!result) {
      logger.error('Failed to create commit record');
      return undefined;
    }

    ({ record, baseRecord, linkToReport } = result);

    logger.info(`Commit record "${result.record.id}" has been successfully created`);
  }

  const diffReport = generateDiffReport(
    input,
    baseRecord ? { files: baseRecord.files, groups: baseRecord.groups } : undefined
  );

  logger.info('Finished generating report');

  return {
    ...diffReport,
    metadata: { subProject, linkToReport, record, baseRecord },
  };
}
