import { CommitRecordPayload, CreateCommitRecordResponse } from 'bundlemon-utils';
import logger from '../../common/logger';
import { createCommitRecord } from '../../common/service';
import { EnvVar } from '../../common/consts';

export async function saveCommitRecord(record: CommitRecordPayload): Promise<CreateCommitRecordResponse | undefined> {
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

  const response = await createCommitRecord({ projectId, apiKey }, record);

  return response;
}
