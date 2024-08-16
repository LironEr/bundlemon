// Replace branch name for all records for a specific project

import { closeMongoClient } from '@/framework/mongo/client';
import { getCommitRecordsCollection } from '@/framework/mongo/commitRecords';

(async () => {
  try {
    const projectId = '';
    const sourceBranch = '';
    const targetBranch = '';

    console.log(
      `Are you sure you want to replace branch "${sourceBranch}" to "${targetBranch}" for project "${projectId}"? (y/n)`
    );
    const answer = await new Promise<string>((resolve) => {
      process.stdin.on('data', (data) => {
        resolve(data.toString().trim());
      });
    });

    if (answer !== 'y') {
      console.log('Abort');
      process.exit(0);
    }

    console.log('Replacing branch...');

    const commitRecordsCollection = await getCommitRecordsCollection();
    const result = await commitRecordsCollection.updateMany(
      {
        projectId,
        branch: sourceBranch,
      },
      { $set: { branch: targetBranch } }
    );

    console.log(`records updated: ${result.modifiedCount}`);

    process.exit(0);
  } finally {
    await closeMongoClient();
  }
})();
