import { ObjectId } from 'mongodb';
import { CreateProjectResponse, ProjectProvider } from 'bundlemon-utils';
import { app } from '@tests/app';
import { getProjectsCollection } from '../../../framework/mongo/projects';
import { verifyHash } from '../../../utils/hashUtils';
import { generateRandomString } from '@tests/utils';
import { createTestGitProject } from '@tests/projectUtils';

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

    if (!('apiKey' in projectInDb)) {
      throw Error('project should have apiKey');
    }

    expect(projectInDb._id.toHexString()).toEqual(responseJson.projectId);
    expect(responseJson.apiKey.startsWith(projectInDb.apiKey.startKey)).toBeTruthy();
    expect(verifyHash(responseJson.apiKey, projectInDb.apiKey.hash)).toBeTruthy();
  });

  describe('get or create project', () => {
    test('project doesnt exist', async () => {
      const provider = ProjectProvider.GitHub;
      const owner = generateRandomString() + 'A.a';
      const repo = generateRandomString() + 'B_-';
      const response = await app.inject({
        method: 'POST',
        url: '/v1/projects/id',
        payload: {
          provider,
          owner,
          repo,
        },
      });

      expect(response.statusCode).toEqual(200);

      const responseJson = response.json<{ id: string }>();

      expect(responseJson.id).toBeDefined();

      const projectsCollection = await getProjectsCollection();
      const projectInDb = await projectsCollection.findOne({ _id: new ObjectId(responseJson.id) });

      if (!projectInDb) {
        throw Error('project should be in DB');
      }

      if (!('provider' in projectInDb)) {
        // TODO: typescript
        throw Error('project should have provider');
      }

      expect(projectInDb._id.toHexString()).toEqual(responseJson.id);
      expect(projectInDb.provider).toEqual(provider);
      expect(projectInDb.owner).toEqual(owner.toLowerCase());
      expect(projectInDb.repo).toEqual(repo.toLowerCase());
      expect(projectInDb.lastAccessed.getTime()).toEqual(projectInDb.creationDate.getTime());
    });

    test('project exist', async () => {
      const project = await createTestGitProject();

      const response = await app.inject({
        method: 'POST',
        url: '/v1/projects/id',
        payload: {
          provider: project.provider,
          owner: project.owner,
          repo: project.repo,
        },
      });

      expect(response.statusCode).toEqual(200);

      const responseJson = response.json<{ id: string }>();

      expect(responseJson.id).toEqual(project.id);

      const projectsCollection = await getProjectsCollection();
      const projectInDb = await projectsCollection.findOne({ _id: new ObjectId(responseJson.id) });

      if (!projectInDb) {
        throw Error('project should be in DB');
      }

      if (!('provider' in projectInDb)) {
        // TODO: typescript
        throw Error('project should have provider');
      }

      expect(projectInDb._id.toHexString()).toEqual(responseJson.id);
      expect(projectInDb.provider).toEqual(project.provider);
      expect(projectInDb.owner).toEqual(project.owner);
      expect(projectInDb.repo).toEqual(project.repo);
      expect(projectInDb.lastAccessed.getTime()).toBeGreaterThan(projectInDb.creationDate.getTime());
    });
  });
});
