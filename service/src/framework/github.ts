import { githubAppId, githubAppPrivateKey } from './env';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

import type { OutputResponse } from 'bundlemon-utils';
import type { RequestError } from '@octokit/types';
import type { FastifyLoggerInstance } from 'fastify';

let _app: Octokit | undefined;

function getAppAuth() {
  if (!githubAppId) {
    throw new Error('githubAppId is empty');
  }

  if (!githubAppPrivateKey) {
    throw new Error('githubAppPrivateKey is empty');
  }

  return { appId: githubAppId, privateKey: githubAppPrivateKey.replace(/\\n/g, '\n') };
}

export const getApp = () => {
  if (!_app) {
    _app = new Octokit({
      authStrategy: createAppAuth,
      auth: getAppAuth(),
    });
  }

  return _app;
};

export const getInstallationId = async (owner: string, repo: string): Promise<number | undefined> => {
  try {
    const { data } = await getApp().apps.getRepoInstallation({ owner, repo });

    return data.id;
  } catch (err) {
    const reqErr = err as RequestError;

    if (reqErr.status === 404) {
      return undefined;
    }

    throw err;
  }
};

type CreateOctokitClientByActionResponse =
  | {
      authenticated: false;
      error: string;
      extraData?: Record<string, any>;
    }
  | { authenticated: true; installationOctokit: Octokit };

export async function createOctokitClientByAction(
  { owner, repo, runId }: { owner: string; repo: string; commitSha?: string; runId: string },
  log: FastifyLoggerInstance
): Promise<CreateOctokitClientByActionResponse> {
  const installationId = await getInstallationId(owner, repo);

  if (!installationId) {
    log.info({ owner, repo }, 'missing installation id');
    return { authenticated: false, error: `BundleMon GitHub app is not installed for this repo (${owner}/${repo})` };
  }

  const octokit = createOctokitClientByInstallationId(installationId);

  try {
    const res = await octokit.actions.getWorkflowRun({ owner, repo, run_id: Number(runId) });

    // check job status
    if (!['in_progress', 'queued'].includes(res.data.status ?? '')) {
      log.warn(
        { runId, status: res.data.status, createdAt: res.data.created_at, updatedAt: res.data.updated_at },
        'GitHub action should be in_progress/queued status'
      );
      return {
        authenticated: false,
        error: `GitHub action status should be "in_progress" or "queued"`,
        extraData: {
          actionId: runId,
          status: res.data.status,
          workflowId: res.data.workflow_id,
          createdAt: res.data.created_at,
          updatedAt: res.data.updated_at,
        },
      };
    }

    // TODO: validate action commit

    return {
      authenticated: true,
      installationOctokit: octokit,
    };
  } catch (err) {
    let errorMsg = 'forbidden';

    if ((err as any).status === 404) {
      errorMsg = `GitHub action ${runId} not found for ${owner}/${repo}`;
      log.warn({ owner, repo, runId }, 'workflow not found');
    } else {
      log.warn({ err, owner, repo, runId }, 'error during getWorkflowRun');
    }

    return { authenticated: false, error: errorMsg };
  }
}

export function createOctokitClientByInstallationId(installationId: number) {
  const client = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      ...getAppAuth(),
      installationId,
    },
  });

  return client;
}

export function createOctokitClientByToken(token: string) {
  const client = new Octokit({
    auth: token,
  });

  return client;
}

interface CreateCheckParams {
  subProject?: string;
  owner: string;
  repo: string;
  commitSha: string;
  installationOctokit: Octokit;
  detailsUrl?: string;
  title: string;
  summary: string;
  conclusion: 'success' | 'failure';
  log: FastifyLoggerInstance;
}

export const createCheck = async ({
  subProject,
  owner,
  repo,
  commitSha,
  installationOctokit,
  detailsUrl,
  title,
  summary,
  conclusion,
  log,
}: CreateCheckParams): Promise<OutputResponse> => {
  try {
    const {
      data: { id, html_url },
    } = await installationOctokit.checks.create({
      name: subProject ? `BundleMon (${subProject})` : 'BundleMon',
      owner,
      repo,
      conclusion,
      head_sha: commitSha,
      details_url: detailsUrl,
      status: 'completed',
      output: { title, summary },
    });

    return { result: 'success', message: 'Successfully created GitHub check run', metadata: { id, url: html_url } };
  } catch (err) {
    log.warn({ err }, 'Failed to create check');
    return { result: 'failure', message: (err as Error).message || 'Failed to create check' };
  }
};

