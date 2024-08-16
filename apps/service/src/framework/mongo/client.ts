import { MongoClient, ReadPreference, Db, MongoClientOptions, Document } from 'mongodb';
import { mongoUrl, mongoDbName, nodeEnv, mongoDbUser, mongoDbPassword } from '../env';

let client: MongoClient | undefined;
let db: Db | undefined;

const getClient = async () => {
  if (!client) {
    try {
      const auth: MongoClientOptions['auth'] =
        nodeEnv === 'production' ? { username: mongoDbUser, password: mongoDbPassword } : undefined;

      client = await MongoClient.connect(`${mongoUrl}/${mongoDbName}?retryWrites=true&w=majority`, {
        auth,
        readPreference: ReadPreference.PRIMARY,
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
