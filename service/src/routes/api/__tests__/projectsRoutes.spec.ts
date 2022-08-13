import { ObjectId } from 'mongodb';
import { CreateProjectResponse, ProjectProvider } from 'bundlemon-utils';
import { app } from '@tests/app';
import { getProjectsCollection } from '../../../framework/mongo/projects';
import { verifyHash } from '../../../utils/hashUtils';
import { generateRandomString } from '@tests/utils';
import { createTestGithubProject } from '@tests/projectUtils';
import { createOctokitClientByAction } from '../../../framework/github';

jest.mock('../../../framework/github');

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
    test('unknown provider', async () => {
      const owner = generateRandomString();
      const repo = generateRandomString();
      const runId = generateRandomString();
      const commitSha = generateRandomString();
      const response = await app.inject({
        method: 'POST',
        url: '/v1/projects/id',
        payload: {
          provider: 'provider',
          owner,
          repo,
        },
        query: {
          runId,
          commitSha,
        },
      });

      expect(response.statusCode).toEqual(400);
    });

    describe('GitHub project', () => {
      const provider = ProjectProvider.GitHub;

      describe('bad request', () => {
        test.each([
          {
            name: 'missing owner',
            payload: { repo: generateRandomString() },
            query: { runId: generateRandomString(), commitSha: generateRandomString() },
          },
          {
            name: 'missing repo',
            payload: { repo: generateRandomString() },
            query: { commitSha: generateRandomString() },
          },
          {
            name: 'no query',
            payload: { owner: generateRandomString(), repo: generateRandomString() },
            query: undefined,
          },
          {
            name: 'empty query',
            payload: { owner: generateRandomString(), repo: generateRandomString() },
            query: {},
          },
          {
            name: 'missing runId',
            payload: { owner: generateRandomString(), repo: generateRandomString() },
            query: { commitSha: generateRandomString() },
          },
          {
            name: 'missing commitSha',
            payload: { owner: generateRandomString(), repo: generateRandomString() },
            query: { runId: generateRandomString() },
          },
        ])('$name', async ({ payload, query }) => {
          const response = await app.inject({
            method: 'POST',
            url: '/v1/projects/id',
            payload: {
              provider,
              ...payload,
            },
            query: query as any,
          });

          expect(response.statusCode).toEqual(400);
        });
      });

      test('project doesnt exist, authenticated', async () => {
        const mockedCreateOctokitClientByAction = jest.mocked(createOctokitClientByAction).mockResolvedValue({
          authenticated: true,
          installationOctokit: {} as any,
        });
        const owner = generateRandomString() + 'A.a';
        const repo = generateRandomString() + 'B_-';
        const runId = generateRandomString();
        const commitSha = generateRandomString();
        const response = await app.inject({
          method: 'POST',
          url: '/v1/projects/id',
          payload: {
            provider,
            owner,
            repo,
          },
          query: {
            runId,
            commitSha,
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

        expect(mockedCreateOctokitClientByAction).toHaveBeenCalledWith(
          {
            owner,
            repo,
            commitSha,
            runId,
          },
          expect.any(Object)
        );
        expect(projectInDb._id.toHexString()).toEqual(responseJson.id);
        expect(projectInDb.provider).toEqual(provider);
        expect(projectInDb.owner).toEqual(owner.toLowerCase());
        expect(projectInDb.repo).toEqual(repo.toLowerCase());
        expect(projectInDb.lastAccessed.getTime()).toEqual(projectInDb.creationDate.getTime());
      });

      test('project doesnt exist, not authenticated', async () => {
        const projectsCollection = await getProjectsCollection();
        const beforeProjectsInDb = await projectsCollection.countDocuments();

        const errorMsg = 'some message';
        const mockedCreateOctokitClientByAction = jest.mocked(createOctokitClientByAction).mockResolvedValue({
          authenticated: false,
          error: errorMsg,
        });
        const owner = generateRandomString() + 'A.a';
        const repo = generateRandomString() + 'B_-';
        const runId = generateRandomString();
        const commitSha = generateRandomString();
        const response = await app.inject({
          method: 'POST',
          url: '/v1/projects/id',
          payload: {
            provider,
            owner,
            repo,
          },
          query: {
            runId,
            commitSha,
          },
        });

        expect(response.statusCode).toEqual(403);

        const responseJson = response.json();

        expect(responseJson.error).toEqual(errorMsg);

        expect(mockedCreateOctokitClientByAction).toHaveBeenCalledWith(
          {
            owner,
            repo,
            commitSha,
            runId,
          },
          expect.any(Object)
        );
        expect(await projectsCollection.countDocuments()).toEqual(beforeProjectsInDb);
      });

      test('project exist, authenticated', async () => {
        const mockedCreateOctokitClientByAction = jest.mocked(createOctokitClientByAction).mockResolvedValue({
          authenticated: true,
          installationOctokit: {} as any,
        });
        const project = await createTestGithubProject();
        const runId = generateRandomString();
        const commitSha = generateRandomString();

        const response = await app.inject({
          method: 'POST',
          url: '/v1/projects/id',
          payload: {
            provider: project.provider,
            owner: project.owner,
            repo: project.repo,
          },
          query: {
            runId,
            commitSha,
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

        expect(mockedCreateOctokitClientByAction).toHaveBeenCalledWith(
          {
            owner: project.owner,
            repo: project.repo,
            commitSha,
            runId,
          },
          expect.any(Object)
        );
        expect(projectInDb._id.toHexString()).toEqual(responseJson.id);
        expect(projectInDb.provider).toEqual(project.provider);
        expect(projectInDb.owner).toEqual(project.owner);
        expect(projectInDb.repo).toEqual(project.repo);
        expect(projectInDb.lastAccessed.getTime()).toBeGreaterThan(project.lastAccessed.getTime());
      });

      test('project exist, not authenticated', async () => {
        const errorMsg = 'some message';
        const mockedCreateOctokitClientByAction = jest.mocked(createOctokitClientByAction).mockResolvedValue({
          authenticated: false,
          error: errorMsg,
        });
        const project = await createTestGithubProject();
        const runId = generateRandomString();
        const commitSha = generateRandomString();

        const response = await app.inject({
          method: 'POST',
          url: '/v1/projects/id',
          payload: {
            provider: project.provider,
            owner: project.owner,
            repo: project.repo,
          },
          query: {
            runId,
            commitSha,
          },
        });

        expect(response.statusCode).toEqual(403);

        const responseJson = response.json();

        expect(responseJson.error).toEqual(errorMsg);

        const projectsCollection = await getProjectsCollection();
        const projectInDb = await projectsCollection.findOne({ _id: new ObjectId(project.id) });

        if (!projectInDb) {
          throw Error('project should be in DB');
        }

        if (!('provider' in projectInDb)) {
          // TODO: typescript
          throw Error('project should have provider');
        }

        expect(mockedCreateOctokitClientByAction).toHaveBeenCalledWith(
          {
            owner: project.owner,
            repo: project.repo,
            commitSha,
            runId,
          },
          expect.any(Object)
        );
        expect(projectInDb.lastAccessed.getTime()).toEqual(projectInDb.creationDate.getTime());
      });
    });
  });
});
