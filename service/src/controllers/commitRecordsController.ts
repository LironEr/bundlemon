import { createCommitRecord, getCommitRecords, getCommitRecord } from '../framework/mongo';
import { checkAuthHeaders } from './utils/auth';
import { generateLinkToReport } from '../utils/linkUtils';
import { BaseRecordCompareTo } from '../consts/commitRecords';

import type {
  FastifyValidatedRoute,
  CreateCommitRecordRequestSchema,
  GetCommitRecordRequestSchema,
  GetCommitRecordsRequestSchema,
} from '../types/schemas';
import type { BaseCommitRecordResponse, CommitRecord, CreateCommitRecordResponse } from 'bundlemon-utils';

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
    headers,
  } = req;
  const authResult = await checkAuthHeaders(projectId, headers, req.log);

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

  const record = await getCommitRecord({ projectId, commitRecordId });

  if (!record) {
    req.log.info({ commitRecordId, projectId }, 'commit record not found for project');
    res.status(404).send('commit record not found for project');
    return;
  }

  const baseRecord = (
    await getCommitRecords(projectId, {
      branch: record.baseBranch ?? record.branch,
      subProject: record.subProject,
      latest: true,
      olderThan: compareTo === BaseRecordCompareTo.PreviousCommit ? new Date(record.creationDate) : undefined,
    })
  )?.[0];

  const response: BaseCommitRecordResponse = { record, baseRecord };

  res.send(response);
};
