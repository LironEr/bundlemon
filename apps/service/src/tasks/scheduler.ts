import { TaskTrigger } from '@/framework/mongo/tasks';
import { runTask } from './runTask';
import { getLastOccurrence, validateCronExpression } from './schedule';
import { tasks as allTasks } from './definitions';

import type { FastifyBaseLogger } from 'fastify';
import type { TaskDefinition } from './types';

export const TICK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Runs the tasks that have a schedule, on a regular (long living) server.
 * Every tick runs each scheduled task that is due, runTask makes sure that only one instance runs it.
 * Does nothing (returns undefined) when no task has a schedule.
 * Returns a function that stops the scheduler: aborts the running task (so the server can shut down quickly,
 * the task continues in the next run) and waits for it to finish.
 */
export function startScheduler(
  logger: FastifyBaseLogger,
  tasks: TaskDefinition[] = allTasks
): (() => Promise<void>) | undefined {
  const scheduledTasks = tasks.filter((task): task is TaskDefinition & { schedule: string } => !!task.schedule);

  if (scheduledTasks.length === 0) {
    return undefined;
  }

  for (const task of scheduledTasks) {
    try {
      validateCronExpression(task.schedule);
    } catch (err) {
      throw new Error(`Invalid schedule "${task.schedule}" for task ${task.id}: ${(err as Error).message}`);
    }

    logger.info({ taskId: task.id, schedule: task.schedule }, 'Task scheduled');
  }

  let currentTick: Promise<void> | undefined;
  const shutdown = new AbortController();

  const tick = async () => {
    for (const task of scheduledTasks) {
      if (shutdown.signal.aborted) {
        return;
      }

      try {
        await runTask(task, getLastOccurrence(task.schedule), TaskTrigger.ServerScheduler, logger, shutdown.signal);
      } catch (err) {
        logger.error({ err, taskId: task.id }, 'Scheduled task failed');
      }
    }
  };

  const runTick = () => {
    // a previous tick is still running (tasks can take up to a few minutes)
    if (!currentTick) {
      currentTick = tick().finally(() => {
        currentTick = undefined;
      });
    }
  };

  const interval = setInterval(runTick, TICK_INTERVAL_MS);
  interval.unref();
  runTick();

  return async () => {
    clearInterval(interval);
    shutdown.abort(new Error('Server is shutting down'));
    await currentTick;
  };
}
