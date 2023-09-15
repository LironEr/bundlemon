// Keep the latest record per day after AGGREGATE_RECORDS_OLDER_THAN_DAYS days

import { closeMongoClient } from '@/framework/mongo/client';
import { getCommitRecordsCollection } from '@/framework/mongo/commitRecords';
import { ObjectId } from 'mongodb';

const AGGREGATE_RECORDS_OLDER_THAN_DAYS = 90;

(async () => {
  try {
    console.log('Fetch records...');
    const commitRecordsCollection = await getCommitRecordsCollection();
    const agg = await commitRecordsCollection
      .aggregate<{
        projectId: string;
        subProject?: string;
        branch: string;
        aggDate: string;
        idsToDelete: string[];
      }>([
        {
          $sort: {
            creationDate: -1,
          },
        },
        {
          $match: {
            creationDate: {
              $lt: new Date(new Date().setDate(new Date().getDate() - AGGREGATE_RECORDS_OLDER_THAN_DAYS)),
            },
          },
        },
        {
          $group: {
            _id: {
              projectId: '$projectId',
              subProject: '$subProject',
              branch: '$branch',
              aggDate: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$creationDate',
                },
              },
            },
            records: {
              $push: '$_id',
            },
          },
        },
        {
          // check that the records has at least 2 records
          $match: {
            'records.1': {
              $exists: true,
            },
          },
        },
        {
          $project: {
            projectId: '$_id.projectId',
            subProject: '$_id.subProject',
            branch: '$_id.branch',
            aggDate: '$_id.aggDate',
            // the first id is the last record per that period, so we keep it
            idsToDelete: {
              $slice: [
                '$records',
                1,
                {
                  $subtract: [
                    {
                      $size: '$records',
                    },
                    1,
                  ],
                },
              ],
            },
          },
        },
        {
          $unset: '_id',
        },
      ])
      .toArray();

    const idsToDelete = agg.map((x) => x.idsToDelete).flat();

    console.log(`Total records to delete: ${idsToDelete.length}`);

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
      _id: { $in: idsToDelete.map((id) => new ObjectId(id)) },
    });

    console.log(`Deleted records: ${result.deletedCount}`);

    process.exit(0);
  } finally {
    await closeMongoClient();
  }
})();
