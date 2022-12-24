import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { createLogger } from './logger';
import { serviceUrl, version } from './consts';

import type { CommitRecordPayload, CreateCommitRecordResponse } from 'bundlemon-utils';
import type { CreateCommitRecordAuthParams, GitDetails } from '../main/types';

export const serviceClient = axios.create({
  baseURL: `${serviceUrl}/v1`,
  timeout: 7000,
  headers: {
    'x-api-client-name': 'bundlemon-cli',
    'x-api-client-version': version,
  },
});

axiosRetry(serviceClient, {
  retries: 2,
  shouldResetTimeout: true,
  retryDelay: (retryNumber = 0) => {
    const delay = Math.pow(2, retryNumber) * 2000;
    const randomSum = delay * 0.2 * Math.random(); // 0-20% of the delay
    return delay + randomSum;
  },
  retryCondition: (e) => {
    return axiosRetry.isNetworkError(e) || e.response?.status === 429;
  },
});

function logError(err: Error | AxiosError, prefix: string) {
  const logger = createLogger(prefix);
  if ((err as AxiosError).isAxiosError) {
    const axiosError = err as AxiosError;

    if (axiosError.response) {
      let responseData = axiosError.response.data;

      try {
        responseData = JSON.stringify(responseData, null, 2);
      } catch {
        // Do nothing...
      }

      switch (axiosError.response.status) {
        case 400: {
          logger.error('validation failed', responseData);
          break;
        }
        case 403: {
          // TODO: add documentation about this kind of error
          logger.error('bad project credentials', responseData);
          break;
        }
        default: {
          logger.error(`server returned ${axiosError.response.status}`, responseData);
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
  authParams: CreateCommitRecordAuthParams
): Promise<CreateCommitRecordResponse | undefined> {
  try {
    const res = await serviceClient.post<CreateCommitRecordResponse>(`/projects/${projectId}/commit-records`, payload, {
      params: authParams,
    });

    return res.data;
  } catch (err) {
    logError(err as Error, 'create commit record');
  }

  return undefined;
}

type GithubProviderAuthQuery = {
  runId: string;
  commitSha: string;
};

export async function getOrCreateProjectId(
  details: GitDetails,
  auth: GithubProviderAuthQuery
): Promise<string | undefined> {
  try {
    const res = await serviceClient.post<{ id: string }>(`/projects/id`, details, { params: auth });

    return res.data.id;
  } catch (err) {
    logError(err as Error, 'get or create project id');
  }

  return undefined;
}
