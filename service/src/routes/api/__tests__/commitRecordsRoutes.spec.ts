import { ObjectId } from 'mongodb';
import { CommitRecordPayload, Compression, CreateCommitRecordResponse } from 'bundlemon-utils';
import { app } from '@tests/app';
import { createTestProject } from '@tests/projectUtils';
import { generateRandomString } from '@tests/utils';
import { createCommitRecord, getCommitRecordsCollection } from '../../../framework/mongo';

describe('commit records routes', () => {
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
      expect(linkToReport).toEqual('');

      // Validate the record exist in the DB
      const commitRecordsCollection = await getCommitRecordsCollection();
      const recordInDb = await commitRecordsCollection.findOne({ _id: new ObjectId(record.id) });

      expect(recordInDb).toBeDefined();
    });

    describe('with base branch', () => {
      test.each([
        { name: 'base branch has commit records', baseBranch: 'main' },
        { name: 'base branch not found', baseBranch: 'new' },
      ])('$name', async ({ baseBranch }) => {
        const { projectId, apiKey } = await createTestProject();

        await createCommitRecord(projectId, {
          branch: 'main',
          commitSha: generateRandomString(8),
          files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
          groups: [],
        });

        const commitRecord2 = await createCommitRecord(projectId, {
          branch: 'main',
          commitSha: generateRandomString(8),
          files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
          groups: [],
        });

        const payload: CommitRecordPayload = {
          branch: 'test',
          baseBranch,
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
        expect(baseRecord).toEqual(baseBranch === 'main' ? commitRecord2 : undefined);
        expect(linkToReport).toEqual('');

        // Validate the record exist in the DB
        const commitRecordsCollection = await getCommitRecordsCollection();
        const recordInDb = await commitRecordsCollection.findOne({ _id: new ObjectId(record.id) });

        expect(recordInDb).toBeDefined();
      });
    });
  });
});
