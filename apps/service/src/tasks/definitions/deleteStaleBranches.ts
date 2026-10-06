// Delete branches that have not been active (pushed new commit records) for x days.

import { TaskId } from '@/consts/tasks';
import { deleteStaleBranchesSchedule } from '@/framework/env';
import { getCommitRecordsCollection } from '@/framework/mongo/commitRecords';

import type { TaskDefinition } from '../types';

const NO_ACTIVITY_IN_LAST_DAYS = 180;

export const deleteStaleBranchesTask: TaskDefinition = {
  id: TaskId.DeleteStaleBranches,
  schedule: deleteStaleBranchesSchedule,
  run: async ({ dryRun, signal }) => {
    if (signal.aborted) {
      return { completed: false };
    }

    const commitRecordsCollection = await getCommitRecordsCollection();
    const staleBranches = await commitRecordsCollection
      .aggregate<{ projectId: string; branch: string; lastRecordCreationDate: Date; count: number }>(
        [
          {
            $group: {
              _id: {
                projectId: '$projectId',
                branch: '$branch',
              },
              lastRecordCreationDate: {
                $max: '$creationDate',
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
        ],
        { signal }
      )
      .toArray();

    const totalRecords = staleBranches.reduce((sum, staleBranch) => sum + staleBranch.count, 0);

    if (dryRun) {
      return { completed: true, details: { totalRecords, deletedRecords: 0 } };
    }

    let deletedRecords = 0;

    for (const staleBranch of staleBranches) {
      if (signal.aborted) {
        return { completed: false, details: { totalRecords, deletedRecords } };
      }

      const result = await commitRecordsCollection.deleteMany({
        projectId: staleBranch.projectId,
        branch: staleBranch.branch,
      });

      deletedRecords += result.deletedCount;
    }

    return { completed: true, details: { totalRecords, deletedRecords } };
  },
};
