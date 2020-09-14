import axios, { AxiosError } from 'axios';
import { createLogger } from './logger';
import { serviceUrl } from './consts';

import type { CommitRecordPayload, CreateCommitRecordResponse } from 'bundlemon-utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJSON = require('../../package.json');

const client = axios.create({
  baseURL: `${serviceUrl}/api/v1`,
  timeout: 7000,
  headers: {
    'x-api-client-name': 'bundlemon-cli',
    'x-api-client-version': packageJSON.version,
  },
});

interface ProjectIdentifiers {
  projectId: string;
  apiKey: string;
}

function logError(err: Error | AxiosError, prefix: string) {
  const logger = createLogger(prefix);
  if ((err as AxiosError).isAxiosError) {
    const axiosError = err as AxiosError;

    switch (axiosError.response?.status) {
      case 400: {
        logger.error('validation failed', axiosError.response.data);
        break;
      }
      case 403: {
        logger.error('wrong project id or api key');
        break;
      }
      default: {
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
          logger.error(`Cant reach server (${serviceUrl})`);
        } else {
          logger.error(`server returned ${axiosError.response?.status}`, axiosError.response?.data);
        }
      }
    }
  } else {
    logger.error('Unknown error', err);
  }
}

export async function createCommitRecord(
  { projectId, apiKey }: ProjectIdentifiers,
  payload: CommitRecordPayload
): Promise<CreateCommitRecordResponse | undefined> {
  try {
    const res = await client.post<CreateCommitRecordResponse>(`/projects/${projectId}/commit-records`, payload, {
      headers: { 'x-api-key': apiKey },
    });

    return res.data;
  } catch (err) {
    logError(err, 'create commit record:');
  }

  return undefined;
}
