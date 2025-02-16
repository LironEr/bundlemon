import { createTestApp } from '@tests/app';
import { Compression, BaseCommitRecordResponse } from 'bundlemon-utils';
import { createTestProjectWithApiKey } from '@tests/projectUtils';
import { generateRandomString } from '@tests/utils';
import { createCommitRecord } from '@/framework/mongo/commitRecords';
import { BaseRecordCompareTo } from '@/consts/commitRecords';
import { FastifyInstance } from 'fastify';

describe('get commit record with base', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('unknown compareTo', async () => {
    const { projectId } = await createTestProjectWithApiKey();

    const recordInDB = await createCommitRecord(projectId, {
      branch: 'test',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 200, compression: Compression.None }],
      groups: [],
    });

    const response = await app.inject({
      method: 'GET',
      url: `/v1/projects/${projectId}/commit-records/${recordInDB.id}/base?compareTo=other`,
    });

    expect(response.statusCode).toEqual(400);
  });

  test('no records in current branch', async () => {
    const { projectId } = await createTestProjectWithApiKey();

    const response = await app.inject({
      method: 'GET',
      url: `/v1/projects/${projectId}/commit-records/${generateRandomString(24)}/base`,
    });

    expect(response.statusCode).toEqual(404);
  });

  describe('without base branch', () => {
    test('no other records in current branch', async () => {
      const { projectId } = await createTestProjectWithApiKey();

      const recordInDB = await createCommitRecord(projectId, {
        branch: 'test',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 200, compression: Compression.None }],
        groups: [],
      });

      const response = await app.inject({
        method: 'GET',
        url: `/v1/projects/${projectId}/commit-records/${recordInDB.id}/base`,
      });

      expect(response.statusCode).toEqual(200);

      const responseJson = response.json<BaseCommitRecordResponse>();
      const { record, baseRecord } = responseJson;

      expect(record).toEqual(recordInDB);
      expect(baseRecord).toBeUndefined();
    });

    test('without older records in current branch', async () => {
      const { projectId } = await createTestProjectWithApiKey();

      const recordInDB = await createCommitRecord(projectId, {
        branch: 'test',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 200, compression: Compression.None }],
        groups: [],
      });

      await createCommitRecord(projectId, {
        branch: 'test',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 210, compression: Compression.None }],
        groups: [],
      });

      const response = await app.inject({
        method: 'GET',
        url: `/v1/projects/${projectId}/commit-records/${recordInDB.id}/base`,
      });

      expect(response.statusCode).toEqual(200);

      const responseJson = response.json<BaseCommitRecordResponse>();
      const { record, baseRecord } = responseJson;

      expect(record).toEqual(recordInDB);
      expect(baseRecord).toBeUndefined();
    });

    test.each([{ compareTo: BaseRecordCompareTo.LatestCommit }, { compareTo: BaseRecordCompareTo.PreviousCommit }])(
      'with older records in current branch, compareTo: $compareTo',
      async ({ compareTo }) => {
        const { projectId } = await createTestProjectWithApiKey();

        await createCommitRecord(projectId, {
          branch: 'test',
          commitSha: generateRandomString(8),
          files: [{ path: 'file.js', pattern: '*.js', size: 10, compression: Compression.None }],
          groups: [],
        });

        const baseRecordInDB1 = await createCommitRecord(projectId, {
          branch: 'test',
          commitSha: generateRandomString(8),
          files: [{ path: 'file.js', pattern: '*.js', size: 110, compression: Compression.None }],
          groups: [],
        });

        const recordInDB = await createCommitRecord(projectId, {
          branch: 'test',
          commitSha: generateRandomString(8),
          files: [{ path: 'file.js', pattern: '*.js', size: 200, compression: Compression.None }],
          groups: [],
        });

        const baseRecordInDB2 = await createCommitRecord(projectId, {
          branch: 'test',
          commitSha: generateRandomString(8),
          files: [{ path: 'file.js', pattern: '*.js', size: 210, compression: Compression.None }],
          groups: [],
        });

        const response = await app.inject({
          method: 'GET',
          url: `/v1/projects/${projectId}/commit-records/${recordInDB.id}/base?compareTo=${compareTo}`,
        });

        expect(response.statusCode).toEqual(200);

        const responseJson = response.json<BaseCommitRecordResponse>();
        const { record, baseRecord } = responseJson;

        expect(record).toEqual(recordInDB);
        expect(baseRecord).toEqual(
          compareTo === BaseRecordCompareTo.PreviousCommit ? baseRecordInDB1 : baseRecordInDB2
        );
      }
    );
  });

  describe('with base branch (PR)', () => {
    test.each([
      { name: 'base branch has commit records', baseBranch: 'main' },
      {
        name: 'base branch has commit records, get latest base record',
        baseBranch: 'main',
        compareTo: BaseRecordCompareTo.LatestCommit,
      },
      { name: 'base branch not found', baseBranch: 'new' },
      { name: 'base branch not found, with sub project', baseBranch: 'new', subProject: 'website2' },
      { name: 'base branch has commit records, with sub project', baseBranch: 'main', subProject: 'website2' },
    ])('$name', async ({ baseBranch, subProject, compareTo }) => {
      const { projectId } = await createTestProjectWithApiKey();

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

      const baseRecordInDB1 = await createCommitRecord(projectId, {
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

      const recordInDB = await createCommitRecord(projectId, {
        subProject,
        branch: 'test',
        baseBranch,
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 110, compression: Compression.None }],
        groups: [],
      });

      const baseRecordInDB2 = await createCommitRecord(projectId, {
        subProject,
        branch: 'main',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 130, compression: Compression.None }],
        groups: [],
      });

      const response = await app.inject({
        method: 'GET',
        url: `/v1/projects/${projectId}/commit-records/${recordInDB.id}/base${
          compareTo ? `?compareTo=${compareTo}` : ''
        }`,
      });

      expect(response.statusCode).toEqual(200);

      const responseJson = response.json<BaseCommitRecordResponse>();
      const { record, baseRecord } = responseJson;

      expect(record).toEqual(recordInDB);
      expect(baseRecord).toEqual(
        baseBranch === 'main'
          ? compareTo === BaseRecordCompareTo.LatestCommit
            ? baseRecordInDB2
            : baseRecordInDB1
          : undefined
      );
    });
  });
});
