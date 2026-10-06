import { MongoServerError, ObjectId, ReturnDocument } from 'mongodb';
import { TASK_LEASE_MS, TASK_MAX_ATTEMPTS, TASK_RETRY_BACKOFF_MS, TaskId } from '@/consts/tasks';
import { getCollection } from './client';

export enum TaskTrigger {
  ServerScheduler = 'server-scheduler',
  VercelCron = 'vercel-cron',
}

export enum TaskRunStatus {
  Running = 'running',
  Succeeded = 'succeeded',
  // stopped before all the work was done (the task reported it is not completed), the next run continues
  Partial = 'partial',
  Failed = 'failed',
  // did not finish within the task time limit
  Timeout = 'timeout',
  // the server is shutting down. The task is retried, by the next instance right away, without the back-off delay
  // that failed / partial / timeout runs have
  Aborted = 'aborted',
}

export type FinishedTaskRunStatus = Exclude<TaskRunStatus, TaskRunStatus.Running>;

// one document per task, holds the lease (who is running the task) and when it last succeeded
export interface TaskStateDB {
  _id: TaskId;
  lastSuccessAt?: Date;
  leaseOwner?: string;
  leaseUntil?: Date;
  nextAttemptAt?: Date;
  // attempts so far for the scheduled time `attemptOccurrence`, a new scheduled time starts from 0
  attemptOccurrence?: Date;
  attempts?: number;
}

export interface TaskRunMetadata {
  error?: string;
  [key: string]: unknown;
}

// history, one document per run
export interface TaskRunDB {
  taskId: TaskId;
  status: TaskRunStatus;
  trigger: TaskTrigger;
  instanceId: string;
  startedAt: Date;
  finishedAt?: Date;
  metadata?: TaskRunMetadata;
}

export const getTaskStateCollection = () => getCollection<TaskStateDB>('taskState');
export const getTaskRunsCollection = () => getCollection<TaskRunDB>('taskRuns');

const DUPLICATE_KEY_ERROR_CODE = 11000;

/**
 * Atomically claims the task for this instance, only one caller can win
 * (multiple instances, restarts, duplicate requests).
 *
 * The claim is a single `findOneAndUpdate` that matches, and takes the lease, only when ALL of these are true:
 *  1. The task is due: it never succeeded, or its last success is older than `lastOccurrence`
 *     (the most recent time its schedule says it should have run).
 *  2. Nobody is running it: no lease, or the lease expired (the previous owner crashed or hung).
 *  3. It is not backing off: no `nextAttemptAt`, or it has passed
 *     (a failed / partial / timed out run waits before it is retried).
 *  4. It has attempts left: fewer than TASK_MAX_ATTEMPTS attempts were made for this `lastOccurrence`
 *     (the counter starts over for a new `lastOccurrence`).
 *
 * `upsert` creates the state document on the first claim of a task. When the document already exists but the
 * filter doesn't match (not due / leased / backing off / out of attempts), the upsert tries to insert a second document with the same
 * `_id` and fails with a duplicate key error, that is the "not claimed" result.
 */
export const tryClaimTask = async (taskId: TaskId, lastOccurrence: Date, instanceId: string): Promise<boolean> => {
  const col = await getTaskStateCollection();
  const now = new Date();

  try {
    await col.findOneAndUpdate(
      {
        _id: taskId,
        $and: [
          // 1. due
          { $or: [{ lastSuccessAt: { $exists: false } }, { lastSuccessAt: { $lt: lastOccurrence } }] },
          // 2. nobody is running it (or the lease expired)
          { $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lt: now } }] },
          // 3. not backing off after a failed / partial / timeout run
          { $or: [{ nextAttemptAt: { $exists: false } }, { nextAttemptAt: { $lte: now } }] },
          // 4. has attempts left for this occurrence ($ne also matches a missing field, i.e. no attempts yet)
          { $or: [{ attemptOccurrence: { $ne: lastOccurrence } }, { attempts: { $lt: TASK_MAX_ATTEMPTS } }] },
        ],
      },
      // an update pipeline, to count the attempt of this `lastOccurrence` in the same atomic operation
      [
        {
          $set: {
            leaseOwner: instanceId,
            leaseUntil: new Date(now.getTime() + TASK_LEASE_MS),
            attempts: {
              $cond: [{ $eq: ['$attemptOccurrence', lastOccurrence] }, { $add: [{ $ifNull: ['$attempts', 0] }, 1] }, 1],
            },
            attemptOccurrence: lastOccurrence,
          },
        },
      ],
      { upsert: true, returnDocument: ReturnDocument.AFTER }
    );

    return true;
  } catch (err) {
    if (err instanceof MongoServerError && err.code === DUPLICATE_KEY_ERROR_CODE) {
      return false;
    }

    throw err;
  }
};

export const createTaskRun = async (
  taskId: TaskId,
  trigger: TaskTrigger,
  instanceId: string,
  startedAt: Date
): Promise<ObjectId> => {
  const col = await getTaskRunsCollection();
  const { insertedId } = await col.insertOne({
    taskId,
    status: TaskRunStatus.Running,
    trigger,
    instanceId,
    startedAt,
  });

  return insertedId;
};

interface FinishTaskRunParams {
  runId: ObjectId;
  taskId: TaskId;
  instanceId: string;
  startedAt: Date;
  status: FinishedTaskRunStatus;
  metadata: TaskRunMetadata;
}

export const finishTaskRun = async ({
  runId,
  taskId,
  instanceId,
  startedAt,
  status,
  metadata,
}: FinishTaskRunParams) => {
  const now = new Date();

  const runsCol = await getTaskRunsCollection();
  await runsCol.updateOne({ _id: runId }, { $set: { status, finishedAt: now, metadata } });

  // release the lease, only if we still own it (it might have expired and been taken by another instance)
  const stateCol = await getTaskStateCollection();
  const release = { leaseOwner: '', leaseUntil: '' } as const;

  switch (status) {
    case TaskRunStatus.Succeeded:
      await stateCol.updateOne(
        { _id: taskId, leaseOwner: instanceId },
        {
          $set: { lastSuccessAt: startedAt },
          $unset: { ...release, nextAttemptAt: '', attempts: '', attemptOccurrence: '' },
        }
      );
      break;
    case TaskRunStatus.Aborted:
      // not a failure: no back-off, and the attempt doesn't count
      await stateCol.updateOne({ _id: taskId, leaseOwner: instanceId }, { $unset: release, $inc: { attempts: -1 } });
      break;
    default:
      // failed / partial / timeout, back-off before the next attempt
      await stateCol.updateOne(
        { _id: taskId, leaseOwner: instanceId },
        { $set: { nextAttemptAt: new Date(now.getTime() + TASK_RETRY_BACKOFF_MS) }, $unset: release }
      );
  }
};
