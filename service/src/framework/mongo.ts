import { MongoClient, ReadPreference, Db, ObjectId, WithId, MongoClientOptions } from 'mongodb';
import { mongoUrl, mongoDbName, nodeEnv, mongoDbUser, mongoDbPassword } from './env';
import { CommitRecordsQueryResolution } from '../consts/commitRecords';

import type { CommitRecordPayload, CommitRecord } from 'bundlemon-utils';
import type { GetCommitRecordsQuery } from '../types/schemas';
import type { ProjectApiKey } from '../types';

interface CommitRecordDB extends WithId<CommitRecordPayload> {
  projectId: string;
  creationDate: Date;
}

interface ProjectDB extends WithId<void> {
  apiKey: ProjectApiKey;
  creationDate: Date;
}

let client: MongoClient | undefined;
let db: Db | undefined;

const getClient = async () => {
  if (!client) {
    try {
      const auth: MongoClientOptions['auth'] =
        nodeEnv === 'production' ? { user: mongoDbUser, password: mongoDbPassword } : undefined;

      client = await MongoClient.connect(`${mongoUrl}/${mongoDbName}?retryWrites=true&w=majority`, {
        auth,
        useNewUrlParser: true,
        readPreference: ReadPreference.PRIMARY,
        useUnifiedTopology: true,
      });
    } catch (err) {
      throw new Error('Could not connect to mongo\n ' + err);
    }
  }

  return client;
};

export async function closeMongoClient() {
  if (client) {
    return client.close();
  }
}

const getDB = async () => {
  if (!db) {
    try {
      const client = await getClient();

      db = client.db(mongoDbName);
    } catch (err) {
      throw new Error('Could not connect to mongo\n ' + err);
    }
  }

  return db;
};

const getCollection = async <T>(collectionName: string) => (await getDB()).collection<T>(collectionName);

export const getProjectsCollection = () => getCollection<ProjectDB>('projects');
export const getCommitRecordsCollection = () => getCollection<CommitRecordDB>('commitRecords');

export const createProject = async (apiKey: ProjectApiKey): Promise<string> => {
  const projectsCollection = await getProjectsCollection();
  const id = (await projectsCollection.insertOne({ apiKey, creationDate: new Date() })).insertedId;

  return id.toHexString();
};

export const getProjectApiKeyHash = async (projectId: string): Promise<string | undefined> => {
  const projectsCollection = await getProjectsCollection();
  const data = await projectsCollection.findOne<{ apiKey: { hash: string } }>(
    { _id: new ObjectId(projectId) },
    { projection: { 'apiKey.hash': 1, _id: 0 } }
  );

  return data?.apiKey?.hash;
};

const commitRecordDBToResponse = (record: CommitRecordDB): CommitRecord => {
  const { _id, creationDate, ...restRecord } = record;

  return { id: _id.toHexString(), creationDate: creationDate.toISOString(), ...restRecord };
};

export const createCommitRecord = async (projectId: string, record: CommitRecordPayload): Promise<CommitRecord> => {
  const commitRecordsCollection = await getCommitRecordsCollection();
  const recordToSave: Omit<CommitRecordDB, '_id'> = { ...record, projectId, creationDate: new Date() };

  const result = await commitRecordsCollection.findOneAndReplace(
    { projectId, commitSha: record.commitSha },
    recordToSave,
    {
      upsert: true,
      returnOriginal: false,
    }
  );

  const newRecord = result.value;

  if (!newRecord) {
    throw new Error('Failed to findOneAndReplace record');
  }

  return commitRecordDBToResponse(newRecord);
};

export const getCommitRecord = async ({
  projectId,
  commitRecordId,
}: {
  projectId: string;
  commitRecordId: string;
}): Promise<CommitRecord | undefined> => {
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
  { branch, latest, resolution }: GetCommitRecordsQuery
): Promise<CommitRecord[]> {
  const commitRecordsCollection = await getCommitRecordsCollection();

  let records: CommitRecordDB[] = [];

  if (resolution && resolution !== CommitRecordsQueryResolution.All) {
    records = await commitRecordsCollection
      .aggregate([
        {
          $match: {
            projectId,
            branch,
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
      .find({ projectId, branch: branch }, { sort: { creationDate: -1 }, limit: latest ? 1 : MAX_RECORDS })
      .toArray();
  }

  return records.map(commitRecordDBToResponse);
}
