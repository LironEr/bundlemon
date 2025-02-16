import {
  Compression,
  BaseCommitRecordResponse,
  CommitRecordReview,
  CommitRecordGitHubOutputs,
  CommitRecordReviewResolution,
} from 'bundlemon-utils';
import { createTestApp, injectAuthorizedRequest } from '@tests/app';
import { createTestGithubProject } from '@tests/projectUtils';
import { generateRandomInt, generateRandomString, generateUserSessionData } from '@tests/utils';
import {
  addReviewToCommitRecord,
  createCommitRecord,
  setCommitRecordGithubOutputs,
} from '@/framework/mongo/commitRecords';
import {
  createOctokitClientByToken,
  updateGithubOutputs,
  isUserHasWritePermissionToRepo,
  createOctokitClientByRepo,
  getCurrentUser,
} from '@/framework/github';
import { ReviewCommitRecordRequestSchema } from '@/types/schemas';
import { FastifyInstance } from 'fastify';

jest.mock('@/framework/github');

describe('review commit record', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('user not logged in', async () => {
    const project = await createTestGithubProject();

    await createCommitRecord(project.id, {
      branch: 'main',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 120, compression: Compression.None }],
      groups: [],
    });

    const record = await createCommitRecord(project.id, {
      branch: 'test',
      baseBranch: 'main',
      commitSha: generateRandomString(8),
      prNumber: '7',
      files: [{ path: 'file.js', pattern: '*.js', size: 110, compression: Compression.None, maxSize: 100 }],
      groups: [],
    });

    const payload: ReviewCommitRecordRequestSchema['body'] = {
      resolution: CommitRecordReviewResolution.Approved,
    };

    const response = await app.inject({
      method: 'POST',
      url: `/v1/projects/${project.id}/commit-records/${record.id}/reviews`,
      payload,
    });

    expect(response.statusCode).toEqual(401);
  });

  test('commit record not found', async () => {
    const project = await createTestGithubProject();

    const payload: ReviewCommitRecordRequestSchema['body'] = {
      resolution: CommitRecordReviewResolution.Approved,
    };

    const response = await injectAuthorizedRequest(app, {
      method: 'POST',
      url: `/v1/projects/${project.id}/commit-records/${generateRandomString(24)}/reviews`,
      payload,
    });

    expect(response.statusCode).toEqual(404);
  });

  test('record not a PR', async () => {
    const project = await createTestGithubProject();
    const userSessionData = generateUserSessionData();

    await createCommitRecord(project.id, {
      branch: 'main',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 120, compression: Compression.None }],
      groups: [],
    });

    const record = await createCommitRecord(project.id, {
      branch: 'test',
      baseBranch: 'main',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 110, compression: Compression.None, maxSize: 50 }],
      groups: [],
    });

    const payload: ReviewCommitRecordRequestSchema['body'] = {
      resolution: CommitRecordReviewResolution.Approved,
    };

    const response = await injectAuthorizedRequest(
      app,
      {
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records/${record.id}/reviews`,
        payload,
      },
      userSessionData
    );

    expect(response.statusCode).toEqual(400);

    const responseJson = response.json();
    expect(responseJson.message).toEqual('review is only possible on commit records that are related to a PR');
  });

  test('no GitHub outputs on record', async () => {
    jest.mocked(createOctokitClientByToken).mockReturnValue({} as any);
    jest.mocked(getCurrentUser).mockResolvedValue({ login: 'username' } as any);
    jest.mocked(isUserHasWritePermissionToRepo).mockResolvedValue(true);

    const project = await createTestGithubProject();
    const userSessionData = generateUserSessionData();

    await createCommitRecord(project.id, {
      branch: 'main',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 120, compression: Compression.None }],
      groups: [],
    });

    const record = await createCommitRecord(project.id, {
      branch: 'test',
      baseBranch: 'main',
      commitSha: generateRandomString(8),
      prNumber: '7',
      files: [{ path: 'file.js', pattern: '*.js', size: 110, compression: Compression.None, maxSize: 50 }],
      groups: [],
    });

    const payload: ReviewCommitRecordRequestSchema['body'] = {
      resolution: CommitRecordReviewResolution.Approved,
    };

    const response = await injectAuthorizedRequest(
      app,
      {
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records/${record.id}/reviews`,
        payload,
      },
      userSessionData
    );

    expect(response.statusCode).toEqual(409);

    const responseJson = response.json();
    expect(responseJson.message).toEqual('missing github information on commit record');
  });

  test('unknown user provider', async () => {
    const project = await createTestGithubProject();
    const userSessionData = generateUserSessionData();
    userSessionData.provider = 'unknown' as any;

    await createCommitRecord(project.id, {
      branch: 'main',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 120, compression: Compression.None }],
      groups: [],
    });

    const record = await createCommitRecord(project.id, {
      branch: 'test',
      baseBranch: 'main',
      commitSha: generateRandomString(8),
      prNumber: '7',
      files: [{ path: 'file.js', pattern: '*.js', size: 110, compression: Compression.None, maxSize: 50 }],
      groups: [],
    });

    const githubOutputs: CommitRecordGitHubOutputs = {
      owner: generateRandomString(),
      repo: generateRandomString(),
      outputs: {
        commitStatus: generateRandomInt(10000000, 99999999),
      },
    };

    await setCommitRecordGithubOutputs(project.id, record.id, githubOutputs);

    const payload: ReviewCommitRecordRequestSchema['body'] = {
      resolution: CommitRecordReviewResolution.Approved,
    };

    const response = await injectAuthorizedRequest(
      app,
      {
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records/${record.id}/reviews`,
        payload,
      },
      userSessionData
    );

    expect(response.statusCode).toEqual(403);

    const responseJson = response.json();
    expect(responseJson.message).toEqual('unknown user provider');
  });

  test('no write permissions to GitHub repo', async () => {
    jest.mocked(createOctokitClientByToken).mockReturnValue({} as any);
    jest.mocked(getCurrentUser).mockResolvedValue({ login: 'username' } as any);
    jest.mocked(isUserHasWritePermissionToRepo).mockResolvedValue(false);

    const project = await createTestGithubProject();
    const userSessionData = generateUserSessionData();

    await createCommitRecord(project.id, {
      branch: 'main',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 120, compression: Compression.None }],
      groups: [],
    });

    const record = await createCommitRecord(project.id, {
      branch: 'test',
      baseBranch: 'main',
      commitSha: generateRandomString(8),
      prNumber: '7',
      files: [{ path: 'file.js', pattern: '*.js', size: 110, compression: Compression.None, maxSize: 50 }],
      groups: [],
    });

    const githubOutputs: CommitRecordGitHubOutputs = {
      owner: generateRandomString(),
      repo: generateRandomString(),
      outputs: {
        commitStatus: generateRandomInt(10000000, 99999999),
      },
    };

    await setCommitRecordGithubOutputs(project.id, record.id, githubOutputs);

    const payload: ReviewCommitRecordRequestSchema['body'] = {
      resolution: CommitRecordReviewResolution.Approved,
    };

    const response = await injectAuthorizedRequest(
      app,
      {
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records/${record.id}/reviews`,
        payload,
      },
      userSessionData
    );

    expect(response.statusCode).toEqual(403);
  });

  test('GitHub app is not installed for this repo', async () => {
    jest.mocked(createOctokitClientByToken).mockReturnValue({} as any);
    jest.mocked(createOctokitClientByRepo).mockResolvedValue(undefined);
    jest.mocked(getCurrentUser).mockResolvedValue({ login: 'username' } as any);
    jest.mocked(isUserHasWritePermissionToRepo).mockResolvedValue(true);

    const project = await createTestGithubProject();
    const userSessionData = generateUserSessionData();

    await createCommitRecord(project.id, {
      branch: 'main',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 120, compression: Compression.None }],
      groups: [],
    });

    const record = await createCommitRecord(project.id, {
      branch: 'test',
      baseBranch: 'main',
      commitSha: generateRandomString(8),
      prNumber: '7',
      files: [{ path: 'file.js', pattern: '*.js', size: 110, compression: Compression.None, maxSize: 50 }],
      groups: [],
    });

    const githubOutputs: CommitRecordGitHubOutputs = {
      owner: generateRandomString(),
      repo: generateRandomString(),
      outputs: {
        commitStatus: generateRandomInt(10000000, 99999999),
      },
    };

    await setCommitRecordGithubOutputs(project.id, record.id, githubOutputs);

    const payload: ReviewCommitRecordRequestSchema['body'] = {
      resolution: CommitRecordReviewResolution.Approved,
    };

    const response = await injectAuthorizedRequest(
      app,
      {
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records/${record.id}/reviews`,
        payload,
      },
      userSessionData
    );

    expect(response.statusCode).toEqual(400);

    const responseJson = response.json();
    expect(responseJson.message).toEqual(
      `BundleMon GitHub app is not installed for this repo (${githubOutputs.owner}/${githubOutputs.repo})`
    );
  });

  test('success first approver', async () => {
    const mockedCreateOctokitClientByToken = jest.mocked(createOctokitClientByToken).mockReturnValue({} as any);
    const mockedCreateOctokitClientByRepo = jest.mocked(createOctokitClientByRepo).mockResolvedValue({} as any);
    jest.mocked(getCurrentUser).mockResolvedValue({ login: 'username' } as any);
    const mockedIsUserHasWritePermissionToRepo = jest.mocked(isUserHasWritePermissionToRepo).mockResolvedValue(true);
    jest.mocked(updateGithubOutputs).mockResolvedValue();

    const project = await createTestGithubProject();
    const userSessionData = generateUserSessionData();

    await createCommitRecord(project.id, {
      branch: 'main',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 120, compression: Compression.None }],
      groups: [],
    });

    const record = await createCommitRecord(project.id, {
      branch: 'test',
      baseBranch: 'main',
      commitSha: generateRandomString(8),
      prNumber: '7',
      files: [{ path: 'file.js', pattern: '*.js', size: 110, compression: Compression.None, maxSize: 500 }],
      groups: [],
    });

    const githubOutputs: CommitRecordGitHubOutputs = {
      owner: generateRandomString(),
      repo: generateRandomString(),
      outputs: {
        commitStatus: generateRandomInt(10000000, 99999999),
      },
    };

    await setCommitRecordGithubOutputs(project.id, record.id, githubOutputs);

    const payload: ReviewCommitRecordRequestSchema['body'] = {
      resolution: CommitRecordReviewResolution.Rejected,
    };

    const response = await injectAuthorizedRequest(
      app,
      {
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records/${record.id}/reviews`,
        payload,
      },
      userSessionData
    );

    expect(response.statusCode).toEqual(200);

    const responseJson = response.json<BaseCommitRecordResponse>();
    expect(responseJson.record.reviews).toEqual([
      {
        user: {
          provider: userSessionData.provider,
          name: userSessionData.name,
        },
        createdAt: expect.any(String),
        resolution: CommitRecordReviewResolution.Rejected,
      },
    ]);

    expect(mockedCreateOctokitClientByToken).toHaveBeenCalledWith(userSessionData.auth.token);
    expect(mockedIsUserHasWritePermissionToRepo).toHaveBeenCalledWith(
      expect.any(Object),
      githubOutputs.owner,
      githubOutputs.repo,
      'username'
    );
    expect(mockedCreateOctokitClientByRepo).toHaveBeenCalledWith(githubOutputs.owner, githubOutputs.repo);
    expect(updateGithubOutputs).toHaveBeenCalledTimes(1);
  });

  test('success with existing user reviews', async () => {
    const mockedCreateOctokitClientByToken = jest.mocked(createOctokitClientByToken).mockReturnValue({} as any);
    const mockedCreateOctokitClientByRepo = jest.mocked(createOctokitClientByRepo).mockResolvedValue({} as any);
    jest.mocked(getCurrentUser).mockResolvedValue({ login: 'username' } as any);
    const mockedIsUserHasWritePermissionToRepo = jest.mocked(isUserHasWritePermissionToRepo).mockResolvedValue(true);
    jest.mocked(updateGithubOutputs).mockResolvedValue();

    const project = await createTestGithubProject();
    const userSessionData = generateUserSessionData();

    await createCommitRecord(project.id, {
      branch: 'main',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 120, compression: Compression.None }],
      groups: [],
    });

    const record = await createCommitRecord(project.id, {
      branch: 'test',
      baseBranch: 'main',
      commitSha: generateRandomString(8),
      prNumber: '7',
      files: [{ path: 'file.js', pattern: '*.js', size: 110, compression: Compression.None, maxSize: 50 }],
      groups: [],
    });

    const githubOutputs: CommitRecordGitHubOutputs = {
      owner: generateRandomString(),
      repo: generateRandomString(),
      outputs: {
        commitStatus: generateRandomInt(10000000, 99999999),
      },
    };

    await setCommitRecordGithubOutputs(project.id, record.id, githubOutputs);

    const review: CommitRecordReview = {
      user: {
        provider: 'github',
        name: generateRandomString(),
      },
      createdAt: new Date().toISOString(),
      resolution: CommitRecordReviewResolution.Approved,
    };

    const review2: CommitRecordReview = {
      user: {
        provider: userSessionData.provider,
        name: userSessionData.name,
      },
      createdAt: new Date().toISOString(),
      resolution: CommitRecordReviewResolution.Rejected,
    };

    await addReviewToCommitRecord(project.id, record.id, review);
    await addReviewToCommitRecord(project.id, record.id, review2);

    const payload: ReviewCommitRecordRequestSchema['body'] = {
      resolution: CommitRecordReviewResolution.Reset,
    };

    const response = await injectAuthorizedRequest(
      app,
      {
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records/${record.id}/reviews`,
        payload,
      },
      userSessionData
    );

    expect(response.statusCode).toEqual(200);

    const responseJson = response.json<BaseCommitRecordResponse>();
    expect(responseJson.record.reviews).toEqual([
      {
        user: {
          provider: review.user.provider,
          name: review.user.name,
        },
        createdAt: review.createdAt,
        resolution: review.resolution,
      },
      {
        user: {
          provider: review2.user.provider,
          name: review2.user.name,
        },
        createdAt: review2.createdAt,
        resolution: review2.resolution,
      },
      {
        user: {
          provider: userSessionData.provider,
          name: userSessionData.name,
        },
        createdAt: expect.any(String),
        resolution: CommitRecordReviewResolution.Reset,
      },
    ]);

    expect(mockedCreateOctokitClientByToken).toHaveBeenCalledWith(userSessionData.auth.token);
    expect(mockedIsUserHasWritePermissionToRepo).toHaveBeenCalledWith(
      expect.any(Object),
      githubOutputs.owner,
      githubOutputs.repo,
      'username'
    );
    expect(mockedCreateOctokitClientByRepo).toHaveBeenCalledWith(githubOutputs.owner, githubOutputs.repo);
    expect(updateGithubOutputs).toHaveBeenCalledTimes(1);
  });
});
