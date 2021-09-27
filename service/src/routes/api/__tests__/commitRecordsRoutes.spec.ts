import { ObjectId } from 'mongodb';
import { CommitRecordPayload, Compression, CreateCommitRecordResponse } from 'bundlemon-utils';
import { app } from '../../../../tests/app';
import { createProjectInDB } from '../../../../tests/projectUtils';
import { generateRandomString } from '../../../../tests/utils';
import { getCommitRecordsCollection } from '../../../framework/mongo';

describe('commit records routes', () => {
  describe('create commit record', () => {
    test('without base branch', async () => {
      const { projectId, apiKey } = await createProjectInDB();

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
      const { record } = responseJson;

      expect(record).toEqual({
        ...payload,
        projectId,
        id: record.id,
        creationDate: record.creationDate,
      });

      // Validate the record exist in the DB
      const commitRecordsCollection = await getCommitRecordsCollection();
      const recordInDb = await commitRecordsCollection.findOne({ _id: new ObjectId(record.id) });

      expect(recordInDb).toBeDefined();
    });
  });
});
