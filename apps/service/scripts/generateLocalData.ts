import { ObjectId } from 'mongodb';
import { getDB } from '../src/framework/mongo/client';
import { getProjectsCollection } from '../src/framework/mongo/projects';
import { createHash } from '../src/utils/hashUtils';
import { mongoUrl, nodeEnv } from '../src/framework/env';

async function createProject(char: string) {
  const projectId = char.repeat(24);
  const apiKey = char.repeat(64);
  const startKey = apiKey.substring(0, 3);
  const hash = await createHash(apiKey);
  const projectsCollection = await getProjectsCollection();
  const creationDate = new Date();
  creationDate.setDate(creationDate.getDate() - 7); // one week ago

  await projectsCollection.insertOne({
    _id: new ObjectId(projectId),
    apiKey: { hash, startKey },
    creationDate,
    lastAccessed: new Date(),
  });

  console.log(`project ${projectId} created with api key: "${apiKey}"`);
}

(async () => {
  try {
    if (!mongoUrl.includes('localhost') || nodeEnv !== 'development') {
      throw new Error('This script should only run on local env');
    }

    console.log('Clear DB');
    await (await getDB()).dropDatabase();

    console.log('Create projects');
    await createProject('a');
    await createProject('b');
    await createProject('c');

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
