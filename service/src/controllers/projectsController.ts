import { randomBytes } from 'crypto';
import { createProject, getOrCreateProjectId } from '../framework/mongo/projects';
import { createHash } from '../utils/hashUtils';

import type { CreateProjectResponse } from 'bundlemon-utils';
import type { RouteHandlerMethod } from 'fastify';
import type { FastifyValidatedRoute } from '../types/schemas';
import type { GetOrCreateProjectIdRequestSchema } from '../types/schemas/projects';

export const createProjectController: RouteHandlerMethod = async (_req, res) => {
  const apiKey = randomBytes(32).toString('hex');
  const startKey = apiKey.substring(0, 3);

  const hash = await createHash(apiKey);
  const projectId = await createProject({ hash, startKey });

  const response: CreateProjectResponse = { projectId, apiKey };

  res.send(response);
};

export const getOrCreateProjectIdController: FastifyValidatedRoute<GetOrCreateProjectIdRequestSchema> = async (
  req,
  res
) => {
  const { provider, owner, repo } = req.body;

  // TODO: use checkAuth?

  const id = await getOrCreateProjectId({ provider, owner: owner.toLowerCase(), repo: repo.toLowerCase() });

  res.send({ id });
};
