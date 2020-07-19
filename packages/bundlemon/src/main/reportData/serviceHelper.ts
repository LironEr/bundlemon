import { ReportPayload, CurrentFilesDetails, CreateReportResponse } from 'bundlemon-utils';
import logger from '../../common/logger';
import { createReport } from '../../common/service';
import { EnvVar } from '../../common/consts';

import type { GitVars } from '../types';

export async function saveReport(
  gitVars: GitVars,
  currFilesDetails: CurrentFilesDetails
): Promise<CreateReportResponse | undefined> {
  const report: ReportPayload = {
    ...currFilesDetails,
    ...gitVars,
  };

  const projectId = process.env[EnvVar.projectId];
  const apiKey = process.env[EnvVar.projectApiKey];

  if (!projectId) {
    logger.error(`Missing "${EnvVar.projectId}" env var`);
    return undefined;
  }

  if (!apiKey) {
    logger.error(`Missing "${EnvVar.projectApiKey}" env var`);
    return undefined;
  }

  const response = await createReport({ projectId, apiKey }, report);

  return response;
}
