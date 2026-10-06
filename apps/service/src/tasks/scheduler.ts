import { TaskTrigger } from '@/framework/mongo/tasks';
import { runTask, type RunTaskResult } from './runTask';
import { getLastOccurrence, validateCronExpression } from './schedule';
import { tasks as allTasks } from './definitions';

import type { FastifyBaseLogger } from 'fastify';
import type { TaskDefinition } from './types';

export const TICK_INTERVAL_MS = 5 * 60 * 1000;

export type ScheduledTask = TaskDefinition & { schedule: string };

/** The tasks that have a schedule, throws if a schedule is invalid */
export function getScheduledTasks(tasks: TaskDefinition[] = allTasks): ScheduledTask[] {
  const scheduledTasks = tasks.filter((task): task is ScheduledTask => !!task.schedule);

  for (const task of scheduledTasks) {
    try {
      validateCronExpression(task.schedule);
    } catch (err) {
      throw new Error(`Invalid schedule "${task.schedule}" for task ${task.id}: ${(err as Error).message}`);
    }
  }

  return scheduledTasks;
}

interface RunDueTasksOptions {
  // stop starting tasks when aborted, also passed to the running task
  signal?: AbortSignal;
  // stop after this many tasks ran, so a single request (Vercel) is not timed out by tasks that run one after the other
  maxRuns?: number;
}

/**
 * Runs the due tasks one after the other, runTask makes sure that only one instance runs a task.
 * A task that is not due (or is run by another instance) doesn't count as a run.
 */
export async function runDueTasks(
  tasks: ScheduledTask[],
  trigger: TaskTrigger,
  logger: FastifyBaseLogger,
  { signal, maxRuns = Infinity }: RunDueTasksOptions = {}
): Promise<RunTaskResult[]> {
  const results: RunTaskResult[] = [];
  let runs = 0;

  // the task that has been due the longest (oldest scheduled time) first, so with maxRuns a task isn't starved by
  // tasks that are listed before it
  const dueTasks = tasks
    .map((task) => ({ task, lastOccurrence: getLastOccurrence(task.schedule) }))
    .sort((a, b) => a.lastOccurrence.getTime() - b.lastOccurrence.getTime());

  for (const { task, lastOccurrence } of dueTasks) {
    if (signal?.aborted || runs >= maxRuns) {
      break;
    }

    try {
      const result = await runTask(task, lastOccurrence, trigger, logger, signal);

      results.push(result);

      if (result.ran) {
        runs++;
      }
    } catch (err) {
      logger.error({ err, taskId: task.id }, 'Scheduled task failed');
      // it might have run (e.g. failed to save the result), it could have used most of the time
      runs++;
    }
  }

  return results;
}

/**
 * Runs the tasks that have a schedule, on a regular (long living) server.
 * Every tick runs each scheduled task that is due.
 * Does nothing (returns undefined) when no task has a schedule.
 * Returns a function that stops the scheduler: aborts the running task (so the server can shut down quickly,
 * the task continues in the next run) and waits for it to finish.
 */
export function startScheduler(
  logger: FastifyBaseLogger,
  tasks: TaskDefinition[] = allTasks
): (() => Promise<void>) | undefined {
  const scheduledTasks = getScheduledTasks(tasks);

  if (scheduledTasks.length === 0) {
    return undefined;
  }

  for (const task of scheduledTasks) {
    logger.info({ taskId: task.id, schedule: task.schedule }, 'Task scheduled');
  }

  let currentTick: Promise<void> | undefined;
  const shutdown = new AbortController();

  const runTick = () => {
    // a previous tick is still running (tasks can take up to a few minutes)
    if (!currentTick) {
      currentTick = runDueTasks(scheduledTasks, TaskTrigger.ServerScheduler, logger, { signal: shutdown.signal })
        .then(() => undefined)
        .finally(() => {
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
