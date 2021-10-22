import { generateDiffReport } from 'bundlemon-utils';
import { BUNDLEMON_SERVICE_URL } from '../consts/config';

import type { CreateProjectResponse, Report, BaseCommitRecordResponse, CommitRecord } from 'bundlemon-utils';
import FetchError from './FetchError';

const baseUrl = BUNDLEMON_SERVICE_URL + '/v1';

type FetchParams = Parameters<typeof fetch>;

const baseFetch = async <R>(input: FetchParams[0], init: FetchParams[1], errorMsg?: string): Promise<R> => {
  const res = await fetch(baseUrl + input, {
    ...init,
    headers: {
      ...init?.headers,
      'x-api-client-name': 'bundlemon-website',
      'x-api-client-version': '1.0.0',
    },
  });

  if (!res.ok) {
    let message = '';
    try {
      const j = await res.clone().json();

      message = j.message;
    } catch (e) {
      message = await res.clone().text();
    }

    throw new FetchError(`${errorMsg ?? 'Failed to make request'}: ${message}`, res.status);
  }

  return await res.json();
};

export const createProject = async () => {
  return await baseFetch<CreateProjectResponse>('/projects', { method: 'POST' }, 'Failed to create project');
};

export const getReport = async (projectId: string, commitRecordId: string): Promise<Report> => {
  const res = await baseFetch<BaseCommitRecordResponse>(
    `/projects/${projectId}/commit-records/${commitRecordId}/base`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    },
    'Failed to fetch report'
  );

  const { record, baseRecord } = res;

  const diffReport = generateDiffReport(
    { files: record.files, groups: record.groups },
    baseRecord ? { files: baseRecord.files, groups: baseRecord.groups } : undefined
  );

  return { ...diffReport, metadata: { record, baseRecord } };
};

export const getCommitRecords = (): CommitRecord[] => {
  return [];
};
