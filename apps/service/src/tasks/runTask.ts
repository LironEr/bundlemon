import { randomUUID } from 'node:crypto';
import { TASK_TIMEOUT_MS } from '@/consts/tasks';
import {
  TaskRunStatus,
  createTaskRun,
  finishTaskRun,
  tryClaimTask,
  type FinishedTaskRunStatus,
  type TaskRunMetadata,
  type TaskTrigger,
} from '@/framework/mongo/tasks';

import type { FastifyBaseLogger } from 'fastify';
import type { TaskDefinition } from './types';

// identifies this process as the owner of a task lease
const instanceId = randomUUID();

export interface RunTaskResult {
  taskId: TaskDefinition['id'];
  ran: boolean;
  status?: FinishedTaskRunStatus;
}

/**
 * Runs the task if it is due: its last success is older than `lastOccurrence`, and no other instance is running it.
 * Safe to call from multiple instances / repeatedly, the claim in mongo decides who runs.
 *
 * The task gets an AbortSignal that aborts after TASK_TIMEOUT_MS, or when `shutdownSignal` aborts (the server is
 * shutting down). The task (and the mongo operations it passes the signal to) must stop when it is aborted.
 */
export async function runTask(
  task: TaskDefinition,
  lastOccurrence: Date,
  trigger: TaskTrigger,
  logger: FastifyBaseLogger,
  shutdownSignal?: AbortSignal
): Promise<RunTaskResult> {
  const claimed = await tryClaimTask(task.id, lastOccurrence, instanceId);

  if (!claimed) {
    return { taskId: task.id, ran: false };
  }

  const startedAt = new Date();
  const runId = await createTaskRun(task.id, trigger, instanceId, startedAt);
  const log = logger.child({ taskId: task.id });
  // aborts after the time limit, or when the server shuts down
  const signal = shutdownSignal
    ? AbortSignal.any([AbortSignal.timeout(TASK_TIMEOUT_MS), shutdownSignal])
    : AbortSignal.timeout(TASK_TIMEOUT_MS);

  let status: FinishedTaskRunStatus;
  let metadata: TaskRunMetadata;

  log.info({ trigger }, 'Task started');

  try {
    const result = await task.run({ dryRun: false, signal, logger: log });

    if (result.completed) {
      status = TaskRunStatus.Succeeded;
    } else {
      status = shutdownSignal?.aborted ? TaskRunStatus.Aborted : TaskRunStatus.Partial;
    }

    metadata = { ...result.details };
  } catch (err) {
    metadata = { error: err instanceof Error ? err.message : String(err) };

    if (shutdownSignal?.aborted) {
      status = TaskRunStatus.Aborted;
    } else if (signal.aborted) {
      status = TaskRunStatus.Timeout;
      metadata = { error: `Task did not finish in ${TASK_TIMEOUT_MS / 1000} seconds` };
    } else {
      status = TaskRunStatus.Failed;
    }
  }

  if (status === TaskRunStatus.Succeeded || status === TaskRunStatus.Aborted) {
    log.info({ status, metadata }, 'Task finished');
  } else {
    log.error({ status, metadata }, 'Task did not succeed');
  }

  await finishTaskRun({ runId, taskId: task.id, instanceId, startedAt, status, metadata });

  return { taskId: task.id, ran: true, status };
}
