import axios, { AxiosError } from 'axios';
import { createLogger } from './logger';
import { serviceUrl } from './consts';

import type { ReportPayload, CreateReportResponse, Report } from 'bundletracker-utils';

const client = axios.create({ baseURL: `${serviceUrl}/api/v1`, timeout: 5000 });

interface ProjectIdentifiers {
  projectId: string;
  apiKey: string;
}

function logError(err: Error | AxiosError, prefix: string) {
  const logger = createLogger(prefix);
  if ((err as AxiosError).isAxiosError) {
    const axiosError = err as AxiosError;

    switch (axiosError?.response?.status) {
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
          logger.error(`server returned ${axiosError?.response?.status}`, axiosError?.response?.data);
        }
      }
    }
  } else {
    logger.error('Unknown error', err);
  }
}

export async function createReport(
  { projectId, apiKey }: ProjectIdentifiers,
  payload: ReportPayload
): Promise<CreateReportResponse | undefined> {
  try {
    const res = await client.post<CreateReportResponse>(`/projects/${projectId}/reports`, payload, {
      headers: { 'x-api-key': apiKey },
    });

    return res.data;
  } catch (err) {
    logError(err, 'create report');
  }

  return undefined;
}

interface GetLatestBranchReportParams {
  projectId: string;
  branch: string;
}

export async function getLatestBranchReport({
  projectId,
  branch,
}: GetLatestBranchReportParams): Promise<Report | undefined> {
  try {
    const res = await client.get<Report[]>(`/projects/${projectId}/reports`, {
      params: {
        branch,
        latest: true,
      },
    });

    return res.data?.[0];
  } catch (err) {
    logError(err, 'get latest report');
  }

  return undefined;
}