interface CreateCommitStatusParams {
  subProject?: string;
  owner: string;
  repo: string;
  commitSha: string;
  installationOctokit: Octokit;
  state: 'success' | 'error';
  description: string;
  targetUrl?: string;
  log: FastifyLoggerInstance;
}

export const createCommitStatus = async ({
  subProject,
  owner,
  repo,
  commitSha,
  installationOctokit,
  state,
  description,
  targetUrl,
  log,
}: CreateCommitStatusParams): Promise<OutputResponse> => {
  try {
    const {
      data: { id },
    } = await installationOctokit.repos.createCommitStatus({
      owner,
      repo,
      sha: commitSha,
      context: subProject ? `BundleMon (${subProject})` : 'BundleMon',
      state,
      description,
      target_url: targetUrl,
    });

    return { result: 'success', message: 'Successfully created GitHub commit status', metadata: { id } };
  } catch (err) {
    log.warn({ err }, 'Failed to create commit status');
    return { result: 'failure', message: (err as Error).message || 'Failed to create commit status' };
  }
};

export const genCommentIdentifier = (subProject?: string) => {
  return `<!-- bundlemon${subProject ? `-${subProject}` : ''} -->`;
};

export const COMMENT_IDENTIFIER = '<!-- bundlemon -->';

interface CreateOrUpdatePRCommentParams {
  subProject?: string;
  owner: string;
  repo: string;
  prNumber?: string;
  installationOctokit: Octokit;
  body: string;
  log: FastifyLoggerInstance;
}

export const createOrUpdatePRComment = async ({
  subProject,
  owner,
  repo,
  prNumber,
  installationOctokit,
  body,
  log,
}: CreateOrUpdatePRCommentParams): Promise<OutputResponse> => {
  try {
    if (!prNumber) {
      return {
        result: 'skipped',
        message: 'Not a PR - ignore post PR comment',
      };
    }

    const comments = await installationOctokit.issues.listComments({
      owner,
      repo,
      issue_number: Number(prNumber),
    });
    const commentIdentifier = genCommentIdentifier(subProject);
    const existingComment = comments.data.find((comment: any) => comment?.body?.startsWith(commentIdentifier));

    if (existingComment?.id) {
      log.debug('Replace existing comment');

      const {
        data: { id },
      } = await installationOctokit.issues.updateComment({
        owner,
        repo,
        issue_number: prNumber,
        comment_id: existingComment.id,
        body,
      });

      return { result: 'success', message: 'Successfully created GitHub PR comment', metadata: { id } };
    }

    log.debug('Post new comment');

    const {
      data: { id },
    } = await installationOctokit.issues.createComment({
      owner,
      repo,
      issue_number: Number(prNumber),
      body,
    });

    return { result: 'success', message: 'Successfully created GitHub PR comment', metadata: { id } };
  } catch (err) {
    log.warn({ err }, 'Failed to create PR comment');
    return { result: 'failure', message: (err as Error).message || 'Failed to create PR comment' };
  }
};

interface IsApproveCommentFoundParams {
  owner: string;
  repo: string;
  prNumber?: string;
  installationOctokit: Octokit;
  log: FastifyLoggerInstance;
}

export async function isApproveCommentFound({
  owner,
  repo,
  prNumber,
  installationOctokit,
}: IsApproveCommentFoundParams): Promise<boolean> {
  if (!prNumber) {
    return false;
  }

  const comments = await installationOctokit.issues.listComments({
    owner,
    repo,
    issue_number: Number(prNumber),
  });

  return !!comments.data
    .filter((comment) => ['OWNER', 'COLLABORATOR', 'MEMBER'].includes(comment.author_association))
    .find((comment) => comment?.body?.startsWith('/bundlemon approve'));
}
