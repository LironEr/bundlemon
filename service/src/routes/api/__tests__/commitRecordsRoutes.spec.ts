import { ObjectId } from 'mongodb';
import { URLSearchParams } from 'url';
import { CommitRecordPayload, Compression, CreateCommitRecordResponse, CommitRecord } from 'bundlemon-utils';
import { app } from '@tests/app';
import { createTestProject } from '@tests/projectUtils';
import { generateRandomString } from '@tests/utils';
import { createCommitRecord, getCommitRecordsCollection } from '../../../framework/mongo';
import { generateLinkToReport } from '../../../utils/linkUtils';

describe('commit records routes', () => {
  describe('get commit records', () => {
    test('without branch', async () => {
      const { projectId } = await createTestProject();

      const response = await app.inject({
        method: 'GET',
        url: `/v1/projects/${projectId}/commit-records`,
      });

      expect(response.statusCode).toEqual(400);
    });

    test('no records', async () => {
      const { projectId } = await createTestProject();

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
        const { projectId } = await createTestProject();

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

  describe('create commit record', () => {
    test('not authenticated', async () => {
      const { projectId } = await createTestProject();

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

    test('without base branch', async () => {
      const { projectId, apiKey } = await createTestProject();

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
    });

    describe('with base branch', () => {
      test.each([
        { name: 'base branch has commit records', baseBranch: 'main' },
        { name: 'base branch not found', baseBranch: 'new' },
        { name: 'base branch not found, with sub project', baseBranch: 'new', subProject: 'website2' },
        { name: 'base branch has commit records, with sub project', baseBranch: 'main', subProject: 'website2' },
      ])('$name', async ({ baseBranch, subProject }) => {
        const { projectId, apiKey } = await createTestProject();

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
      });
    });
  });
});
