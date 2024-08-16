// Delete branches that have not been active (pushed new commit records) for x days.

import { closeMongoClient } from '@/framework/mongo/client';
import { getCommitRecordsCollection } from '@/framework/mongo/commitRecords';

const NO_ACTIVITY_IN_LAST_DAYS = 180;

(async () => {
  try {
    console.log('Fetch stale branches...');
    const commitRecordsCollection = await getCommitRecordsCollection();
    const staleBranches = await commitRecordsCollection
      .aggregate<{ projectId: string; branch: string; lastRecordCreationDate: Date; count: number }>([
        {
          $group: {
            _id: {
              projectId: '$projectId',
              branch: '$branch',
            },
            lastRecordCreationDate: {
              $last: '$creationDate',
            },
            count: {
              $count: {},
            },
          },
        },
        {
          $match: {
            lastRecordCreationDate: {
              $lt: new Date(new Date().setDate(new Date().getDate() - NO_ACTIVITY_IN_LAST_DAYS)),
            },
          },
        },
        {
          $project: {
            projectId: '$_id.projectId',
            branch: '$_id.branch',
            lastRecordCreationDate: '$lastRecordCreationDate',
            count: '$count',
          },
        },
        {
          $unset: '_id',
        },
      ])
      .toArray();

    let totalRecordsToDelete = 0;
    for (const staleBranch of staleBranches) {
      totalRecordsToDelete += staleBranch.count;
    }

    console.log(`Total records to delete: ${totalRecordsToDelete}`);

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

    let deletedRecords = 0;

    for (const staleBranch of staleBranches) {
      const result = await commitRecordsCollection.deleteMany({
        projectId: staleBranch.projectId,
        branch: staleBranch.branch,
      });

      deletedRecords += result.deletedCount;
    }

    console.log(`Deleted records: ${deletedRecords}`);

    process.exit(0);
  } finally {
    await closeMongoClient();
  }
})();
