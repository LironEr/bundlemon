import { createCommitRecord, getCommitRecords, getCommitRecord } from '../framework/mongo';
import { checkAuthHeaders } from './utils/auth';

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

  let baseRecord: CommitRecord | undefined;

  if (body.baseBranch) {
    try {
      baseRecord = (await getCommitRecords(projectId, { branch: body.baseBranch, latest: true }))?.[0];

      if (baseRecord) {
        req.log.info({ baseRecordId: baseRecord.id }, 'baseRecord fetched');
      }
    } catch (err) {
      req.log.error({ err }, 'Error while fetching base branch');
    }
  }

  const record = await createCommitRecord(projectId, body);

  req.log.info({ recordId: record.id }, 'commit record created');

  // TODO: linkToReport
  const response: CreateCommitRecordResponse = { record, baseRecord, linkToReport: '' };

  res.send(response);
};

export const getCommitRecordWithBaseController: FastifyValidatedRoute<GetCommitRecordRequestSchema> = async (
  req,
  res
) => {
  const { projectId, recordId } = req.params;

  const record = await getCommitRecord({ projectId, commitRecordId: recordId });

  if (!record) {
    req.log.info({ recordId, projectId }, 'commit record not found for project');
    res.status(404).send('');
    return;
  }

  const baseRecord = record.baseBranch
    ? (await getCommitRecords(projectId, { branch: record.baseBranch, latest: true }))?.[0]
    : undefined;

  const response: BaseCommitRecordResponse = { record, baseRecord };

  res.send(response);
};
