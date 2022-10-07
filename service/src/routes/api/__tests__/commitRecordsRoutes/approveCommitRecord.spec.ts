import {
  Compression,
  BaseCommitRecordResponse,
  CommitRecordApprover,
  CommitRecordGitHubOutputs,
} from 'bundlemon-utils';
import { app, injectAuthorizedRequest } from '@tests/app';
import { createTestGithubProject } from '@tests/projectUtils';
import { generateRandomInt, generateRandomString, generateUserSessionData } from '@tests/utils';
import {
  addApproverToCommitRecord,
  createCommitRecord,
  setCommitRecordGithubOutputs,
} from '@/framework/mongo/commitRecords';
import {
  createOctokitClientByToken,
  githubApproveOutputs,
  isUserHasWritePermissionToRepo,
  createOctokitClientByRepo,
} from '@/framework/github';

jest.mock('@/framework/github');

describe('approve commit record', () => {
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
      files: [{ path: 'file.js', pattern: '*.js', size: 110, compression: Compression.None, maxSize: 100 }],
      groups: [],
    });

    const response = await app.inject({
      method: 'POST',
      url: `/v1/projects/${project.id}/commit-records/${record.id}/approve`,
      payload: {},
    });

    expect(response.statusCode).toEqual(401);
  });

  test('commit record not found', async () => {
    const project = await createTestGithubProject();

    const response = await injectAuthorizedRequest({
      method: 'POST',
      url: `/v1/projects/${project.id}/commit-records/${generateRandomString(24)}/approve`,
      payload: {},
    });

    expect(response.statusCode).toEqual(404);
  });

  test('report not in a fail status', async () => {
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
      files: [{ path: 'file.js', pattern: '*.js', size: 110, compression: Compression.None, maxSize: 500 }],
      groups: [],
    });

    const response = await injectAuthorizedRequest({
      method: 'POST',
      url: `/v1/projects/${project.id}/commit-records/${record.id}/approve`,
      payload: {},
    });

    expect(response.statusCode).toEqual(409);
  });

  test('no GitHub outputs on record', async () => {
    jest.mocked(createOctokitClientByToken).mockReturnValue({} as any);
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
      files: [{ path: 'file.js', pattern: '*.js', size: 110, compression: Compression.None, maxSize: 50 }],
      groups: [],
    });

    const response = await injectAuthorizedRequest(
      {
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records/${record.id}/approve`,
        payload: {},
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

    const response = await injectAuthorizedRequest(
      {
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records/${record.id}/approve`,
        payload: {},
      },
      userSessionData
    );

    expect(response.statusCode).toEqual(403);

    const responseJson = response.json();
    expect(responseJson.message).toEqual('unknown user provider');
  });

  test('no write permissions to GitHub repo', async () => {
    jest.mocked(createOctokitClientByToken).mockReturnValue({} as any);
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

    const response = await injectAuthorizedRequest(
      {
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records/${record.id}/approve`,
        payload: {},
      },
      userSessionData
    );

    expect(response.statusCode).toEqual(403);
  });

  test('record already approved by same user', async () => {
    jest.mocked(createOctokitClientByToken).mockReturnValue({} as any);
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

    const approver: CommitRecordApprover = {
      approver: {
        provider: userSessionData.provider,
        name: userSessionData.name,
      },
      approveDate: new Date().toISOString(),
    };

    await addApproverToCommitRecord(project.id, record.id, approver);

    const response = await injectAuthorizedRequest(
      {
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records/${record.id}/approve`,
        payload: {},
      },
      userSessionData
    );

    expect(response.statusCode).toEqual(409);

    const responseJson = response.json();
    expect(responseJson.message).toEqual('you already approved this record');
  });

  test('GitHub app is not installed for this repo', async () => {
    jest.mocked(createOctokitClientByToken).mockReturnValue({} as any);
    jest.mocked(createOctokitClientByRepo).mockResolvedValue(undefined);
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

    const response = await injectAuthorizedRequest(
      {
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records/${record.id}/approve`,
        payload: {},
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
    const mockedIsUserHasWritePermissionToRepo = jest.mocked(isUserHasWritePermissionToRepo).mockResolvedValue(true);
    const mockedGithubApproveOutputs = jest.mocked(githubApproveOutputs).mockResolvedValue();

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

    const githubOutputs: CommitRecordGitHubOutputs = {
      owner: generateRandomString(),
      repo: generateRandomString(),
      outputs: {
        commitStatus: generateRandomInt(10000000, 99999999),
      },
    };

    await setCommitRecordGithubOutputs(project.id, record.id, githubOutputs);

    const response = await injectAuthorizedRequest(
      {
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records/${record.id}/approve`,
        payload: {},
      },
      userSessionData
    );

    expect(response.statusCode).toEqual(200);

    const responseJson = response.json<BaseCommitRecordResponse>();
    expect(responseJson.record.approvers).toEqual([
      {
        approver: {
          provider: userSessionData.provider,
          name: userSessionData.name,
        },
        approveDate: expect.any(String),
      },
    ]);

    expect(mockedCreateOctokitClientByToken).toHaveBeenCalledWith(userSessionData.auth.token);
    expect(mockedIsUserHasWritePermissionToRepo).toHaveBeenCalledWith(
      expect.any(Object),
      githubOutputs.owner,
      githubOutputs.repo
    );
    expect(mockedCreateOctokitClientByRepo).toHaveBeenCalledWith(githubOutputs.owner, githubOutputs.repo);
    expect(mockedGithubApproveOutputs).toHaveBeenCalledTimes(1);
  });

  test('success with existing approver', async () => {
    const mockedCreateOctokitClientByToken = jest.mocked(createOctokitClientByToken).mockReturnValue({} as any);
    const mockedCreateOctokitClientByRepo = jest.mocked(createOctokitClientByRepo).mockResolvedValue({} as any);
    const mockedIsUserHasWritePermissionToRepo = jest.mocked(isUserHasWritePermissionToRepo).mockResolvedValue(true);
    const mockedGithubApproveOutputs = jest.mocked(githubApproveOutputs).mockResolvedValue();

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

    const githubOutputs: CommitRecordGitHubOutputs = {
      owner: generateRandomString(),
      repo: generateRandomString(),
      outputs: {
        commitStatus: generateRandomInt(10000000, 99999999),
      },
    };

    await setCommitRecordGithubOutputs(project.id, record.id, githubOutputs);

    const approver: CommitRecordApprover = {
      approver: {
        provider: 'github',
        name: generateRandomString(),
      },
      approveDate: new Date().toISOString(),
    };

    await addApproverToCommitRecord(project.id, record.id, approver);

    const response = await injectAuthorizedRequest(
      {
        method: 'POST',
        url: `/v1/projects/${project.id}/commit-records/${record.id}/approve`,
        payload: {},
      },
      userSessionData
    );

    expect(response.statusCode).toEqual(200);

    const responseJson = response.json<BaseCommitRecordResponse>();
    expect(responseJson.record.approvers).toEqual([
      {
        approver: {
          provider: approver.approver.provider,
          name: approver.approver.name,
        },
        approveDate: approver.approveDate,
      },
      {
        approver: {
          provider: userSessionData.provider,
          name: userSessionData.name,
        },
        approveDate: expect.any(String),
      },
    ]);

    expect(mockedCreateOctokitClientByToken).toHaveBeenCalledWith(userSessionData.auth.token);
    expect(mockedIsUserHasWritePermissionToRepo).toHaveBeenCalledWith(
      expect.any(Object),
      githubOutputs.owner,
      githubOutputs.repo
    );
    expect(mockedCreateOctokitClientByRepo).toHaveBeenCalledWith(githubOutputs.owner, githubOutputs.repo);
    expect(mockedGithubApproveOutputs).toHaveBeenCalledTimes(1);
  });
});
