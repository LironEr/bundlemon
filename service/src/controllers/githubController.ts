import {
  GithubOutputResponse,
  GithubOutputTypes,
  OutputResponse,
  Status,
  getReportConclusionText,
} from 'bundlemon-utils';
import {
  createCheck,
  createCommitStatus,
  createOrUpdatePRComment,
  genCommentIdentifier,
  createOctokitClientByToken,
  createOctokitClientByAction,
} from '../framework/github';
import { generateReportMarkdownWithLinks } from './utils/markdownReportGenerator';
import { promiseAllObject } from '../utils/promiseUtils';
import { getProject } from '../framework/mongo/projects';
import { getCommitRecordWithBase } from '../framework/mongo/commitRecords';
import { BaseRecordCompareTo } from '../consts/commitRecords';
import { generateReport } from '../utils/reportUtils';
import { isGitHubProject } from '../utils/projectUtils';

import type { Octokit } from '@octokit/rest';
import type { FastifyValidatedRoute, GithubOutputRequestSchema } from '../types/schemas';

// bundlemon > v2.0.0
export const githubOutputController: FastifyValidatedRoute<GithubOutputRequestSchema> = async (req, res) => {
  try {
    const {
      params: { projectId, commitRecordId },
      body: { git, output },
    } = req;

    const project = await getProject(projectId);

    if (!project) {
      res.log.warn({ projectId }, 'project id not found');
      res.status(404).send({ error: 'project not found' });
      return;
    }

    const { record, baseRecord } =
      (await getCommitRecordWithBase({ projectId, commitRecordId }, BaseRecordCompareTo.PreviousCommit)) ?? {};

    if (!record) {
      req.log.warn({ commitRecordId, projectId }, 'commit record not found for project');
      res.status(404).send({ error: 'commit record not found for project' });
      return;
    }

    const { owner, repo, commitSha, prNumber } = git;

    let gitClient: Octokit | undefined;

    if ('token' in git) {
      gitClient = createOctokitClientByToken(git.token);
    } else if ('runId' in git) {
      if (!isGitHubProject(project, res.log)) {
        res.status(403).send({ error: 'forbidden' });
        return;
      }

      if (project.owner !== owner || project.owner !== owner || project.owner !== owner) {
        res.log.warn('mismatch between project git details to payload git details');
        res.status(403).send({ error: 'forbidden: mismatch between project git details to payload git details' });
        return;
      }
      const result = await createOctokitClientByAction(git, res.log);

      if (!result.authenticated) {
        res.status(403).send({ error: result.error });
        return;
      }

      gitClient = result.installationOctokit;
    }

    if (!gitClient) {
      res.log.warn({ owner, repo, commitSha }, 'no git client');
      res.status(403).send({ error: 'forbidden' });
      return;
    }

    const report = generateReport({ record, baseRecord });
    const { subProject } = report.metadata;
    const tasks: Partial<Record<GithubOutputTypes, Promise<OutputResponse>>> = {};

    if (output.checkRun) {
      const summary = generateReportMarkdownWithLinks(report);

      tasks.checkRun = createCheck({
        subProject,
        owner,
        repo,
        commitSha,
        installationOctokit: gitClient,
        detailsUrl: report.metadata.linkToReport || undefined,
        title: getReportConclusionText(report),
        summary,
        conclusion: report.status === Status.Pass ? 'success' : 'failure',
        log: req.log,
      });
    }

    if (output.commitStatus) {
      tasks.commitStatus = createCommitStatus({
        subProject,
        owner,
        repo,
        commitSha,
        installationOctokit: gitClient,
        state: report.status === Status.Pass ? 'success' : 'error',
        description: getReportConclusionText(report),
        targetUrl: report.metadata.linkToReport || undefined,
        log: req.log,
      });
    }

    if (output.prComment) {
      const title = subProject ? `BundleMon (${subProject})` : 'BundleMon';
      const body = `${genCommentIdentifier(subProject)}\n## ${title}\n${generateReportMarkdownWithLinks(report)}`;

      tasks.prComment = createOrUpdatePRComment({
        subProject,
        owner,
        repo,
        prNumber,
        installationOctokit: gitClient,
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
      error: (err as Error).message,
    });
  }
};
