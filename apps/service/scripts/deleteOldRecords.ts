// Keep the latest record per day after x days
// Manual run with confirmation, the same logic runs automatically as a scheduled task (see src/tasks)

import pino from 'pino';
import { closeMongoClient } from '@/framework/mongo/client';
import { deleteOldRecordsTask } from '@/tasks/definitions/deleteOldRecords';

const logger = pino();
// no time limit, the signal is never aborted
const signal = new AbortController().signal;

(async () => {
  try {
    console.log('Fetch records...');
    const { details: dryRunDetails } = await deleteOldRecordsTask.run({ dryRun: true, signal, logger });

    console.log(`Total records to delete: ${dryRunDetails?.totalRecords}`);

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

    const { details } = await deleteOldRecordsTask.run({ dryRun: false, signal, logger });

    console.log(`Deleted records: ${details?.deletedRecords}`);

    process.exit(0);
  } finally {
    await closeMongoClient();
  }
})();
