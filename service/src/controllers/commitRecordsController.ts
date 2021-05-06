import { getProjectApiKeyHash, createCommitRecord, getCommitRecords, getCommitRecord } from '../framework/mongo';
import { verifyHash } from '../utils/hashUtils';

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

  const hash = await getProjectApiKeyHash(projectId);

  if (!hash || !(await verifyHash(headers['x-api-key'], hash))) {
    res.status(403).send('');
    return;
  }

  let baseRecord: CommitRecord | undefined;

  if (body.baseBranch) {
    try {
      baseRecord = (await getCommitRecords(projectId, { branch: body.baseBranch, latest: true }))?.[0];

      console.log({ message: 'baseRecord fetched', extra: { baseRecord } });
    } catch (err) {
      console.error({ message: 'Error while fetching base branch', err });
    }
  }

  const record = await createCommitRecord(projectId, body);

  console.log({ message: 'commit record created', extra: { record } });

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
    console.info(`Commit record "${recordId}" in project "${projectId}" not found`);
    res.status(404).send('');
    return;
  }

  const baseRecord = record.baseBranch
    ? (await getCommitRecords(projectId, { branch: record.baseBranch, latest: true }))?.[0]
    : undefined;

  const response: BaseCommitRecordResponse = { record, baseRecord };

  res.send(response);
};
