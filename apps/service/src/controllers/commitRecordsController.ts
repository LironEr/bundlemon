import {
  addReviewToCommitRecord,
  createCommitRecord,
  getCommitRecords,
  getCommitRecordWithBase,
} from '@/framework/mongo/commitRecords';
import { checkAuth } from './utils/auth';
import { generateLinkToReport } from '@/utils/linkUtils';
import { BaseRecordCompareTo } from '@/consts/commitRecords';

import type {
  FastifyValidatedRoute,
  CreateCommitRecordRequestSchema,
  GetCommitRecordRequestSchema,
  GetCommitRecordsRequestSchema,
  ReviewCommitRecordRequestSchema,
} from '@/types/schemas';

import { CommitRecord, CommitRecordReview, CreateCommitRecordResponse } from 'bundlemon-utils';
import { generateReport } from '@/utils/reportUtils';
import {
  createOctokitClientByRepo,
  createOctokitClientByToken,
  updateGithubOutputs,
  isUserHasWritePermissionToRepo,
  getCurrentUser,
} from '@/framework/github';
import { setProjectLastRecordDate } from '@/framework/mongo/projects';

export const getCommitRecordsController: FastifyValidatedRoute<GetCommitRecordsRequestSchema> = async (req, res) => {
  const records = await getCommitRecords(req.params.projectId, req.query);

  res.send(records);
};

export const createCommitRecordController: FastifyValidatedRoute<CreateCommitRecordRequestSchema> = async (
  req,
  res
) => {
  const {
    params: { projectId },
    body,
    query,
    headers,
  } = req;
  const authResult = await checkAuth(projectId, headers, query, body.commitSha, req.log);

  if (!authResult.authenticated) {
    res.status(403).send({ message: authResult.error, extraData: authResult.extraData });
    return;
  }

  const record = await createCommitRecord(projectId, body);

  req.log.info({ recordId: record.id }, 'commit record created');

  try {
    await setProjectLastRecordDate(record.projectId, new Date(record.creationDate));
  } catch (ex) {
    // continue without throwing the error
    req.log.error({ ex }, 'failed to setLastRecordDate');
  }

  let baseRecord: CommitRecord | undefined;

  try {
    baseRecord = (
      await getCommitRecords(projectId, {
        branch: body.baseBranch ?? body.branch,
        subProject: body.subProject,
        latest: true,
        olderThan: new Date(record.creationDate),
      })
    )?.[0];

    if (baseRecord) {
      req.log.info({ baseRecordId: baseRecord.id }, 'base record found');
    }
  } catch (err) {
    req.log.error({ err }, 'Error while fetching base record');
  }

  const response: CreateCommitRecordResponse = {
    record,
    baseRecord,
    linkToReport: generateLinkToReport({ projectId, commitRecordId: record.id }),
  };

  res.send(response);
};

export const getCommitRecordWithBaseController: FastifyValidatedRoute<GetCommitRecordRequestSchema> = async (
  req,
  res
) => {
  const { projectId, commitRecordId } = req.params;
  const { compareTo = BaseRecordCompareTo.PreviousCommit } = req.query;

  const result = await getCommitRecordWithBase({ projectId, commitRecordId }, compareTo);

  if (!result) {
    req.log.info({ commitRecordId, projectId }, 'commit record not found for project');
    res.status(404).send('commit record not found for project');
    return;
  }

  res.send(result);
};

export const reviewCommitRecordController: FastifyValidatedRoute<ReviewCommitRecordRequestSchema> = async (
  req,
  res
) => {
  const {
    params: { projectId, commitRecordId },
    body: { resolution },
  } = req;

  // TODO: use baseID?
  const result = await getCommitRecordWithBase({ projectId, commitRecordId });

  if (!result) {
    req.log.info({ commitRecordId, projectId }, 'commit record not found for project');
    res.status(404).send({ message: 'commit record not found for project' });
    return;
  }

  if (!result.record.prNumber) {
    res.status(400).send({ message: 'review is only possible on commit records that are related to a PR' });
    return;
  }

  const user = req.getUser();

  const commitRecordGitHubOutputs = result.record.outputs?.github;

  if (!commitRecordGitHubOutputs) {
    res.status(409).send({ message: 'missing github information on commit record' });
    return;
  }

  if (user.provider !== 'github') {
    res.status(403).send({ message: 'unknown user provider' });
    return;
  }

  const userOctokit = createOctokitClientByToken(user.auth.token);
  const githubUser = await getCurrentUser(userOctokit);
  const hasPermission = await isUserHasWritePermissionToRepo(
    userOctokit,
    commitRecordGitHubOutputs.owner,
    commitRecordGitHubOutputs.repo,
    githubUser.login
  );

  if (!hasPermission) {
    res.status(403).send({ message: 'forbidden: no write permission to repo' });
    return;
  }

  // use GitHub App Octokit instance because the user instance changes the commit status image
  const octokit = await createOctokitClientByRepo(commitRecordGitHubOutputs.owner, commitRecordGitHubOutputs.repo);

  if (!octokit) {
    res.log.info(
      { owner: commitRecordGitHubOutputs.owner, repo: commitRecordGitHubOutputs.repo },
      'missing installation id'
    );
    res.status(400).send({
      message: `BundleMon GitHub app is not installed for this repo (${commitRecordGitHubOutputs.owner}/${commitRecordGitHubOutputs.repo})`,
    });
    return;
  }

  const review: CommitRecordReview = {
    user: {
      provider: user.provider,
      name: user.name,
    },
    createdAt: new Date().toISOString(),
    resolution,
  };

  result.record = await addReviewToCommitRecord(projectId, commitRecordId, review);
  const report = generateReport(result);

  await updateGithubOutputs(octokit, report, commitRecordGitHubOutputs, req.log);

  res.send(result);
};
