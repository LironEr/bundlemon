import { MongoClient, ReadPreference, Db, Document } from 'mongodb';
import { mongoUrl, mongoDbName, mongoDbUser, mongoDbPassword } from '../env';

let client: MongoClient | undefined;
let db: Db | undefined;

const getClient = async () => {
  if (!client) {
    try {
      client = await MongoClient.connect(mongoUrl, {
        auth: { username: mongoDbUser, password: mongoDbPassword },
        readPreference: ReadPreference.PRIMARY,
        writeConcern: {
          w: 'majority',
        },
        retryWrites: true,
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
      });
    } catch (err) {
      throw new Error('Could not connect to mongo\n ' + err);
    }
  }

  return client;
};

export async function closeMongoClient() {
  if (client) {
    await client.close();

    db = undefined;
    client = undefined;
  }
}

export const getDB = async () => {
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

export const getCollection = async <T extends Document>(collectionName: string) =>
  (await getDB()).collection<T>(collectionName);
