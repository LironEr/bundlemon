// This file is deprecated

import { Status, getReportConclusionText } from 'bundlemon-utils';
import {
  getInstallationId,
  createCheck,
  createCommitStatus,
  createOrUpdatePRComment,
  genCommentIdentifier,
  createOctokitClientByInstallationId,
} from '../framework/github';
import { generateReportMarkdownWithLinks } from './utils/markdownReportGenerator';
import { checkAuth } from './utils/auth';
import { createGithubOutputs } from './utils/githubOutputs';

import type {
  FastifyValidatedRoute,
  CreateGithubCheckRequestSchema,
  CreateGithubCommitStatusRequestSchema,
  PostGithubPRCommentRequestSchema,
  LegacyGithubOutputRequestSchema,
  AuthHeaders,
} from '../types/schemas';
import type { FastifyReply } from 'fastify';
import type { Octokit } from '@octokit/rest';

export interface GetGithubAppTokenParams {
  projectId: string;
  headers: AuthHeaders;
  owner: string;
  repo: string;
}

async function getInstallationOctokit({ projectId, headers, owner, repo }: GetGithubAppTokenParams, res: FastifyReply) {
  const authResult = await checkAuth(projectId, headers, {}, undefined, res.log);

  if (!authResult.authenticated) {
    res.status(403).send({ message: authResult.error });
    return;
  }

  if (authResult.installationOctokit) {
    return authResult.installationOctokit;
  }

  let installationOctokit: Octokit | undefined = authResult.installationOctokit;

  if (!installationOctokit) {
    const installationId = await getInstallationId(owner, repo);

    if (!installationId) {
      res.log.info({ projectId, owner, repo }, 'BundleMon GitHub app is not installed on this repo');
      res.status(400).send({
        error: `BundleMon GitHub app is not installed on this repo (${owner}/${repo})`,
      });
      return;
    }

    installationOctokit = createOctokitClientByInstallationId(installationId);
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

    const summary = generateReportMarkdownWithLinks(report);

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
      error: (err as Error).message,
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
      error: (err as Error).message,
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

    const body = `${genCommentIdentifier()}\n## BundleMon\n${generateReportMarkdownWithLinks(report)}`;

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
      error: (err as Error).message,
    });
  }
};

// bundlemon > v0.4
export const legacyGithubOutputController: FastifyValidatedRoute<LegacyGithubOutputRequestSchema> = async (
  req,
  res
) => {
  try {
    const {
      params: { projectId },
      headers,
      body: { git, report, output },
    } = req;
    const { owner, repo } = git;
    const { subProject } = report.metadata;

    const installationOctokit = await getInstallationOctokit({ projectId, headers, owner, repo }, res);

    if (!installationOctokit) {
      return;
    }

    const response = await createGithubOutputs({ git, output, report, subProject, installationOctokit, log: req.log });

    res.send(response);
  } catch (err) {
    req.log.error(err);

    res.status(500).send({
      message: 'failed to post GitHub output',
      error: (err as Error).message,
    });
  }
};
