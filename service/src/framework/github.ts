import { githubAppId, githubAppPrivateKey } from './env';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

import type { RequestError } from '@octokit/types';
import type { FastifyLoggerInstance } from 'fastify';
import type { OutputResponse } from 'bundlemon-utils';

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

export const getGithubToken = async (installationId: number): Promise<string> => {
  const res = await getApp().auth({ type: 'installation', installationId });

  // @ts-ignore
  return res.token;
};

export function createInstallationOctokit(installationId: number) {
  const installationOctokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      ...getAppAuth(),
      installationId,
    },
  });

  return installationOctokit;
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
