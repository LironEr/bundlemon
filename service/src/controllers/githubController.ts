import { Status } from 'bundlemon-utils';
import { getReportConclusionText } from 'bundlemon-utils/lib/cjs/textUtils';
import {
  getInstallationId,
  getGithubToken,
  createCheck,
  createCommitStatus,
  createOrUpdatePRComment,
  COMMENT_IDENTIFIER,
} from '../framework/github';
import { getProjectApiKeyHash } from '../framework/mongo';
import { verifyHash } from '../utils/hashUtils';
import { generateReportMarkdown } from './utils/markdownReportGenerator';

import type {
  FastifyValidatedRoute,
  CreateGithubCheckRequestSchema,
  CreateGithubCommitStatusRequestSchema,
  PostGithubPRCommentRequestSchema,
} from '../types/schemas';
import type { FastifyReply } from 'fastify';

export interface GetGithubAppTokenParams {
  projectId: string;
  apiKey: string;
  owner: string;
  repo: string;
}

async function getGithubAppToken({ projectId, apiKey, owner, repo }: GetGithubAppTokenParams, res: FastifyReply) {
  const hash = await getProjectApiKeyHash(projectId);

  if (!hash || !(await verifyHash(apiKey, hash))) {
    res.status(403).send('');
    return undefined;
  }

  const installationId = await getInstallationId(owner, repo);

  if (!installationId) {
    res.status(404).send({
      error: `BundleMon GitHub app is not installed on this repo (${owner}/${repo})`,
    });
    return undefined;
  }

  const token = await getGithubToken(installationId);

  return token;
}

export const createGithubCheckController: FastifyValidatedRoute<CreateGithubCheckRequestSchema> = async (req, res) => {
  try {
    const {
      params: { projectId },
      headers: { 'x-api-key': apiKey },
      body: {
        git: { owner, repo, commitSha },
        report,
      },
    } = req;

    const token = await getGithubAppToken({ projectId, apiKey, owner, repo }, res);

    if (!token) {
      return;
    }

    const summary = generateReportMarkdown(report);

    req.log.info(`summary length: ${summary.length}`);

    const checkRes = await createCheck({
      owner,
      repo,
      commitSha,
      token,
      detailsUrl: report.metadata.linkToReport || undefined,
      title: getReportConclusionText(report),
      summary,
      conclusion: report.status === Status.Pass ? 'success' : 'failure',
    });

    res.send(checkRes);
  } catch (err) {
    req.log.error(err);

    res.status(500).send({
      message: 'failed to create check',
      error: err.message,
    });
  }
};

export const createGithubCommitStatusController: FastifyValidatedRoute<CreateGithubCommitStatusRequestSchema> = async (
  req,
  res
) => {
  try {
    const {
      params: { projectId },
      headers: { 'x-api-key': apiKey },
      body: {
        git: { owner, repo, commitSha },
        report,
      },
    } = req;

    const token = await getGithubAppToken({ projectId, apiKey, owner, repo }, res);

    if (!token) {
      return;
    }

    const checkRes = await createCommitStatus({
      owner,
      repo,
      commitSha,
      token,
      state: report.status === Status.Pass ? 'success' : 'error',
      description: getReportConclusionText(report),
      targetUrl: report.metadata.linkToReport || undefined,
    });

    res.send(checkRes);
  } catch (err) {
    req.log.error(err);

    res.status(500).send({
      message: 'failed to create commit status',
      error: err.message,
    });
  }
};

export const postGithubPRCommentController: FastifyValidatedRoute<PostGithubPRCommentRequestSchema> = async (
  req,
  res
) => {
  try {
    const {
      params: { projectId },
      headers: { 'x-api-key': apiKey },
      body: {
        git: { owner, repo, prNumber },
        report,
      },
    } = req;

    const token = await getGithubAppToken({ projectId, apiKey, owner, repo }, res);

    if (!token) {
      return;
    }

    const body = `${COMMENT_IDENTIFIER}\n## BundleMon\n${generateReportMarkdown(report)}`;

    const checkRes = await createOrUpdatePRComment({
      owner,
      repo,
      prNumber,
      token,
      body,
    });

    res.send(checkRes);
  } catch (err) {
    req.log.error(err);

    res.status(500).send({
      message: 'failed to post PR comment',
      error: err.message,
    });
  }
};
