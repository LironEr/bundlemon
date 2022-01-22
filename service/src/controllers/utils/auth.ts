import { Octokit } from '@octokit/rest';
import { getProjectApiKeyHash } from '../../framework/mongo';
import { verifyHash } from '../../utils/hashUtils';
import { getInstallationId, createInstallationOctokit } from '../../framework/github';

import type { FastifyLoggerInstance } from 'fastify';
import type { AuthHeaders, ProjectAuthHeaders, GithubActionsAuthHeaders } from '../../types/schemas';

type CheckAuthHeadersResponse =
  | {
      authenticated: false;
      error: string;
    }
  | { authenticated: true; installationOctokit?: Octokit };

export async function checkAuthHeaders(
  projectId: string,
  headers: AuthHeaders,
  log: FastifyLoggerInstance
): Promise<CheckAuthHeadersResponse> {
  const hash = await getProjectApiKeyHash(projectId);

  if (!hash) {
    log.warn({ projectId }, 'project id not found');
    return { authenticated: false, error: 'forbidden' };
  }

  const { 'bundlemon-auth-type': authType } = headers;

  if (!authType || authType === 'API_KEY') {
    const { 'x-api-key': apiKey } = headers as ProjectAuthHeaders;

    const isAuthenticated = await verifyHash(apiKey, hash);

    if (isAuthenticated) {
      return { authenticated: true };
    }

    log.warn({ projectId }, 'wrong API key');
    return { authenticated: isAuthenticated, error: 'forbidden' };
  } else if (authType === 'GITHUB_ACTION') {
    const { 'github-owner': owner, 'github-repo': repo, 'github-run-id': runId } = headers as GithubActionsAuthHeaders;

    const installationId = await getInstallationId(owner, repo);

    if (!installationId) {
      log.info({ projectId }, 'missing installation id');
      return { authenticated: false, error: `BundleMon GitHub app is not installed on this repo (${owner}/${repo})` };
    }

    const octokit = createInstallationOctokit(installationId);

    try {
      const res = await octokit.actions.getWorkflowRun({ owner, repo, run_id: Number(runId) });

      // check job status
      if (res.data.status !== 'in_progress') {
        log.warn({ projectId }, 'GitHub action should be in_progress');
        return { authenticated: false, error: `GitHub action ${runId} should be "in_progress" status` };
      }

      return { authenticated: true, installationOctokit: octokit };
    } catch (err) {
      let errorMsg = 'forbidden';

      if ((err as any).status === 404) {
        errorMsg = `GitHub action ${runId} not found for ${owner}/${repo}`;
        log.warn({ projectId }, 'workflow not found');
      } else {
        log.warn({ err, projectId }, 'error during getWorkflowRun');
      }

      return { authenticated: false, error: errorMsg };
    }
  }

  return { authenticated: false, error: 'forbidden' };
}
