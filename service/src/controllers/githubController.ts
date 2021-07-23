import { Status } from 'bundlemon-utils';
import { getReportConclusionText } from 'bundlemon-utils/lib/cjs/textUtils';
import {
  getInstallationId,
  createCheck,
  createCommitStatus,
  createOrUpdatePRComment,
  COMMENT_IDENTIFIER,
  OutputResponse,
  createInstallationOctokit,
} from '../framework/github';
import { generateReportMarkdown } from './utils/markdownReportGenerator';
import { checkAuthHeaders } from './utils/auth';
import { promiseAllObject } from '../utils/promiseUtils';

import type {
  FastifyValidatedRoute,
  CreateGithubCheckRequestSchema,
  CreateGithubCommitStatusRequestSchema,
  PostGithubPRCommentRequestSchema,
  GithubOutputRequestSchema,
  GithubOutputTypes,
  AuthHeaders,
} from '../types/schemas';
import type { FastifyReply } from 'fastify';

export interface GetGithubAppTokenParams {
  projectId: string;
  headers: AuthHeaders;
  owner: string;
  repo: string;
}

async function getInstallationOctokit({ projectId, headers, owner, repo }: GetGithubAppTokenParams, res: FastifyReply) {
  const authResult = await checkAuthHeaders(projectId, headers, res.log);

  if (!authResult.authenticated) {
    res.status(403).send({ error: authResult.error });
    return;
  }

  let installationOctokit = authResult.installationOctokit;

  if (!installationOctokit) {
    const installationId = await getInstallationId(owner, repo);

    if (!installationId) {
      res.status(400).send({
        error: `BundleMon GitHub app is not installed on this repo (${owner}/${repo})`,
      });
      return;
    }

    installationOctokit = createInstallationOctokit(installationId);
  }

  return installationOctokit;
}

// bundlemon <= v0.4.0
export const createGithubCheckController: FastifyValidatedRoute<CreateGithubCheckRequestSchema> = async (req, res) => {
  try {
    const {
      params: { projectId },
      headers,
      body: {
        git: { owner, repo, commitSha },
        report,
      },
    } = req;

    const installationOctokit = await getInstallationOctokit({ projectId, headers, owner, repo }, res);

    if (!installationOctokit) {
      return;
    }

    const summary = generateReportMarkdown(report);

    req.log.info(`summary length: ${summary.length}`);

    const checkRes = await createCheck({
      owner,
      repo,
      commitSha,
      installationOctokit,
      detailsUrl: report.metadata.linkToReport || undefined,
      title: getReportConclusionText(report),
      summary,
      conclusion: report.status === Status.Pass ? 'success' : 'failure',
      log: req.log,
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

// bundlemon <= v0.4.0
export const createGithubCommitStatusController: FastifyValidatedRoute<CreateGithubCommitStatusRequestSchema> = async (
  req,
  res
) => {
  try {
    const {
      params: { projectId },
      headers,
      body: {
        git: { owner, repo, commitSha },
        report,
      },
    } = req;

    const installationOctokit = await getInstallationOctokit({ projectId, headers, owner, repo }, res);

    if (!installationOctokit) {
      return;
    }

    const checkRes = await createCommitStatus({
      owner,
      repo,
      commitSha,
      installationOctokit,
      state: report.status === Status.Pass ? 'success' : 'error',
      description: getReportConclusionText(report),
      targetUrl: report.metadata.linkToReport || undefined,
      log: req.log,
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

// bundlemon <= v0.4.0
export const postGithubPRCommentController: FastifyValidatedRoute<PostGithubPRCommentRequestSchema> = async (
  req,
  res
) => {
  try {
    const {
      params: { projectId },
      headers,
      body: {
        git: { owner, repo, prNumber },
        report,
      },
    } = req;

    const installationOctokit = await getInstallationOctokit({ projectId, headers, owner, repo }, res);

    if (!installationOctokit) {
      return;
    }

    const body = `${COMMENT_IDENTIFIER}\n## BundleMon\n${generateReportMarkdown(report)}`;

    const checkRes = await createOrUpdatePRComment({
      owner,
      repo,
      prNumber,
      installationOctokit,
      body,
      log: req.log,
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

type GithubOutputResponse = Partial<Record<GithubOutputTypes, OutputResponse>>;

// bundlemon > v0.4
export const githubOutputController: FastifyValidatedRoute<GithubOutputRequestSchema> = async (req, res) => {
  try {
    const {
      params: { projectId },
      headers,
      body: {
        git: { owner, repo, commitSha, prNumber },
        report,
        output,
      },
    } = req;

    const installationOctokit = await getInstallationOctokit({ projectId, headers, owner, repo }, res);

    if (!installationOctokit) {
      return;
    }

    const tasks: Partial<Record<GithubOutputTypes, Promise<OutputResponse>>> = {};

    if (output.checkRun) {
      const summary = generateReportMarkdown(report);

      tasks.checkRun = createCheck({
        owner,
        repo,
        commitSha,
        installationOctokit,
        detailsUrl: report.metadata.linkToReport || undefined,
        title: getReportConclusionText(report),
        summary,
        conclusion: report.status === Status.Pass ? 'success' : 'failure',
        log: req.log,
      });
    }

    if (output.commitStatus) {
      tasks.commitStatus = createCommitStatus({
        owner,
        repo,
        commitSha,
        installationOctokit,
        state: report.status === Status.Pass ? 'success' : 'error',
        description: getReportConclusionText(report),
        targetUrl: report.metadata.linkToReport || undefined,
        log: req.log,
      });
    }

    if (output.prComment) {
      const body = `${COMMENT_IDENTIFIER}\n## BundleMon\n${generateReportMarkdown(report)}`;

      tasks.prComment = createOrUpdatePRComment({
        owner,
        repo,
        prNumber,
        installationOctokit,
        body,
        log: req.log,
      });
    }

    const response: GithubOutputResponse = await promiseAllObject(tasks);

    res.send(response);
  } catch (err) {
    req.log.error(err);

    res.status(500).send({
      message: 'failed to post GitHub output',
      error: err.message,
    });
  }
};
