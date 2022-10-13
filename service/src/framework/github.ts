import { githubAppId, githubAppPrivateKey, githubAppClientId, githubAppClientSecret } from './env';
import { Octokit } from '@octokit/rest';
import { createAppAuth, createOAuthUserAuth } from '@octokit/auth-app';
import { setCommitRecordGithubOutputs } from './mongo/commitRecords';
import { CommitRecordGitHubOutputs, getReportConclusionText, OutputResponse, Report, Status } from 'bundlemon-utils';

import type { RequestError } from '@octokit/types';
import type { FastifyBaseLogger } from 'fastify';
import { UserSessionData } from '@/types/auth';

const WRITE_PERMISSIONS = ['admin', 'write'];

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

function getAppClientData() {
  if (!githubAppClientId) {
    throw new Error('githubAppClientId is empty');
  }

  if (!githubAppClientSecret) {
    throw new Error('githubAppClientSecret is empty');
  }

  return { clientType: 'github-app', clientId: githubAppClientId, clientSecret: githubAppClientSecret } as const;
}

export const getGithubApp = () => {
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
    const { data } = await getGithubApp().apps.getRepoInstallation({ owner, repo });

    return data.id;
  } catch (err) {
    const reqErr = err as RequestError;

    if (reqErr.status === 404) {
      return undefined;
    }

    throw err;
  }
};

export const createOctokitClientByRepo = async (owner: string, repo: string) => {
  const installationId = await getInstallationId(owner, repo);

  if (!installationId) {
    return undefined;
  }

  const octokit = createOctokitClientByInstallationId(installationId);

  return octokit;
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
  log: FastifyBaseLogger
): Promise<CreateOctokitClientByActionResponse> {
  try {
    const octokit = await createOctokitClientByRepo(owner, repo);

    if (!octokit) {
      log.info({ owner, repo }, 'missing installation id');
      return { authenticated: false, error: `BundleMon GitHub app is not installed for this repo (${owner}/${repo})` };
    }

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
  log: FastifyBaseLogger;
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
  log: FastifyBaseLogger;
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
  log: FastifyBaseLogger;
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

export const loginWithCode = async (code: string) => {
  const auth = createOAuthUserAuth({
    ...getAppClientData(),
    code,
  });

  const result = await auth();

  let expiresAt: Date | undefined = undefined;

  if ('expiresAt' in result) {
    expiresAt = new Date(result.expiresAt);
  }

  const octokit = createOctokitClientByToken(result.token);
  const { data: ghUser } = await octokit.users.getAuthenticated();

  const sessionData: UserSessionData = {
    provider: 'github',
    name: ghUser.login,
    auth: {
      token: result.token,
    },
  };

  return { sessionData, expiresAt };
};

export function createOctokitClientByToken(token: string) {
  const client = new Octokit({
    authStrategy: createOAuthUserAuth,
    auth: {
      ...getAppClientData(),
      token,
    },
  });

  return client;
}

export async function getCurrentUser(octokit: Octokit) {
  const { data } = await octokit.users.getAuthenticated();
  return data;
}

export async function isUserHasWritePermissionToRepo(octokit: Octokit, owner: string, repo: string, username: string) {
  const { data } = await octokit.repos.getCollaboratorPermissionLevel({
    owner,
    repo,
    username,
  });

  return WRITE_PERMISSIONS.includes(data.permission);
}

export async function updateGithubOutputs(
  octokit: Octokit,
  report: Report,
  commitRecordGitHubOutputs: CommitRecordGitHubOutputs,
  log: FastifyBaseLogger
) {
  if (!report.metadata.record) {
    throw new Error('undefined record');
  }

  const {
    owner,
    repo,
    outputs: { commitStatus, checkRun },
  } = commitRecordGitHubOutputs;
  const { subProject, commitSha } = report.metadata.record;

  if (commitStatus) {
    const outputResult = await createCommitStatus({
      subProject,
      owner,
      repo,
      commitSha,
      installationOctokit: octokit,
      state: report.status === Status.Pass ? 'success' : 'error',
      description: getReportConclusionText(report),
      targetUrl: report.metadata.linkToReport || undefined,
      log,
    });

    if (typeof outputResult.metadata?.id === 'number') {
      commitRecordGitHubOutputs.outputs.commitStatus = outputResult.metadata.id;

      await setCommitRecordGithubOutputs(
        report.metadata.record.projectId,
        report.metadata.record.id,
        commitRecordGitHubOutputs
      );
    }
  }

  if (checkRun) {
    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRun,
      conclusion: report.status === Status.Pass ? 'success' : 'failure',
    });
  }

  // TODO: update PR comment status to approve & add reviews to content
}
