import { getDB } from '../src/framework/mongo/client';
import { getCommitRecordsCollection } from '../src/framework/mongo/commitRecords';

export async function initDb() {
  const db = await getDB();

  await db.admin().ping({ maxTimeMS: 5000 });

  const commitRecordsCollection = await getCommitRecordsCollection();

  // Create indexes
  await commitRecordsCollection.createIndex({ projectId: 1, subProject: 1, branch: 1, creationDate: -1 });

  // TTL index - remove commit records on PRs after 30 days
  await commitRecordsCollection.createIndex(
    { creationDate: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { prNumber: { $exists: true } } }
  );
}

// If called directly i.e. "node app"
if (require.main === module) {
  (async () => {
    await initDb();
  })();
}
