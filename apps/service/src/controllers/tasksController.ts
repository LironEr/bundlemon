import { getTask } from '../tasks/definitions';
import { runTask } from '../tasks/runTask';
import { getLastOccurrence } from '../tasks/schedule';
import { TaskTrigger } from '../framework/mongo/tasks';

import type { FastifyValidatedRoute } from '../types/schemas';
import type { RunTaskRequestSchema } from '../types/schemas/tasks';

// Triggered by Vercel Cron, see "crons" in vercel.json
export const runTaskController: FastifyValidatedRoute<RunTaskRequestSchema> = async (req, res) => {
  const task = getTask(req.params.taskId);

  if (!task) {
    return res.status(404).send({ message: `Task ${req.params.taskId} not found` });
  }

  // Vercel sends the cron expression that triggered the request,
  // so a late start (Hobby plan can be up to an hour late) or a duplicate delivery still maps to the same occurrence
  // the header is required by the schema
  let lastOccurrence: Date;

  try {
    lastOccurrence = getLastOccurrence(req.headers['x-vercel-cron-schedule'] as string);
  } catch (err) {
    return res.status(400).send({ message: 'Invalid cron schedule' });
  }

  const result = await runTask(task, lastOccurrence, TaskTrigger.VercelCron, req.log);

  return res.send(result);
};
