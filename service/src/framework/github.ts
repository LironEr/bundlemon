import { githubAppId, githubAppPrivateKey } from './env';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

import type { RequestError } from '@octokit/types';

let _app: Octokit | undefined;

const getApp = () => {
  if (!_app) {
    if (!githubAppId) {
      throw new Error('githubAppId is empty');
    }

    if (!githubAppPrivateKey) {
      throw new Error('githubAppPrivateKey is empty');
    }

    _app = new Octokit({
      authStrategy: createAppAuth,
      auth: { appId: githubAppId, privateKey: githubAppPrivateKey.replace(/\\n/g, '\n') },
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

interface CreateCheckParams {
  owner: string;
  repo: string;
  commitSha: string;
  token: string;
  detailsUrl?: string;
  title: string;
  summary: string;
  conclusion: 'success' | 'failure';
}

export const createCheck = async ({
  owner,
  repo,
  commitSha,
  token,
  detailsUrl,
  title,
  summary,
  conclusion,
}: CreateCheckParams) => {
  const octokit = new Octokit({ auth: token });

  const {
    data: { id, html_url },
  } = await octokit.checks.create({
    name: 'BundleMon',
    owner,
    repo,
    conclusion,
    head_sha: commitSha,
    details_url: detailsUrl,
    status: 'completed',
    output: { title, summary },
  });

  return {
    id,
    url: html_url,
  };
};

interface CreateCommitStatusParams {
  owner: string;
  repo: string;
  commitSha: string;
  token: string;
  state: 'success' | 'error';
  description: string;
  targetUrl?: string;
}

export const createCommitStatus = async ({
  owner,
  repo,
  commitSha,
  token,
  state,
  description,
  targetUrl,
}: CreateCommitStatusParams) => {
  const octokit = new Octokit({ auth: token });

  const {
    data: { id },
  } = await octokit.repos.createCommitStatus({
    owner,
    repo,
    sha: commitSha,
    context: 'BundleMon',
    state,
    description,
    target_url: targetUrl,
  });

  return {
    id,
  };
};

export const COMMENT_IDENTIFIER = '<!-- bundlemon -->';

interface CreateOrUpdatePRCommentParams {
  owner: string;
  repo: string;
  prNumber: string;
  token: string;
  body: string;
}

export const createOrUpdatePRComment = async ({
  owner,
  repo,
  prNumber,
  token,
  body,
}: CreateOrUpdatePRCommentParams) => {
  const octokit = new Octokit({ auth: token });

  const comments = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: Number(prNumber),
  });

  const existingComment = comments.data.find((comment: any) => comment?.body?.startsWith(COMMENT_IDENTIFIER));

  if (existingComment?.id) {
    console.debug('Replace existing comment');

    const {
      data: { id },
    } = await octokit.issues.updateComment({
      owner,
      repo,
      issue_number: prNumber,
      comment_id: existingComment.id,
      body,
    });

    return { id };
  }

  console.debug('Post new comment');

  const {
    data: { id },
  } = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: Number(prNumber),
    body,
  });

  return { id };
};
