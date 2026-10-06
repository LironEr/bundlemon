import { getScheduledTasks, runDueTasks } from '../tasks/scheduler';
import { TaskTrigger } from '../framework/mongo/tasks';

import type { FastifyReply, FastifyRequest } from 'fastify';

// Triggered by Vercel Cron, see "crons" in vercel.json
export const runScheduledTasksController = async (req: FastifyRequest, res: FastifyReply) => {
  // same schedules (env vars) as a regular server, the cron only checks which tasks are due.
  // At most one task runs per request, two long tasks one after the other could exceed the function time limit,
  // the next due task runs in the next cron request
  const results = await runDueTasks(getScheduledTasks(), TaskTrigger.VercelCron, req.log, { maxRuns: 1 });

  return res.send({ results });
};
