// Delete branches that have not been active (pushed new commit records) for x days.

import { closeMongoClient } from '@/framework/mongo/client';
import { getCommitRecordsCollection } from '@/framework/mongo/commitRecords';

(async () => {
  try {
    const projectId = '';
    const commitRecordsCollection = await getCommitRecordsCollection();
    const recordsCount = await commitRecordsCollection.countDocuments({ projectId });

    console.log(`Total records to delete: ${recordsCount}`);

    console.log('Are you sure you want to delete all these records? (y/n)');
    const answer = await new Promise<string>((resolve) => {
      process.stdin.on('data', (data) => {
        resolve(data.toString().trim());
      });
    });

    if (answer !== 'y') {
      console.log('Abort');
      process.exit(0);
    }

    console.log('Deleting records...');

    const result = await commitRecordsCollection.deleteMany({
      projectId,
    });

    console.log(`Deleted records: ${result.deletedCount}`);

    process.exit(0);
  } finally {
    await closeMongoClient();
  }
})();
