import type { CreateProjectResponse } from 'bundlemon-utils';
import { BUNDLEMON_SERVICE_URL } from '../consts/config';

const baseUrl = BUNDLEMON_SERVICE_URL + '/v1';

const baseFetch: typeof fetch = (input, init) =>
  fetch(baseUrl + input, {
    ...init,
    headers: {
      ...init?.headers,
      'x-api-client-name': 'bundlemon-website',
      'x-api-client-version': '1.0.0',
    },
  });

export const createProject = async (): Promise<CreateProjectResponse> => {
  const res = await baseFetch('/projects', { method: 'POST' });

  if (!res.ok) {
    throw new Error('Failed to create project');
  }

  return await res.json();
};
