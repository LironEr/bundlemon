import { ObjectId, WithId, ReturnDocument, Filter } from 'mongodb';
import { BaseRecordCompareTo, CommitRecordsQueryResolution, MAX_COMMIT_MSG_LENGTH } from '../../consts/commitRecords';
import { getCollection } from './client';
import { truncateString } from '../../utils/reportUtils';

import type { CommitRecordPayload, CommitRecord } from 'bundlemon-utils';
import type { GetCommitRecordsQuery } from '../../types/schemas';

interface CommitRecordDB extends CommitRecordPayload {
  projectId: string;
  creationDate: Date;
}

export const getCommitRecordsCollection = () => getCollection<CommitRecordDB>('commitRecords');

const commitRecordDBToResponse = (record: WithId<CommitRecordDB>): CommitRecord => {
  const { _id, creationDate, ...restRecord } = record;

  return { id: _id.toHexString(), creationDate: creationDate.toISOString(), ...restRecord };
};

export const createCommitRecord = async (projectId: string, record: CommitRecordPayload): Promise<CommitRecord> => {
  const commitRecordsCollection = await getCommitRecordsCollection();
  const recordToSave: Omit<CommitRecordDB, '_id'> = {
    ...record,
    projectId,
    creationDate: new Date(),
  };

  if (recordToSave.commitMsg) {
    recordToSave.commitMsg = truncateString(recordToSave.commitMsg, MAX_COMMIT_MSG_LENGTH);
  }

  const result = await commitRecordsCollection.findOneAndReplace(
    { projectId, subProject: record.subProject, commitSha: record.commitSha },
    recordToSave,
    {
      upsert: true,
      returnDocument: ReturnDocument.AFTER,
    }
  );

  const newRecord = result.value;

  if (!newRecord) {
    throw new Error('Failed to findOneAndReplace record');
  }

  return commitRecordDBToResponse(newRecord);
};

interface GetCommitRecordParams {
  projectId: string;
  commitRecordId: string;
}

export const getCommitRecord = async ({
  projectId,
  commitRecordId,
}: GetCommitRecordParams): Promise<CommitRecord | undefined> => {
  const commitRecordsCollection = await getCommitRecordsCollection();
  const record = await commitRecordsCollection.findOne<WithId<CommitRecordDB>>({
    _id: new ObjectId(commitRecordId),
    projectId,
  });

  if (!record) {
    return undefined;
  }

  return commitRecordDBToResponse(record);
};

const MAX_RECORDS = 100;

const resolutions: Record<
  Exclude<CommitRecordsQueryResolution, CommitRecordsQueryResolution.All>,
  Record<string, any>
> = {
  [CommitRecordsQueryResolution.Days]: {
    year: {
      $year: '$creationDate',
    },
    month: {
      $month: '$creationDate',
    },
    day: {
      $dayOfMonth: '$creationDate',
    },
  },
  [CommitRecordsQueryResolution.Weeks]: {
    year: {
      $year: '$creationDate',
    },
    week: {
      $week: '$creationDate',
    },
  },
  [CommitRecordsQueryResolution.Months]: {
    year: {
      $year: '$creationDate',
    },
    month: {
      $month: '$creationDate',
    },
  },
};

export async function getCommitRecords(
  projectId: string,
  { branch, latest, resolution, subProject, olderThan }: GetCommitRecordsQuery
): Promise<CommitRecord[]> {
  const commitRecordsCollection = await getCommitRecordsCollection();

  let creationDateFilter: Filter<Pick<CommitRecordDB, 'creationDate'>> | undefined = undefined;

  if (olderThan) {
    creationDateFilter = { creationDate: { $lt: olderThan } };
  }

  let records: WithId<CommitRecordDB>[] = [];

  if (resolution && resolution !== CommitRecordsQueryResolution.All) {
    records = await commitRecordsCollection
      .aggregate<WithId<CommitRecordDB>>([
        {
          $match: {
            ...creationDateFilter,
            projectId,
            branch,
            subProject,
          },
        },
        {
          $sort: {
            creationDate: -1,
          },
        },
        {
          $group: {
            _id: resolutions[resolution],
            doc: {
              $first: '$$ROOT',
            },
          },
        },
        {
          $replaceRoot: {
            newRoot: '$doc',
          },
        },
        {
          $sort: {
            creationDate: -1,
          },
        },
        {
          $limit: latest ? 1 : MAX_RECORDS,
        },
      ])
      .toArray();
  } else {
    records = await commitRecordsCollection
      .find(
        { ...creationDateFilter, projectId, branch: branch, subProject },
        { sort: { creationDate: -1 }, limit: latest ? 1 : MAX_RECORDS }
      )
      .toArray();
  }

  return records.map(commitRecordDBToResponse);
}

export async function getSubprojects(projectId: string) {
  const commitRecordsCollection = await getCommitRecordsCollection();
  const subProjects = await commitRecordsCollection.distinct('subProject', { projectId });

  return subProjects.filter((s) => !!s);
}

export interface CommitRecordWithBase {
  record: CommitRecord;
  baseRecord?: CommitRecord;
}

export async function getCommitRecordWithBase(
  { projectId, commitRecordId }: GetCommitRecordParams,
  compareTo = BaseRecordCompareTo.PreviousCommit
): Promise<CommitRecordWithBase | undefined> {
  const record = await getCommitRecord({ projectId, commitRecordId });

  if (!record) {
    return undefined;
  }

  const baseRecord = (
    await getCommitRecords(projectId, {
      branch: record.baseBranch ?? record.branch,
      subProject: record.subProject,
      latest: true,
      olderThan: compareTo === BaseRecordCompareTo.PreviousCommit ? new Date(record.creationDate) : undefined,
    })
  )?.[0];

  return { record, baseRecord };
}
