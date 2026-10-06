import { FastifyBaseLogger } from 'fastify';
import { getDB } from './client';
import { getCommitRecordsCollection } from './commitRecords';
import { ensureTtlIndex } from './indexes';
import { getTaskRunsCollection } from './tasks';

export async function initDb(logger: FastifyBaseLogger) {
  logger.info('Initializing DB indexes');
  const db = await getDB();

  await db.admin().ping({ maxTimeMS: 5000 });

  const commitRecordCol = await getCommitRecordsCollection();

  await commitRecordCol.createIndex({ projectId: 1, subProject: 1, branch: 1, creationDate: -1 });

  // TTL index - remove commit records on PRs after 14 days
  await ensureTtlIndex(
    commitRecordCol,
    { creationDate: 1 },
    {
      background: true,
      expireAfterSeconds: 60 * 60 * 24 * 14,
      partialFilterExpression: { prNumber: { $exists: true } },
    }
  );

  // tasks run history, keep for a year
  const taskRunsCol = await getTaskRunsCollection();
  await taskRunsCol.createIndex({ taskId: 1, startedAt: -1 }, { background: true });
  await ensureTtlIndex(taskRunsCol, { startedAt: 1 }, { background: true, expireAfterSeconds: 60 * 60 * 24 * 365 });

  logger.info('DB indexes initialized');
}
