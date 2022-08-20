import { generateRandomString } from '@tests/utils';
import { CommitRecordPayload, Compression } from 'bundlemon-utils';
import { createCommitRecord } from '../commitRecords';

describe('mongo commit records', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createCommitRecord', () => {
    test('without commit message', async () => {
      const projectId = generateRandomString(8);

      const record: CommitRecordPayload = {
        branch: 'other',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
        groups: [],
      };
      const actual = await createCommitRecord(projectId, record);

      expect(actual).toEqual({
        projectId,
        id: actual.id,
        creationDate: actual.creationDate,
        ...record,
      });
    });

    test('with commit message lower than limit', async () => {
      const projectId = generateRandomString(8);

      const record: CommitRecordPayload = {
        branch: 'other',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
        groups: [],
        commitMsg: 'commit message',
      };
      const actual = await createCommitRecord(projectId, record);

      expect(actual).toEqual({
        projectId,
        id: actual.id,
        creationDate: actual.creationDate,
        ...record,
      });
    });

    test('with commit message higher than limit', async () => {
      const projectId = generateRandomString(8);

      const msg = generateRandomString(72);

      const record: CommitRecordPayload = {
        branch: 'other',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
        groups: [],
        commitMsg: msg.concat('abcdef'),
      };
      const actual = await createCommitRecord(projectId, record);

      expect(actual).toEqual({
        projectId,
        id: actual.id,
        creationDate: actual.creationDate,
        ...record,
        commitMsg: msg.concat('...'),
      });
    });

    test('update current record by commit sha', async () => {
      const projectId = generateRandomString(8);

      const record: CommitRecordPayload = {
        branch: 'other',
        commitSha: generateRandomString(8),
        files: [{ path: 'file.js', pattern: '*.js', size: 100, compression: Compression.None }],
        groups: [],
      };
      const actual = await createCommitRecord(projectId, record);

      expect(actual).toEqual({
        projectId,
        id: actual.id,
        creationDate: actual.creationDate,
        ...record,
      });

      record.files = [{ path: 'file.js', pattern: '*.js', size: 150, compression: Compression.None }];

      const actual2 = await createCommitRecord(projectId, record);

      expect(actual2).toEqual({
        projectId,
        id: actual.id, // should be the same as the original record
        creationDate: actual2.creationDate, // should have the new record date
        ...record,
      });
    });
  });
});
