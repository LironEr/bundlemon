import axios, { AxiosError } from 'axios';
import logger from './logger';
import { serviceUrl } from './consts';

import type { ReportPayload, CreateReportResponse } from 'bundletracker-utils';

const client = axios.create({ baseURL: `${serviceUrl}/api/v1`, timeout: 5000 });

interface ProjectIdentifiers {
  projectId: string;
  apiKey: string;
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
    if (err.isAxiosError) {
      const axiosError = err as AxiosError;

      switch (axiosError?.response?.status) {
        case 400: {
          logger.error('create report: validation failed', axiosError.response.data);
          break;
        }
        case 403: {
          logger.error('create report: wrong project id or api key');
          break;
        }
        default: {
          if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
            logger.error(`create report: Cant reach server (${serviceUrl})`);
          } else {
            logger.error(`create report: server returned ${axiosError?.response?.status}`, axiosError?.response?.data);
          }
        }
      }
    } else {
      logger.error('create report: Unknown error', err);
    }
  }

  return undefined;
}
