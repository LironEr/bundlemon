import { ObjectId, WithId, ReturnDocument, Filter } from 'mongodb';
import { BaseRecordCompareTo, CommitRecordsQueryResolution, MAX_QUERY_RECORDS } from '@/consts/commitRecords';
import { getCollection } from '@/framework/mongo/client';
import { commitRecordDBToResponse, commitRecordPayloadToDBModel } from './utils';

import type { CommitRecordPayload, CommitRecord, CommitRecordReview, CommitRecordGitHubOutputs } from 'bundlemon-utils';
import type { GetCommitRecordsQuery } from '@/types/schemas';
import type { CommitRecordDB, CommitRecordReviewDB } from './types';

export const getCommitRecordsCollection = () => getCollection<CommitRecordDB>('commitRecords');

export const createCommitRecord = async (projectId: string, payload: CommitRecordPayload): Promise<CommitRecord> => {
  const commitRecordsCollection = await getCommitRecordsCollection();
  const recordToSave = commitRecordPayloadToDBModel(projectId, payload);

  const newRecord = await commitRecordsCollection.findOneAndReplace(
    { projectId, subProject: payload.subProject, commitSha: payload.commitSha },
    recordToSave,
    {
      upsert: true,
      returnDocument: ReturnDocument.AFTER,
    }
  );

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
          $limit: latest ? 1 : MAX_QUERY_RECORDS,
        },
      ])
      .toArray();
  } else {
    records = await commitRecordsCollection
      .find(
        { ...creationDateFilter, projectId, branch: branch, subProject },
        { sort: { creationDate: -1 }, limit: latest ? 1 : MAX_QUERY_RECORDS }
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
  query: GetCommitRecordParams | { projectId: string; record: CommitRecord },
  compareTo = BaseRecordCompareTo.PreviousCommit
): Promise<CommitRecordWithBase | undefined> {
  const { projectId } = query;

  let record: CommitRecord | undefined = undefined;

  if ('record' in query) {
    record = query.record;
  } else {
    record = await getCommitRecord({ projectId, commitRecordId: query.commitRecordId });

    if (!record) {
      return undefined;
    }
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

interface GetCommitRecordsWithBaseByCommitShaQuery {
  commitSha: string;
  prNumber: number;
}

export async function getCommitRecordsWithBaseByCommitSha(
  projectId: string,
  { prNumber, commitSha }: GetCommitRecordsWithBaseByCommitShaQuery
): Promise<CommitRecordWithBase[]> {
  const commitRecordsCollection = await getCommitRecordsCollection();
  const records = (
    await commitRecordsCollection.find({ projectId, prNumber: String(prNumber), commitSha }).toArray()
  ).map(commitRecordDBToResponse);

  const recordsWithBase = (await Promise.all(
    records.map(async (record) => getCommitRecordWithBase({ projectId, record }))
  )) as CommitRecordWithBase[];

  return recordsWithBase;
}

export async function addReviewToCommitRecord(
  projectId: string,
  commitRecordId: string,
  review: CommitRecordReview
): Promise<CommitRecord> {
  const commitRecordsCollection = await getCommitRecordsCollection();

  const result = await commitRecordsCollection.findOneAndUpdate(
    { projectId, _id: new ObjectId(commitRecordId) },
    { $push: { reviews: transformReviewToDB(review) } },
    { returnDocument: ReturnDocument.AFTER }
  );

  if (!result) {
    throw new Error('Failed to update reviews list');
  }

  return commitRecordDBToResponse(result);
}

function transformReviewToDB(review: CommitRecordReview | undefined): CommitRecordReviewDB | undefined {
  if (!review) {
    return undefined;
  }

  const { createdAt, ...rest } = review;

  return {
    ...rest,
    createdAt: new Date(createdAt),
  };
}

export async function setCommitRecordGithubOutputs(
  projectId: string,
  commitRecordId: string,
  outputs: CommitRecordGitHubOutputs
): Promise<void> {
  const commitRecordsCollection = await getCommitRecordsCollection();

  await commitRecordsCollection.findOneAndUpdate(
    { projectId, _id: new ObjectId(commitRecordId) },
    { $set: { 'outputs.github': outputs } }
  );
}
