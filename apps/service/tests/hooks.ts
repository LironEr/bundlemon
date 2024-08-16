/* eslint-disable @typescript-eslint/no-var-requires */

import { initDb } from '../scripts/initDb';
// import { getProjectsCollection } from '@/framework/mongo/projects';
// import { getCommitRecordsCollection } from '@/framework/mongo/commitRecords';

beforeAll(async () => {
  await initDb();

  // console.log('clear DB');

  // const commitRecordsCollection = await getCommitRecordsCollection();
  // await commitRecordsCollection.deleteMany({});

  // const projectsCollection = await getProjectsCollection();
  // await projectsCollection.deleteMany({});

  // When using import on top of the file mocks wont mock, so use require inside the hooks
  const { app } = require('./app');
  await app.ready();
});

afterAll(async () => {
  const { app } = require('./app');
  await app.close();
});
