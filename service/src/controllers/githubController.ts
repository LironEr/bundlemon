import {
  createOctokitClientByToken,
  createOctokitClientByAction,
  getCurrentUser,
  createOctokitClientByRepo,
  isUserHasWritePermissionToRepo,
} from '@/framework/github';
import { getProject, Project } from '@/framework/mongo/projects';
import { getCommitRecordWithBase } from '@/framework/mongo/commitRecords';
import { BaseRecordCompareTo } from '@/consts/commitRecords';
import { generateReport } from '@/utils/reportUtils';
import { isGitHubProject } from '@/utils/projectUtils';
import { createGithubOutputs } from './utils/githubOutputs';

import type { Octokit } from '@octokit/rest';
import type { FastifyValidatedRoute, GithubOutputRequestSchema } from '@/types/schemas';
import type { FastifyReply } from 'fastify';

// bundlemon > v2.0.0
export const githubOutputController: FastifyValidatedRoute<GithubOutputRequestSchema> = async (req, res) => {
  try {
    const {
      params: { projectId, commitRecordId },
      body: { git, output, auth },
    } = req;

    const project = await getProject(projectId);

    if (!project) {
      res.log.warn({ projectId }, 'project id not found');
      res.status(404).send({ message: 'project not found' });
      return;
    }

    const { record, baseRecord } =
      (await getCommitRecordWithBase({ projectId, commitRecordId }, BaseRecordCompareTo.PreviousCommit)) ?? {};

    if (!record) {
      req.log.warn({ commitRecordId, projectId }, 'commit record not found for project');
      res.status(404).send({ message: 'commit record not found for project' });
      return;
    }

    const report = generateReport({ record, baseRecord });
    const { subProject } = report.metadata;

    const installationOctokit = await _createGithubClientFromRequest({ project, git, auth, res });

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

interface CreateGithubClientFromRequestParams {
  project: Project;
  git: GithubOutputRequestSchema['body']['git'];
  auth: GithubOutputRequestSchema['body']['auth'];
  res: FastifyReply;
}

/**
 * Create GitHub client from request:
 * 1. With token, get the username and check if he has write permissions to the repo, then use GitHub app octokit client
 * 2. User provided run id, meaning the project must be git project (with GitHub provider, owner & repo)
 */
async function _createGithubClientFromRequest({
  project,
  git,
  auth,
  res,
}: CreateGithubClientFromRequestParams): Promise<Octokit | undefined> {
  let installationOctokit: Octokit | undefined;

  const { owner, repo, commitSha } = git;

  if ('token' in auth) {
    const userOctokit = createOctokitClientByToken(auth.token);

    const githubUser = await getCurrentUser(userOctokit);
    installationOctokit = await createOctokitClientByRepo(owner, repo);

    if (!installationOctokit) {
      res.log.info({ owner, repo }, 'missing installation id');
      res.status(403).send({
        message: `BundleMon GitHub app is not installed for this repo (${owner}/${repo})`,
      });
      return;
    }

    const hasPermission = await isUserHasWritePermissionToRepo(installationOctokit, owner, repo, githubUser.login);

    if (!hasPermission) {
      res.log.info({ owner, repo, githubUser }, 'no write permission');
      res.status(403).send({
        message: `User "${githubUser}" doesn't have write permission to ${owner}/${repo})`,
      });
      return;
    }
  } else if ('runId' in auth) {
    if (!isGitHubProject(project, res.log)) {
      res.status(403).send({ message: 'forbidden' });
      return;
    }

    if (project.owner !== owner.toLowerCase() || project.repo !== repo.toLowerCase()) {
      res.log.warn('mismatch between project git details to payload git details');
      res.status(403).send({ message: 'forbidden: mismatch between project git details to payload git details' });
      return;
    }

    const result = await createOctokitClientByAction({ ...git, runId: auth.runId }, res.log);

    if (!result.authenticated) {
      res.status(403).send({ message: result.error });
      return;
    }

    installationOctokit = result.installationOctokit;
  }

  if (!installationOctokit) {
    res.log.warn({ owner, repo, commitSha }, 'no git client');
    res.status(403).send({ message: 'forbidden' });
    return;
  }

  return installationOctokit;
}
