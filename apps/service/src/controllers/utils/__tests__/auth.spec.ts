import { checkAuth } from '../auth';
import { getProject } from '../../../framework/mongo/projects';
import { verifyHash } from '../../../utils/hashUtils';
import { CreateCommitRecordAuthType } from '../../../consts/commitRecords';

import type { FastifyBaseLogger } from 'fastify';

jest.mock('../../../framework/mongo/projects');
jest.mock('../../../framework/github');
jest.mock('../../../utils/hashUtils');

const log = { warn: jest.fn(), info: jest.fn() } as unknown as FastifyBaseLogger;

// the cache is module level, each test uses its own project id
let testCounter = 0;

const mockProject = (hash = 'salt:hash') => {
  const id = `project-${++testCounter}`;

  jest.mocked(getProject).mockResolvedValue({ id, apiKey: { hash } } as any);

  return id;
};

const auth = (projectId: string, token: string) =>
  checkAuth(projectId, { authType: CreateCommitRecordAuthType.ProjectApiKey, token }, undefined, log);

describe('checkAuth - API key', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('same key twice runs verifyHash once', async () => {
    const projectId = mockProject();
    jest.mocked(verifyHash).mockResolvedValue(true);

    expect(await auth(projectId, 'key')).toEqual({ authenticated: true });
    expect(await auth(projectId, 'key')).toEqual({ authenticated: true });

    expect(verifyHash).toHaveBeenCalledTimes(1);
  });

  test('wrong key is never cached', async () => {
    const projectId = mockProject();
    jest.mocked(verifyHash).mockResolvedValue(false);

    expect(await auth(projectId, 'wrong-key')).toEqual({ authenticated: false, error: 'forbidden' });
    expect(await auth(projectId, 'wrong-key')).toEqual({ authenticated: false, error: 'forbidden' });

    expect(verifyHash).toHaveBeenCalledTimes(2);
  });

  test('a cached key does not authenticate a different key', async () => {
    const projectId = mockProject();
    jest.mocked(verifyHash).mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    expect(await auth(projectId, 'key')).toEqual({ authenticated: true });
    expect(await auth(projectId, 'other-key')).toEqual({ authenticated: false, error: 'forbidden' });
  });

  test('a cached key does not authenticate another project', async () => {
    const projectId1 = mockProject();
    jest.mocked(verifyHash).mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    expect(await auth(projectId1, 'key')).toEqual({ authenticated: true });

    const projectId2 = mockProject();
    expect(await auth(projectId2, 'key')).toEqual({ authenticated: false, error: 'forbidden' });
  });

  test('rotated API key (new stored hash) invalidates the cached key', async () => {
    const projectId = mockProject('salt:old-hash');
    jest.mocked(verifyHash).mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    expect(await auth(projectId, 'old-key')).toEqual({ authenticated: true });

    jest.mocked(getProject).mockResolvedValue({ id: projectId, apiKey: { hash: 'salt:new-hash' } } as any);

    expect(await auth(projectId, 'old-key')).toEqual({ authenticated: false, error: 'forbidden' });
    expect(verifyHash).toHaveBeenCalledTimes(2);
  });
});
