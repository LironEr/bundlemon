import pino from 'pino';
import { generateRandomTaskId } from '@tests/utils';
import { TASK_TIMEOUT_MS } from '@/consts/tasks';
import { TaskRunStatus, TaskTrigger, getTaskRunsCollection, getTaskStateCollection } from '@/framework/mongo/tasks';
import { runTask } from '../runTask';

import type { TaskId } from '@/consts/tasks';
import type { TaskDefinition } from '../types';

// short limit so the timeout test doesn't have to wait 2 minutes
jest.mock('@/consts/tasks', () => ({ ...jest.requireActual('@/consts/tasks'), TASK_TIMEOUT_MS: 200 }));

const logger = pino({ level: 'silent' });
const lastOccurrence = new Date('2026-10-04T03:00:00Z');

const createTask = (run: TaskDefinition['run']): TaskDefinition => ({ id: generateRandomTaskId(), run });
// the same task id (state in mongo) with a task that succeeds
const createTaskWithId = (id: TaskId): TaskDefinition => ({ id, run: async () => ({ completed: true }) });

const getRuns = async (taskId: TaskId) => (await getTaskRunsCollection()).find({ taskId }).toArray();
const getState = async (taskId: TaskId) => (await getTaskStateCollection()).findOne({ _id: taskId });

describe('runTask', () => {
  test('success', async () => {
    const run = jest.fn().mockResolvedValue({ completed: true, details: { deletedRecords: 3 } });
    const task = createTask(run);

    const result = await runTask(task, lastOccurrence, TaskTrigger.ServerScheduler, logger);

    expect(result).toEqual({ taskId: task.id, ran: true, status: TaskRunStatus.Succeeded });
    expect(run).toHaveBeenCalledTimes(1);
    // the task gets a signal that is not aborted yet
    expect(run.mock.calls[0][0].signal.aborted).toBe(false);

    const runs = await getRuns(task.id);
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      status: TaskRunStatus.Succeeded,
      trigger: TaskTrigger.ServerScheduler,
      metadata: { deletedRecords: 3 },
    });
    expect(runs[0].finishedAt).toBeInstanceOf(Date);
    expect((await getState(task.id))?.lastSuccessAt).toBeInstanceOf(Date);
  });

  test('does not run again for the same occurrence', async () => {
    const run = jest.fn().mockResolvedValue({ completed: true });
    const task = createTask(run);

    await runTask(task, lastOccurrence, TaskTrigger.ServerScheduler, logger);
    const result = await runTask(task, lastOccurrence, TaskTrigger.ServerScheduler, logger);

    expect(result).toEqual({ taskId: task.id, ran: false });
    expect(run).toHaveBeenCalledTimes(1);
  });

  test('concurrent calls run the task once', async () => {
    const run = jest.fn().mockResolvedValue({ completed: true });
    const task = createTask(run);

    const results = await Promise.all(
      Array.from({ length: 5 }, () => runTask(task, lastOccurrence, TaskTrigger.VercelCron, logger))
    );

    expect(results.filter((r) => r.ran)).toHaveLength(1);
    expect(run).toHaveBeenCalledTimes(1);
  });

  test('partial (not completed) is recorded and put in back-off', async () => {
    const task = createTask(jest.fn().mockResolvedValue({ completed: false, details: { deletedRecords: 1 } }));

    const result = await runTask(task, lastOccurrence, TaskTrigger.ServerScheduler, logger);

    expect(result.status).toBe(TaskRunStatus.Partial);
    expect((await getRuns(task.id))[0]).toMatchObject({
      status: TaskRunStatus.Partial,
      metadata: { deletedRecords: 1 },
    });
    expect((await getState(task.id))?.nextAttemptAt).toBeInstanceOf(Date);
    expect((await getState(task.id))?.lastSuccessAt).toBeUndefined();
  });

  test('failure is recorded with the error message', async () => {
    const task = createTask(jest.fn().mockRejectedValue(new Error('boom')));

    const result = await runTask(task, lastOccurrence, TaskTrigger.ServerScheduler, logger);

    expect(result.status).toBe(TaskRunStatus.Failed);
    expect((await getRuns(task.id))[0]).toMatchObject({ status: TaskRunStatus.Failed, metadata: { error: 'boom' } });
    expect((await getState(task.id))?.lastSuccessAt).toBeUndefined();
  });

  test('the task signal is aborted after the time limit, a task that stops because of it is recorded as timeout', async () => {
    let signalAbortedInTime = false;

    const task = createTask(
      ({ signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            signalAbortedInTime = true;
            reject(signal.reason);
          });
        })
    );

    const startedAt = Date.now();
    const result = await runTask(task, lastOccurrence, TaskTrigger.ServerScheduler, logger);

    expect(signalAbortedInTime).toBe(true);
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(TASK_TIMEOUT_MS - 50);
    expect(result.status).toBe(TaskRunStatus.Timeout);
    expect((await getRuns(task.id))[0]).toMatchObject({ status: TaskRunStatus.Timeout });
    expect((await getState(task.id))?.lastSuccessAt).toBeUndefined();
  });

  describe('server shutdown', () => {
    test('aborts the running task, recorded as aborted without back-off', async () => {
      const shutdown = new AbortController();
      let taskSignal: AbortSignal | undefined;

      // the server shuts down while the task runs, the task sees the abort and stops with partial work
      const task = createTask(async ({ signal }) => {
        taskSignal = signal;
        shutdown.abort(new Error('Server is shutting down'));

        return { completed: !signal.aborted, details: { deletedRecords: 2 } };
      });

      const result = await runTask(task, lastOccurrence, TaskTrigger.ServerScheduler, logger, shutdown.signal);

      expect(taskSignal?.aborted).toBe(true);
      expect(result.status).toBe(TaskRunStatus.Aborted);
      expect((await getRuns(task.id))[0]).toMatchObject({
        status: TaskRunStatus.Aborted,
        metadata: { deletedRecords: 2 },
      });

      // the lease is released and there is no back-off, so the next instance can continue the task right away
      const state = await getState(task.id);
      expect(state?.leaseOwner).toBeUndefined();
      expect(state?.nextAttemptAt).toBeUndefined();
      expect(state?.lastSuccessAt).toBeUndefined();
      expect(
        await runTask(createTaskWithId(task.id), lastOccurrence, TaskTrigger.ServerScheduler, logger)
      ).toMatchObject({
        ran: true,
      });
    });

    test('a task that throws because of the abort is recorded as aborted', async () => {
      const shutdown = new AbortController();

      const task = createTask(({ signal }) => {
        shutdown.abort(new Error('Server is shutting down'));

        return Promise.reject(signal.reason);
      });

      const result = await runTask(task, lastOccurrence, TaskTrigger.ServerScheduler, logger, shutdown.signal);

      expect(result.status).toBe(TaskRunStatus.Aborted);
    });

    test('a task that finishes before the shutdown is still a success', async () => {
      const shutdown = new AbortController();
      const task = createTask(jest.fn().mockResolvedValue({ completed: true }));

      const result = await runTask(task, lastOccurrence, TaskTrigger.ServerScheduler, logger, shutdown.signal);

      expect(result.status).toBe(TaskRunStatus.Succeeded);
    });
  });
});
