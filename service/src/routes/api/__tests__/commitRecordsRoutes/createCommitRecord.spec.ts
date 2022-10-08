import { ObjectId } from 'mongodb';
import { CommitRecordPayload, Compression, CreateCommitRecordResponse } from 'bundlemon-utils';
import { app } from '@tests/app';
import { createTestGithubProject, createTestProjectWithApiKey, generateProjectId } from '@tests/projectUtils';
import { generateRandomInt, generateRandomString } from '@tests/utils';
import { createCommitRecord, getCommitRecordsCollection } from '@/framework/mongo/commitRecords';
import { generateLinkToReport } from '@/utils/linkUtils';
import { CreateCommitRecordAuthType } from '@/consts/commitRecords';
import { createOctokitClientByAction } from '@/framework/github';
import { getProjectsCollection } from '@/framework/mongo/projects';

jest.mock('@/framework/github');

describe('create commit record', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('bad API key', async () => {
    const { projectId } = await createTestProjectWithApiKey();

    const payload: CommitRecordPayload = {
      branch: 'test',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
      groups: [],
    };

    const response = await app.inject({
      method: 'POST',
      url: `/v1/projects/${projectId}/commit-records`,
      payload,
      headers: {
        'bundlemon-auth-type': 'API_KEY',
        'x-api-key': 'api-key',
      },
    });

    expect(response.statusCode).toEqual(403);
  });

  test('project not found', async () => {
    const projectId = generateProjectId();

    const payload: CommitRecordPayload = {
      branch: 'test',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
      groups: [],
    };

    const response = await app.inject({
      method: 'POST',
      url: `/v1/projects/${projectId}/commit-records`,
      payload,
      headers: {
        'x-api-key': 'api-key',
      },
    });

    const responseJson = response.json();

    expect(response.statusCode).toEqual(403);
    expect(responseJson.message).toEqual('forbidden');
  });

  test('unknown auth type', async () => {
    const { projectId } = await createTestProjectWithApiKey();

    const payload: CommitRecordPayload = {
      branch: 'test',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
      groups: [],
    };

    const response = await app.inject({
      method: 'POST',
      url: `/v1/projects/${projectId}/commit-records`,
      payload,
    });

    const responseJson = response.json();

    expect(response.statusCode).toEqual(403);
    expect(responseJson.message).toEqual('forbidden');
  });

  test('project without api key', async () => {
    const project = await createTestGithubProject();

    const payload: CommitRecordPayload = {
      branch: 'test',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
      groups: [],
    };

    const response = await app.inject({
      method: 'POST',
      url: `/v1/projects/${project.id}/commit-records`,
      payload,
      headers: {
        'x-api-key': 'api-key',
      },
    });

    expect(response.statusCode).toEqual(403);
  });

  describe('GitHub auth', () => {
    test('success', async () => {
      const mockedCreateOctokitClientByAction = jest.mocked(createOctokitClientByAction).mockResolvedValue({
        authenticated: true,
        installationOctokit: {} as any,
      });
      const project = await createTestGithubProject();
      const runId = String(generateRandomInt(1000000, 99999999));
      const payload: CommitRecordPayload = {
        branch: 'test',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
        groups: [],
      };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records`,
        payload,
        query: {
          authType: CreateCommitRecordAuthType.GithubActions,
          runId,
        },
      });

      const responseJson = response.json<CreateCommitRecordResponse>();
      const { record } = responseJson;

      expect(response.statusCode).toEqual(200);
      expect(mockedCreateOctokitClientByAction).toHaveBeenCalledWith(
        {
          owner: project.owner,
          repo: project.repo,
          commitSha: payload.commitSha,
          runId,
        },
        expect.any(Object)
      );

      // Validate the record exist in the DB
      const commitRecordsCollection = await getCommitRecordsCollection();
      const recordInDb = await commitRecordsCollection.findOne({ _id: new ObjectId(record.id) });

      expect(recordInDb).toBeDefined();
    });

    test('not authenticated', async () => {
      const mockedCreateOctokitClientByAction = jest.mocked(createOctokitClientByAction).mockResolvedValue({
        authenticated: false,
        error: 'message from github',
      });
      const project = await createTestGithubProject();
      const runId = String(generateRandomInt(1000000, 99999999));
      const payload: CommitRecordPayload = {
        branch: 'test',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
        groups: [],
      };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records`,
        payload,
        query: {
          authType: CreateCommitRecordAuthType.GithubActions,
          runId,
        },
      });

      const responseJson = response.json();

      expect(response.statusCode).toEqual(403);
      expect(responseJson.message).toEqual('message from github');
      expect(mockedCreateOctokitClientByAction).toHaveBeenCalledWith(
        {
          owner: project.owner,
          repo: project.repo,
          commitSha: payload.commitSha,
          runId,
        },
        expect.any(Object)
      );
    });

    test('not authenticated: other provider project', async () => {
      const mockedCreateOctokitClientByAction = jest.mocked(createOctokitClientByAction);
      // @ts-expect-error
      const project = await createTestGithubProject({ provider: 'travis' });
      const runId = String(generateRandomInt(1000000, 99999999));
      const payload: CommitRecordPayload = {
        branch: 'test',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
        groups: [],
      };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records`,
        payload,
        query: {
          authType: CreateCommitRecordAuthType.GithubActions,
          runId,
        },
      });

      const responseJson = response.json();

      expect(response.statusCode).toEqual(403);
      expect(responseJson.message).toEqual('forbidden');
      expect(mockedCreateOctokitClientByAction).toHaveBeenCalledTimes(0);
    });

    test('not authenticated: project with API key', async () => {
      const mockedCreateOctokitClientByAction = jest.mocked(createOctokitClientByAction);
      const project = await createTestProjectWithApiKey();
      const runId = String(generateRandomInt(1000000, 99999999));
      const payload: CommitRecordPayload = {
        branch: 'test',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
        groups: [],
      };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/projects/${project.projectId}/commit-records`,
        payload,
        query: {
          authType: CreateCommitRecordAuthType.GithubActions,
          runId,
        },
      });

      const responseJson = response.json();

      expect(response.statusCode).toEqual(403);
      expect(responseJson.message).toEqual('forbidden');
      expect(mockedCreateOctokitClientByAction).toHaveBeenCalledTimes(0);
    });
    describe('legacy auth', () => {
      test('success', async () => {
        const mockedCreateOctokitClientByAction = jest.mocked(createOctokitClientByAction).mockResolvedValue({
          authenticated: true,
          installationOctokit: {} as any,
        });
        const project = await createTestProjectWithApiKey();
        const owner = generateRandomString();
        const repo = generateRandomString();
        const runId = String(generateRandomInt(1000000, 99999999));
        const payload: CommitRecordPayload = {
          branch: 'test',
          commitSha: generateRandomString(8),
          files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
          groups: [],
        };

        const response = await app.inject({
          method: 'POST',
          url: `/v1/projects/${project.projectId}/commit-records`,
          payload,
          headers: {
            'bundlemon-auth-type': 'GITHUB_ACTION',
            'github-owner': owner,
            'github-repo': repo,
            'github-run-id': runId,
          },
        });

        const responseJson = response.json<CreateCommitRecordResponse>();
        const { record } = responseJson;

        expect(response.statusCode).toEqual(200);
        expect(mockedCreateOctokitClientByAction).toHaveBeenCalledWith(
          {
            owner,
            repo,
            runId,
          },
          expect.any(Object)
        );

        // Validate the record exist in the DB
        const commitRecordsCollection = await getCommitRecordsCollection();
        const recordInDb = await commitRecordsCollection.findOne({ _id: new ObjectId(record.id) });

        expect(recordInDb).toBeDefined();
      });

      test('not authenticated', async () => {
        const mockedCreateOctokitClientByAction = jest.mocked(createOctokitClientByAction).mockResolvedValue({
          authenticated: false,
          error: 'message from github',
        });
        const project = await createTestProjectWithApiKey();
        const owner = generateRandomString();
        const repo = generateRandomString();
        const runId = String(generateRandomInt(1000000, 99999999));
        const payload: CommitRecordPayload = {
          branch: 'test',
          commitSha: generateRandomString(8),
          files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
          groups: [],
        };

        const response = await app.inject({
          method: 'POST',
          url: `/v1/projects/${project.projectId}/commit-records`,
          payload,
          headers: {
            'bundlemon-auth-type': 'GITHUB_ACTION',
            'github-owner': owner,
            'github-repo': repo,
            'github-run-id': runId,
          },
        });

        const responseJson = response.json();

        expect(response.statusCode).toEqual(403);
        expect(responseJson.message).toEqual('message from github');
        expect(mockedCreateOctokitClientByAction).toHaveBeenCalledWith(
          {
            owner,
            repo,
            runId,
          },
          expect.any(Object)
        );
      });

      // TODO: legacy github auth currently enabled
      test.skip('not authenticated - git project', async () => {
        const mockedCreateOctokitClientByAction = jest.mocked(createOctokitClientByAction);
        const project = await createTestGithubProject();
        const runId = String(generateRandomInt(1000000, 99999999));
        const payload: CommitRecordPayload = {
          branch: 'test',
          commitSha: generateRandomString(8),
          files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
          groups: [],
        };

        const response = await app.inject({
          method: 'POST',
          url: `/v1/projects/${project.id}/commit-records`,
          payload,
          headers: {
            'bundlemon-auth-type': 'GITHUB_ACTION',
            'github-owner': project.owner,
            'github-repo': project.repo,
            'github-run-id': runId,
          },
        });

        const responseJson = response.json();

        expect(response.statusCode).toEqual(403);
        expect(responseJson.message).toEqual('legacy github auth works only with old projects');
        expect(mockedCreateOctokitClientByAction).toBeCalledTimes(0);
      });
    });
  });

  describe('without base branch', () => {
    test('no records in current branch', async () => {
      const { projectId, apiKey } = await createTestProjectWithApiKey();

      const payload: CommitRecordPayload = {
        branch: 'test',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
        groups: [],
      };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/projects/${projectId}/commit-records`,
        payload,
        headers: {
          'bundlemon-auth-type': 'API_KEY',
          'x-api-key': apiKey,
        },
      });

      expect(response.statusCode).toEqual(200);

      const responseJson = response.json<CreateCommitRecordResponse>();
      const { record, baseRecord, linkToReport } = responseJson;

      expect(record).toEqual({
        ...payload,
        projectId,
        id: record.id,
        creationDate: record.creationDate,
      });
      expect(baseRecord).toBeUndefined();
      expect(linkToReport).toEqual(generateLinkToReport({ projectId, commitRecordId: record.id }));

      // Validate the record exist in the DB
      const commitRecordsCollection = await getCommitRecordsCollection();
      const recordInDb = await commitRecordsCollection.findOne({ _id: new ObjectId(record.id) });

      expect(recordInDb).toBeDefined();

      // Validate last record date updated in project
      const projectsCollection = await getProjectsCollection();
      const projectInDB = await projectsCollection.findOne({ _id: new ObjectId(projectId) });

      expect(projectInDB?.lastRecordAt).toEqual(new Date(record.creationDate));
    });

    test('with records in current branch', async () => {
      const { projectId, apiKey } = await createTestProjectWithApiKey();

      await createCommitRecord(projectId, {
        branch: 'main',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 200, compression: Compression.None }],
        groups: [],
      });

      const baseCommitRecord = await createCommitRecord(projectId, {
        branch: 'main',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 120, compression: Compression.None }],
        groups: [],
      });

      await createCommitRecord(projectId, {
        branch: 'other-branch',
        commitSha: generateRandomString(8),
        files: [{ path: 'file2.js', pattern: '*.js', size: 120, compression: Compression.None }],
        groups: [],
      });

      const payload: CommitRecordPayload = {
        branch: 'main',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
        groups: [],
      };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/projects/${projectId}/commit-records`,
        payload,
        headers: {
          'bundlemon-auth-type': 'API_KEY',
          'x-api-key': apiKey,
        },
      });

      expect(response.statusCode).toEqual(200);

      const responseJson = response.json<CreateCommitRecordResponse>();
      const { record, baseRecord, linkToReport } = responseJson;

      expect(record).toEqual({
        ...payload,
        projectId,
        id: record.id,
        creationDate: record.creationDate,
      });
      expect(baseRecord).toEqual(baseCommitRecord);
      expect(linkToReport).toEqual(generateLinkToReport({ projectId, commitRecordId: record.id }));

      // Validate the record exist in the DB
      const commitRecordsCollection = await getCommitRecordsCollection();
      const recordInDb = await commitRecordsCollection.findOne({ _id: new ObjectId(record.id) });

      expect(recordInDb).toBeDefined();
    });
  });

  describe('with base branch (PR)', () => {
    test.each([
      { name: 'base branch has commit records', baseBranch: 'main' },
      { name: 'base branch not found', baseBranch: 'new' },
      { name: 'base branch not found, with sub project', baseBranch: 'new', subProject: 'website2' },
      { name: 'base branch has commit records, with sub project', baseBranch: 'main', subProject: 'website2' },
    ])('$name', async ({ baseBranch, subProject }) => {
      const { projectId, apiKey } = await createTestProjectWithApiKey();

      await createCommitRecord(projectId, {
        branch: 'main',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 135, compression: Compression.None }],
        groups: [],
      });

      await createCommitRecord(projectId, {
        subProject,
        branch: 'main',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
        groups: [],
      });

      const commitRecord2 = await createCommitRecord(projectId, {
        subProject,
        branch: 'main',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 120, compression: Compression.None }],
        groups: [],
      });

      await createCommitRecord(projectId, {
        subProject: 'other-website',
        branch: 'main',
        commitSha: generateRandomString(8),
        files: [{ path: 'file2.js', pattern: '*.js', size: 150, compression: Compression.None }],
        groups: [],
      });

      const payload: CommitRecordPayload = {
        subProject,
        branch: 'test',
        baseBranch,
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 110, compression: Compression.None }],
        groups: [],
      };

      const response = await app.inject({
        method: 'POST',
        url: `/v1/projects/${projectId}/commit-records`,
        payload,
        headers: {
          'bundlemon-auth-type': 'API_KEY',
          'x-api-key': apiKey,
        },
      });

      expect(response.statusCode).toEqual(200);

      const responseJson = response.json<CreateCommitRecordResponse>();
      const { record, baseRecord, linkToReport } = responseJson;

      expect(record).toEqual({
        ...payload,
        projectId,
        id: record.id,
        creationDate: record.creationDate,
      });
      expect(baseRecord).toEqual(baseBranch === 'main' ? commitRecord2 : undefined);
      expect(linkToReport).toEqual(generateLinkToReport({ projectId, commitRecordId: record.id }));

      // Validate the record exist in the DB
      const commitRecordsCollection = await getCommitRecordsCollection();
      const recordInDb = await commitRecordsCollection.findOne({ _id: new ObjectId(record.id) });

      expect(recordInDb).toBeDefined();

      // Validate last record date updated in project
      const projectsCollection = await getProjectsCollection();
      const projectInDB = await projectsCollection.findOne({ _id: new ObjectId(projectId) });

      expect(projectInDB?.lastRecordAt).toEqual(new Date(record.creationDate));
    });
  });

  test('commit sha already exists - overwrite', async () => {
    const { projectId, apiKey } = await createTestProjectWithApiKey();
    const commitSha = generateRandomString(8);

    const originalRecord = await createCommitRecord(projectId, {
      // subProject: 'other-website',
      branch: 'test',
      commitSha,
      files: [{ path: 'file2.js', pattern: '*.js', size: 150, compression: Compression.None }],
      groups: [],
    });

    const payload: CommitRecordPayload = {
      branch: 'test',
      commitSha,
      files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
      groups: [],
    };

    const response = await app.inject({
      method: 'POST',
      url: `/v1/projects/${projectId}/commit-records`,
      payload,
      headers: {
        'bundlemon-auth-type': 'API_KEY',
        'x-api-key': apiKey,
      },
    });

    expect(response.statusCode).toEqual(200);

    const responseJson = response.json<CreateCommitRecordResponse>();
    const { record, baseRecord, linkToReport } = responseJson;

    expect(originalRecord).not.toEqual(record);
    expect(originalRecord.id).toEqual(record.id);
    expect(record).toEqual({
      ...payload,
      projectId,
      id: record.id,
      creationDate: record.creationDate,
    });
    expect(baseRecord).toBeUndefined();
    expect(linkToReport).toEqual(generateLinkToReport({ projectId, commitRecordId: record.id }));

    // Validate the record exist in the DB
    const commitRecordsCollection = await getCommitRecordsCollection();
    const recordInDb = await commitRecordsCollection.findOne({ _id: new ObjectId(record.id) });

    expect(recordInDb).toBeDefined();

    // Validate last record date updated in project
    const projectsCollection = await getProjectsCollection();
    const projectInDB = await projectsCollection.findOne({ _id: new ObjectId(projectId) });

    expect(projectInDB?.lastRecordAt).toEqual(new Date(record.creationDate));
  });

  test('commit sha already exists for another subproject - dont overwrite', async () => {
    const { projectId, apiKey } = await createTestProjectWithApiKey();
    const commitSha = generateRandomString(8);

    const originalRecord = await createCommitRecord(projectId, {
      subProject: 'other-website',
      branch: 'test',
      commitSha,
      files: [{ path: 'file2.js', pattern: '*.js', size: 150, compression: Compression.None }],
      groups: [],
    });

    const payload: CommitRecordPayload = {
      branch: 'test',
      commitSha,
      files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
      groups: [],
    };

    const response = await app.inject({
      method: 'POST',
      url: `/v1/projects/${projectId}/commit-records`,
      payload,
      headers: {
        'bundlemon-auth-type': 'API_KEY',
        'x-api-key': apiKey,
      },
    });

    expect(response.statusCode).toEqual(200);

    const responseJson = response.json<CreateCommitRecordResponse>();
    const { record, baseRecord, linkToReport } = responseJson;

    expect(originalRecord.id).not.toEqual(record.id);
    expect(record).toEqual({
      ...payload,
      projectId,
      id: record.id,
      creationDate: record.creationDate,
    });
    expect(baseRecord).toBeUndefined();
    expect(linkToReport).toEqual(generateLinkToReport({ projectId, commitRecordId: record.id }));

    // Validate the record exist in the DB
    const commitRecordsCollection = await getCommitRecordsCollection();
    const recordInDb = await commitRecordsCollection.findOne({ _id: new ObjectId(record.id) });

    expect(recordInDb).toBeDefined();
  });
});
