import type { FastifyBaseLogger } from 'fastify';
import type { TaskId } from '@/consts/tasks';

// All tasks get the same input and return the same output
export interface TaskContext {
  // when true, the task only reports what it would do, without changing anything
  dryRun: boolean;
  // aborted when the task should stop (time limit, server shutdown), the next run continues from where it stopped
  signal: AbortSignal;
  logger: FastifyBaseLogger;
}

export interface TaskResult {
  // false when the task stopped before finishing all the work (e.g. it was aborted)
  completed: boolean;
  // saved in the task run history
  details?: Record<string, unknown>;
}

export interface TaskDefinition {
  id: TaskId;
  // cron expression (UTC), only used by the in-process scheduler (regular server), unset = not scheduled
  schedule?: string;
  run(ctx: TaskContext): Promise<TaskResult>;
}
