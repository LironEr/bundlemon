import { createOctokitClientByAction, createOctokitClientByRepo, getInstallationId } from '../github';

import type { FastifyBaseLogger } from 'fastify';

const mockGetRepoInstallation = jest.fn();
const mockGetWorkflowRun = jest.fn();
let mockOctokitCreatedCount = 0;

jest.mock('../env', () => ({
  githubAppId: '1',
  githubAppPrivateKey: 'private-key',
  githubAppClientId: 'client-id',
  githubAppClientSecret: 'client-secret',
}));
jest.mock('../mongo/commitRecords', () => ({}));
jest.mock('@octokit/auth-app', () => ({ createAppAuth: jest.fn(), createOAuthUserAuth: jest.fn() }));
jest.mock('@octokit/rest', () => ({
  Octokit: class {
    id = ++mockOctokitCreatedCount;
    apps = { getRepoInstallation: mockGetRepoInstallation };
    actions = { getWorkflowRun: mockGetWorkflowRun };
  },
}));

const log = { info: jest.fn(), warn: jest.fn() } as unknown as FastifyBaseLogger;

// the caches are module level, each test uses its own repo / run id
let testCounter = 0;
const uniqueRepo = () => ({ owner: 'owner', repo: `repo-${++testCounter}` });

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('github caches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstallationId', () => {
    test('parallel calls trigger one fetch', async () => {
      const { owner, repo } = uniqueRepo();
      mockGetRepoInstallation.mockResolvedValue({ data: { id: 123 } });

      const results = await Promise.all([
        getInstallationId(owner, repo),
        getInstallationId(owner, repo),
        getInstallationId(owner, repo),
      ]);

      expect(results).toEqual([123, 123, 123]);
      expect(mockGetRepoInstallation).toHaveBeenCalledTimes(1);

      // cached for later calls
      expect(await getInstallationId(owner, repo)).toBe(123);
      expect(mockGetRepoInstallation).toHaveBeenCalledTimes(1);
    });

    test('cache key is case insensitive', async () => {
      const { owner, repo } = uniqueRepo();
      mockGetRepoInstallation.mockResolvedValue({ data: { id: 123 } });

      await getInstallationId(owner, repo);
      await getInstallationId(owner.toUpperCase(), repo.toUpperCase());

      expect(mockGetRepoInstallation).toHaveBeenCalledTimes(1);
    });

    test('undefined (app not installed) is not cached', async () => {
      const { owner, repo } = uniqueRepo();
      mockGetRepoInstallation.mockRejectedValueOnce({ status: 404 });

      expect(await getInstallationId(owner, repo)).toBeUndefined();

      mockGetRepoInstallation.mockResolvedValueOnce({ data: { id: 456 } });

      expect(await getInstallationId(owner, repo)).toBe(456);
      expect(mockGetRepoInstallation).toHaveBeenCalledTimes(2);
    });

    test('errors are not cached', async () => {
      const { owner, repo } = uniqueRepo();
      mockGetRepoInstallation.mockRejectedValueOnce({ status: 500 });

      await expect(getInstallationId(owner, repo)).rejects.toEqual({ status: 500 });

      mockGetRepoInstallation.mockResolvedValueOnce({ data: { id: 789 } });

      expect(await getInstallationId(owner, repo)).toBe(789);
      expect(mockGetRepoInstallation).toHaveBeenCalledTimes(2);
    });

    test('cleanup of an expired entry does not delete a newer entry', async () => {
      jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });

      try {
        const { owner, repo } = uniqueRepo();

        let rejectFirst: (err: unknown) => void = () => {};
        mockGetRepoInstallation.mockReturnValueOnce(new Promise((_, reject) => (rejectFirst = reject)));

        const first = getInstallationId(owner, repo).catch(() => undefined);

        // the first entry expires while still in flight, a newer one replaces it
        jest.advanceTimersByTime(60 * 60 * 1000 + 1);
        mockGetRepoInstallation.mockResolvedValueOnce({ data: { id: 1000 } });
        expect(await getInstallationId(owner, repo)).toBe(1000);

        rejectFirst({ status: 500 });
        await first;
        await flushPromises();

        // the newer entry is still cached
        expect(await getInstallationId(owner, repo)).toBe(1000);
        expect(mockGetRepoInstallation).toHaveBeenCalledTimes(2);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('createOctokitClientByRepo', () => {
    test('reuses the client of the same installation', async () => {
      const first = uniqueRepo();
      const second = uniqueRepo();
      mockGetRepoInstallation.mockResolvedValue({ data: { id: 2000 + testCounter } });

      const client1 = await createOctokitClientByRepo(first.owner, first.repo);
      const client2 = await createOctokitClientByRepo(first.owner, first.repo);

      expect(client1).toBe(client2);

      // another repo with a different installation gets its own client
      mockGetRepoInstallation.mockResolvedValue({ data: { id: 3000 + testCounter } });
      expect(await createOctokitClientByRepo(second.owner, second.repo)).not.toBe(client1);
    });
  });

  describe('createOctokitClientByAction', () => {
    test('successful authentication is cached, parallel calls trigger one request', async () => {
      const { owner, repo } = uniqueRepo();
      mockGetRepoInstallation.mockResolvedValue({ data: { id: 4000 + testCounter } });
      mockGetWorkflowRun.mockResolvedValue({ data: { status: 'in_progress' } });

      const params = { owner, repo, runId: '1' };
      const results = await Promise.all([
        createOctokitClientByAction(params, log),
        createOctokitClientByAction(params, log),
      ]);
      const another = await createOctokitClientByAction(params, log);

      expect(results[0].authenticated).toBe(true);
      expect(results[1]).toBe(results[0]);
      expect(another).toBe(results[0]);
      expect(mockGetWorkflowRun).toHaveBeenCalledTimes(1);
    });

    test('failed authentication is not cached', async () => {
      const { owner, repo } = uniqueRepo();
      mockGetRepoInstallation.mockResolvedValue({ data: { id: 5000 + testCounter } });
      mockGetWorkflowRun.mockResolvedValueOnce({ data: { status: 'completed' } });

      const params = { owner, repo, runId: '2' };

      expect((await createOctokitClientByAction(params, log)).authenticated).toBe(false);

      mockGetWorkflowRun.mockResolvedValueOnce({ data: { status: 'in_progress' } });

      expect((await createOctokitClientByAction(params, log)).authenticated).toBe(true);
      expect(mockGetWorkflowRun).toHaveBeenCalledTimes(2);
    });

    test('stale installation id is evicted on error', async () => {
      const { owner, repo } = uniqueRepo();
      const staleInstallationId = 6000 + testCounter;

      mockGetRepoInstallation.mockResolvedValueOnce({ data: { id: staleInstallationId } });
      mockGetWorkflowRun.mockRejectedValueOnce({ status: 404 });

      const result = await createOctokitClientByAction({ owner, repo, runId: '3' }, log);

      expect(result).toMatchObject({ authenticated: false });

      // the app was reinstalled, the next request looks up the new installation id
      mockGetRepoInstallation.mockResolvedValueOnce({ data: { id: staleInstallationId + 1 } });
      mockGetWorkflowRun.mockResolvedValueOnce({ data: { status: 'queued' } });

      const retry = await createOctokitClientByAction({ owner, repo, runId: '4' }, log);

      expect(retry.authenticated).toBe(true);
      expect(mockGetRepoInstallation).toHaveBeenCalledTimes(2);
      expect(await getInstallationId(owner, repo)).toBe(staleInstallationId + 1);
    });
  });
});
