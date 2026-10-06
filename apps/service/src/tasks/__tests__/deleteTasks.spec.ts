import pino from 'pino';
import { generateProjectId } from '@tests/projectUtils';
import { generateRandomString } from '@tests/utils';
import { getCommitRecordsCollection } from '@/framework/mongo/commitRecords';
import { deleteOldRecordsTask } from '../definitions/deleteOldRecords';
import { deleteStaleBranchesTask } from '../definitions/deleteStaleBranches';

import type { TaskContext } from '../types';

const logger = pino({ level: 'silent' });

// a task context that is not aborted, and changes data
const createContext = (overrides: Partial<TaskContext> = {}): TaskContext => ({
  dryRun: false,
  signal: new AbortController().signal,
  logger,
  ...overrides,
});

const daysAgo = (days: number, hour = 12) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 0, 0, 0);

  return date;
};

async function insertRecord(projectId: string, branch: string, creationDate: Date) {
  const col = await getCommitRecordsCollection();
  const { insertedId } = await col.insertOne({ projectId, branch, commitSha: generateRandomString(8), creationDate });

  return insertedId;
}

async function countRecords(projectId: string, branch?: string) {
  const col = await getCommitRecordsCollection();

  return col.countDocuments({ projectId, ...(branch ? { branch } : {}) });
}

describe('delete tasks', () => {
  describe('deleteOldRecords', () => {
    test('keeps the latest record of every day older than the limit, and all the recent records', async () => {
      const projectId = generateProjectId();

      // same old day, the latest (hour 18) is kept
      await insertRecord(projectId, 'main', daysAgo(120, 8));
      await insertRecord(projectId, 'main', daysAgo(120, 10));
      const latestOfDay = await insertRecord(projectId, 'main', daysAgo(120, 18));
      // another old day with a single record
      await insertRecord(projectId, 'main', daysAgo(121));
      // same old day on another branch
      await insertRecord(projectId, 'other', daysAgo(120, 9));
      await insertRecord(projectId, 'other', daysAgo(120, 11));
      // recent records are not touched
      await insertRecord(projectId, 'main', daysAgo(5, 8));
      await insertRecord(projectId, 'main', daysAgo(5, 9));

      const result = await deleteOldRecordsTask.run(createContext());

      expect(result.completed).toBe(true);
      expect(result.details?.deletedRecords).toBeGreaterThanOrEqual(3);
      // latest of main's old day + main's other old day + latest of other's old day + 2 recent records
      expect(await countRecords(projectId)).toBe(1 + 1 + 1 + 2);

      const col = await getCommitRecordsCollection();
      expect(await col.findOne({ _id: latestOfDay })).not.toBeNull();
    });

    test('dryRun deletes nothing', async () => {
      const projectId = generateProjectId();

      await insertRecord(projectId, 'main', daysAgo(120, 8));
      await insertRecord(projectId, 'main', daysAgo(120, 9));

      const result = await deleteOldRecordsTask.run(createContext({ dryRun: true }));

      expect(result.details?.deletedRecords).toBe(0);
      expect(result.details?.totalRecords).toBeGreaterThanOrEqual(1);
      expect(await countRecords(projectId)).toBe(2);

      await deleteOldRecordsTask.run(createContext());
    });

    test('does nothing when the signal is aborted, and finishes in the next run', async () => {
      const projectId = generateProjectId();

      await insertRecord(projectId, 'main', daysAgo(120, 8));
      await insertRecord(projectId, 'main', daysAgo(120, 9));
      await insertRecord(projectId, 'main', daysAgo(120, 10));

      // e.g. the task reached its time limit
      const aborted = await deleteOldRecordsTask.run(createContext({ signal: AbortSignal.abort() }));

      expect(aborted.completed).toBe(false);
      expect(await countRecords(projectId)).toBe(3);

      await deleteOldRecordsTask.run(createContext());
      expect(await countRecords(projectId)).toBe(1);
    });
  });

  describe('deleteStaleBranches', () => {
    test('deletes only branches without activity for a long time', async () => {
      const projectId = generateProjectId();

      // stale, all its records are old
      await insertRecord(projectId, 'stale', daysAgo(300));
      await insertRecord(projectId, 'stale', daysAgo(250));
      // old records, but the branch has a recent one
      await insertRecord(projectId, 'active', daysAgo(300));
      await insertRecord(projectId, 'active', daysAgo(2));
      // recent
      await insertRecord(projectId, 'new', daysAgo(1));

      const result = await deleteStaleBranchesTask.run(createContext());

      expect(result.completed).toBe(true);
      expect(result.details?.deletedRecords).toBeGreaterThanOrEqual(2);
      expect(await countRecords(projectId, 'stale')).toBe(0);
      expect(await countRecords(projectId, 'active')).toBe(2);
      expect(await countRecords(projectId, 'new')).toBe(1);
    });

    test('does nothing when the signal is aborted', async () => {
      const projectId = generateProjectId();

      await insertRecord(projectId, 'stale', daysAgo(300));

      const aborted = await deleteStaleBranchesTask.run(createContext({ signal: AbortSignal.abort() }));

      expect(aborted.completed).toBe(false);
      expect(await countRecords(projectId)).toBe(1);

      await deleteStaleBranchesTask.run(createContext());
      expect(await countRecords(projectId)).toBe(0);
    });

    test('dryRun deletes nothing', async () => {
      const projectId = generateProjectId();

      await insertRecord(projectId, 'stale', daysAgo(300));

      const result = await deleteStaleBranchesTask.run(createContext({ dryRun: true }));

      expect(result.details?.deletedRecords).toBe(0);
      expect(result.details?.totalRecords).toBeGreaterThanOrEqual(1);
      expect(await countRecords(projectId)).toBe(1);

      await deleteStaleBranchesTask.run(createContext());
    });
  });
});
