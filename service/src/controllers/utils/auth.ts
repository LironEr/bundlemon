import { Octokit } from '@octokit/rest';
import { getProject, Project } from '../../framework/mongo/projects';
import { verifyHash } from '../../utils/hashUtils';
import { createOctokitClientByAction } from '../../framework/github';
import { CreateCommitRecordAuthType } from '../../consts/commitRecords';
import { isGitHubProject } from '../../utils/projectUtils';

import type { FastifyLoggerInstance } from 'fastify';
import type { AuthHeaders, CreateCommitRecordRequestQuery, GithubActionsAuthHeaders } from '../../types/schemas';

type CheckAuthResponse =
  | {
      authenticated: false;
      error: string;
      extraData?: Record<string, any>;
    }
  | { authenticated: true; installationOctokit?: Octokit };

/**
 * Verify the request is related to the project id, auth options:
 * 1. API key - project is a simple project with API key.
 * 2. GitHub actions - project is a git project, with GitHub provider.
 * 3. GitHub actions - project is a simple project with API key - this will be removed soon.
 */
export async function checkAuth(
  projectId: string,
  headers: AuthHeaders,
  query: CreateCommitRecordRequestQuery,
  commitSha: string | undefined,
  log: FastifyLoggerInstance
): Promise<CheckAuthResponse> {
  const project = await getProject(projectId);

  if (!project) {
    log.warn({ projectId }, 'project id not found');
    return { authenticated: false, error: 'forbidden' };
  }

  if ('x-api-key' in headers) {
    return handleApiKeyAuth(project, headers['x-api-key'], log);
  }

  // deprecated
  if (headers['bundlemon-auth-type'] === 'GITHUB_ACTION') {
    return handleLegacyGithubActionAuth(project, headers as GithubActionsAuthHeaders, log);
  }

  if ('authType' in query && query.authType === CreateCommitRecordAuthType.GithubActions) {
    return handleGithubActionAuth(project, { runId: query.runId, commitSha }, log);
  }

  log.warn({ projectId: project.id }, 'unknown auth');

  return { authenticated: false, error: 'forbidden' };
}

async function handleApiKeyAuth(
  project: Project,
  apiKey: string,
  log: FastifyLoggerInstance
): Promise<CheckAuthResponse> {
  if (!('apiKey' in project)) {
    log.warn({ projectId: project.id }, 'API key sent, but project dont have API key');
    return { authenticated: false, error: 'forbidden' };
  }

  const isAuthenticated = await verifyHash(apiKey, project.apiKey.hash);

  if (isAuthenticated) {
    return { authenticated: true };
  }

  log.warn({ projectId: project.id }, 'wrong API key');
  return { authenticated: isAuthenticated, error: 'forbidden' };
}

async function handleLegacyGithubActionAuth(
  project: Project,
  headers: GithubActionsAuthHeaders,
  log: FastifyLoggerInstance
): Promise<CheckAuthResponse> {
  const { 'github-owner': owner, 'github-repo': repo, 'github-run-id': runId } = headers;

  if (!owner || !repo || !runId) {
    log.warn({ projectId: project.id }, 'legacy github auth: empty params');
    return { authenticated: false, error: 'forbidden' };
  }

  if ('provider' in project) {
    log.warn({ projectId: project.id }, 'legacy github auth works only with old projects');
    return { authenticated: false, error: 'legacy github auth works only with old projects' };
  }

  return createOctokitClientByAction({ owner, repo, runId }, log);
}

async function handleGithubActionAuth(
  project: Project,
  { runId, commitSha }: { runId: string; commitSha?: string },
  log: FastifyLoggerInstance
): Promise<CheckAuthResponse> {
  if (!isGitHubProject(project, log)) {
    return { authenticated: false, error: 'forbidden' };
  }

  const { owner, repo } = project;

  const result = await createOctokitClientByAction({ owner, repo, runId, commitSha }, log);

  return result;
}
