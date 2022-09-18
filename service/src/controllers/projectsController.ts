import { randomBytes } from 'crypto';
import { ProjectProvider } from 'bundlemon-utils';
import { createProject, getOrCreateProjectId } from '../framework/mongo/projects';
import { createHash } from '../utils/hashUtils';
import { createOctokitClientByAction } from '../framework/github';

import type { CreateProjectResponse } from 'bundlemon-utils';
import type { FastifyBaseLogger, RouteHandlerMethod } from 'fastify';
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
  const { body, query } = req;

  const authResult = await checkGetOrCreateProjectIdAuth({ body, query }, req.log);

  if (!authResult.authenticated) {
    res.status(403).send({ error: authResult.error, extraData: authResult.extraData });
    return;
  }

  const { provider, owner, repo } = body;
  const id = await getOrCreateProjectId({ provider, owner: owner.toLowerCase(), repo: repo.toLowerCase() });

  res.send({ id });
};

type CheckAuthResponse =
  | {
      authenticated: false;
      error: string;
      extraData?: Record<string, any>;
    }
  | { authenticated: true };

async function checkGetOrCreateProjectIdAuth(
  { body, query }: GetOrCreateProjectIdRequestSchema,
  log: FastifyBaseLogger
): Promise<CheckAuthResponse> {
  const { provider, owner, repo } = body;

  switch (provider) {
    case ProjectProvider.GitHub: {
      return createOctokitClientByAction({ owner, repo, runId: query.runId, commitSha: query.commitSha }, log);
    }
    default: {
      log.warn({ provider }, 'unknown provider');

      return { authenticated: false, error: 'forbidden' };
    }
  }
}
