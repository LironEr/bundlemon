import { ObjectId } from 'mongodb';
import { CreateProjectResponse } from 'bundlemon-utils';
import { app } from '../../../../tests/app';
import { getProjectsCollection } from '../../../framework/mongo';
import { verifyHash } from '../../../utils/hashUtils';

describe('projects routes', () => {
  test('create project', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/projects',
    });

    expect(response.statusCode).toEqual(200);

    const responseJson = response.json<CreateProjectResponse>();

    expect(responseJson.projectId).toBeDefined();
    expect(responseJson.apiKey).toBeDefined();

    const projectsCollection = await getProjectsCollection();

    const projectInDb = await projectsCollection.findOne({ _id: new ObjectId(responseJson.projectId) });

    if (!projectInDb) {
      throw Error('project should be in DB');
    }

    expect(projectInDb._id.toHexString()).toEqual(responseJson.projectId);
    expect(responseJson.apiKey.startsWith(projectInDb.apiKey.startKey)).toBeTruthy();
    expect(verifyHash(responseJson.apiKey, projectInDb.apiKey.hash)).toBeTruthy();
  });
});
