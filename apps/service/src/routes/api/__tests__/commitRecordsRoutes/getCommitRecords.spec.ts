import { URLSearchParams } from 'url';
import { Compression, CommitRecord } from 'bundlemon-utils';
import { createTestApp } from '@tests/app';
import { createTestProjectWithApiKey } from '@tests/projectUtils';
import { generateRandomString } from '@tests/utils';
import { createCommitRecord } from '@/framework/mongo/commitRecords';
import { FastifyInstance } from 'fastify';

describe('get commit records', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('without branch', async () => {
    const { projectId } = await createTestProjectWithApiKey();

    const response = await app.inject({
      method: 'GET',
      url: `/v1/projects/${projectId}/commit-records`,
    });

    expect(response.statusCode).toEqual(400);
  });

  test('no records', async () => {
    const { projectId } = await createTestProjectWithApiKey();

    const branch = 'main';

    await createCommitRecord(projectId, {
      branch: 'other',
      commitSha: generateRandomString(8),
      files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
      groups: [],
    });

    const response = await app.inject({
      method: 'GET',
      url: `/v1/projects/${projectId}/commit-records?branch=${branch}`,
    });

    expect(response.statusCode).toEqual(200);

    const records = response.json<CommitRecord[]>();

    expect(records).toHaveLength(0);
  });

  test.each([{ name: 'without sub project' }, { name: 'with sub project', subProject: 'website2' }])(
    'with records, $name',
    async ({ subProject }) => {
      const { projectId } = await createTestProjectWithApiKey();

      const branch = 'main';

      await createCommitRecord(projectId, {
        subProject: 'other-sub-project',
        branch,
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
        groups: [],
      });

      await createCommitRecord(projectId, {
        subProject,
        branch: 'other',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
        groups: [],
      });

      const record1 = await createCommitRecord(projectId, {
        subProject,
        branch,
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
        groups: [],
      });

      const record2 = await createCommitRecord(projectId, {
        subProject,
        branch,
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 150, compression: Compression.None }],
        groups: [],
      });

      if (subProject) {
        // create a record on the same branch but without subProject, shouldn't exist in result
        await createCommitRecord(projectId, {
          branch,
          commitSha: generateRandomString(8),
          files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
          groups: [],
        });
      }

      const query = new URLSearchParams({ branch });

      if (subProject) {
        query.append('subProject', subProject);
      }

      const response = await app.inject({
        method: 'GET',
        url: `/v1/projects/${projectId}/commit-records?${query.toString()}`,
      });

      expect(response.statusCode).toEqual(200);

      const records = response.json<CommitRecord[]>();

      expect(records).toHaveLength(2);
      expect(records).toEqual([record2, record1]);
    }
  );
});
