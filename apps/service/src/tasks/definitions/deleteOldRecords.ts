// Keep the latest record per day after AGGREGATE_RECORDS_OLDER_THAN_DAYS days

import { ObjectId } from 'mongodb';
import { TaskId } from '@/consts/tasks';
import { deleteOldRecordsSchedule } from '@/framework/env';
import { getCommitRecordsCollection } from '@/framework/mongo/commitRecords';

import type { TaskDefinition } from '../types';

const AGGREGATE_RECORDS_OLDER_THAN_DAYS = 60;
const DELETE_CHUNK_SIZE = 1000;

export const deleteOldRecordsTask: TaskDefinition = {
  id: TaskId.DeleteOldRecords,
  schedule: deleteOldRecordsSchedule,
  run: async ({ dryRun, signal }) => {
    if (signal.aborted) {
      return { completed: false };
    }

    const commitRecordsCollection = await getCommitRecordsCollection();
    const agg = await commitRecordsCollection
      .aggregate<{
        projectId: string;
        subProject?: string;
        branch: string;
        aggDate: string;
        idsToDelete: ObjectId[];
      }>(
        [
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
        ],
        { signal }
      )
      .toArray();

    const idsToDelete = agg.flatMap((x) => x.idsToDelete);
    const totalRecords = idsToDelete.length;

    if (dryRun) {
      return { completed: true, details: { totalRecords, deletedRecords: 0 } };
    }

    let deletedRecords = 0;

    for (let i = 0; i < idsToDelete.length; i += DELETE_CHUNK_SIZE) {
      if (signal.aborted) {
        return { completed: false, details: { totalRecords, deletedRecords } };
      }

      const result = await commitRecordsCollection.deleteMany({
        _id: { $in: idsToDelete.slice(i, i + DELETE_CHUNK_SIZE) },
      });

      deletedRecords += result.deletedCount;
    }

    return { completed: true, details: { totalRecords, deletedRecords } };
  },
};
