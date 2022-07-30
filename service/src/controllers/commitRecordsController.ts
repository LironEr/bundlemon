import { createCommitRecord, getCommitRecords, getCommitRecordWithBase } from '../framework/mongo/commitRecords';
import { checkAuth } from './utils/auth';
import { generateLinkToReport } from '../utils/linkUtils';
import { BaseRecordCompareTo } from '../consts/commitRecords';

import type {
  FastifyValidatedRoute,
  CreateCommitRecordRequestSchema,
  GetCommitRecordRequestSchema,
  GetCommitRecordsRequestSchema,
} from '../types/schemas';

import type { CommitRecord, CreateCommitRecordResponse } from 'bundlemon-utils';

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
    res.status(403).send({ error: authResult.error });
    return;
  }

  const record = await createCommitRecord(projectId, body);

  req.log.info({ recordId: record.id }, 'commit record created');

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
