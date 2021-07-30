import axios, { AxiosError } from 'axios';
import { createLogger } from './logger';
import { serviceUrl, version } from './consts';

import type { CommitRecordPayload, CreateCommitRecordResponse } from 'bundlemon-utils';
import type { AuthHeaders } from '../main/types';

export const serviceClient = axios.create({
  baseURL: `${serviceUrl}/v1`,
  timeout: 7000,
  headers: {
    'x-api-client-name': 'bundlemon-cli',
    'x-api-client-version': version,
  },
});

function logError(err: Error | AxiosError, prefix: string) {
  const logger = createLogger(prefix);
  if ((err as AxiosError).isAxiosError) {
    const axiosError = err as AxiosError;

    if (axiosError.response) {
      switch (axiosError.response.status) {
        case 400: {
          logger.error('validation failed', JSON.stringify(axiosError.response.data, null, 2));
          break;
        }
        case 403: {
          // TODO: add documentation about this kind of error
          logger.error('bad project credentials', JSON.stringify(axiosError.response.data));
          break;
        }
        default: {
          logger.error(`server returned ${axiosError.response.status}`, axiosError.response.data);
        }
      }
    } else if (axiosError.request) {
      // client never received a response, or request never left
      logger.error(`Cant reach server (${serviceUrl}) code "${axiosError.code}"`);
    } else {
      logger.error('Unknown error', err);
    }
  } else {
    logger.error('Unknown error', err);
  }
}

export async function createCommitRecord(
  projectId: string,
  payload: CommitRecordPayload,
  authHeaders: AuthHeaders
): Promise<CreateCommitRecordResponse | undefined> {
  try {
    const res = await serviceClient.post<CreateCommitRecordResponse>(`/projects/${projectId}/commit-records`, payload, {
      headers: authHeaders,
    });

    return res.data;
  } catch (err) {
    logError(err, 'create commit record');
  }

  return undefined;
}
