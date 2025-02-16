import { FastifyBaseLogger } from 'fastify';
import { getDB } from './client';
import { getCommitRecordsCollection } from './commitRecords';

export async function initDb(logger: FastifyBaseLogger) {
  logger.info('Initializing DB indexes');
  const db = await getDB();

  await db.admin().ping({ maxTimeMS: 5000 });

  const commitRecordCol = await getCommitRecordsCollection();

  commitRecordCol.createIndex({ projectId: 1, subProject: 1, branch: 1, creationDate: -1 });

  // TTL index - remove commit records on PRs after 30 days
  commitRecordCol.createIndex(
    { creationDate: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 30, partialFilterExpression: { prNumber: { $exists: true } } }
  );

  logger.info('DB indexes initialized');
}
