import { randomBytes } from 'crypto';
import { createProject } from '../framework/mongo';
import { createHash } from '../utils/hashUtils';

import type { CreateProjectResponse } from 'bundlemon-utils';
import type { RouteHandlerMethod } from 'fastify';

export const createProjectController: RouteHandlerMethod = async (_req, res) => {
  const apiKey = randomBytes(32).toString('hex');
  const startKey = apiKey.substring(0, 3);

  const hash = await createHash(apiKey);
  const projectId = await createProject({ hash, startKey });

  const response: CreateProjectResponse = { projectId, apiKey };

  res.send(response);
};
