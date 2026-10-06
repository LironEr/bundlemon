import { generateRandomTaskId } from '@tests/utils';
import { TASK_LEASE_MS, TASK_MAX_ATTEMPTS } from '@/consts/tasks';
import {
  TaskRunStatus,
  TaskTrigger,
  createTaskRun,
  finishTaskRun,
  getTaskRunsCollection,
  getTaskStateCollection,
  tryClaimTask,
} from '../tasks';

import type { TaskId } from '@/consts/tasks';
import type { FinishedTaskRunStatus } from '../tasks';

// the most recent time the schedule says the task should have run
const lastOccurrence = new Date('2026-10-04T03:00:00Z');
// a later occurrence, e.g. the next week
const newerOccurrence = new Date('2026-10-11T03:00:00Z');

async function runAndFinish(
  taskId: TaskId,
  status: FinishedTaskRunStatus,
  { instanceId = 'instance-1', startedAt = new Date() } = {}
) {
  const runId = await createTaskRun(taskId, TaskTrigger.ServerScheduler, instanceId, startedAt);
  await finishTaskRun({ runId, taskId, instanceId, startedAt, status, metadata: {} });

  return runId;
}

const getState = async (taskId: TaskId) => (await getTaskStateCollection()).findOne({ _id: taskId });

describe('mongo tasks', () => {
  describe('tryClaimTask', () => {
    test('task that never ran is claimed', async () => {
      const taskId = generateRandomTaskId();

      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);

      const state = await getState(taskId);
      expect(state?.leaseOwner).toBe('instance-1');
      // the lease is held for TASK_LEASE_MS
      expect(state?.leaseUntil && state.leaseUntil.getTime() - Date.now()).toBeGreaterThan(TASK_LEASE_MS - 5000);
    });

    test('only one of many concurrent claims wins', async () => {
      const taskId = generateRandomTaskId();

      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) => tryClaimTask(taskId, lastOccurrence, `instance-${i}`))
      );

      expect(results.filter(Boolean)).toHaveLength(1);
    });

    test('can not be claimed while another instance holds the lease', async () => {
      const taskId = generateRandomTaskId();

      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);
      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-2')).toBe(false);
    });

    test('expired lease can be claimed', async () => {
      const taskId = generateRandomTaskId();

      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);
      // simulate an instance that crashed while running the task, its lease is never released
      await (
        await getTaskStateCollection()
      ).updateOne({ _id: taskId }, { $set: { leaseUntil: new Date(Date.now() - 1) } });

      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-2')).toBe(true);
    });

    test('not due after success, due again on a newer occurrence', async () => {
      const taskId = generateRandomTaskId();

      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);
      // succeeded after the last occurrence
      await runAndFinish(taskId, TaskRunStatus.Succeeded, {
        startedAt: new Date(lastOccurrence.getTime() + 60 * 1000),
      });

      // already ran for this occurrence
      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-2')).toBe(false);
      // a new occurrence passed since the last success
      expect(await tryClaimTask(taskId, newerOccurrence, 'instance-2')).toBe(true);
    });

    test('failed task is in back-off until nextAttemptAt', async () => {
      const taskId = generateRandomTaskId();

      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);
      await runAndFinish(taskId, TaskRunStatus.Failed);

      // the lease was released, but the task is in back-off, it is not retried immediately
      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-2')).toBe(false);

      // simulate that the back-off passed
      await (
        await getTaskStateCollection()
      ).updateOne({ _id: taskId }, { $set: { nextAttemptAt: new Date(Date.now() - 1) } });

      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-2')).toBe(true);
    });
  });

  describe('attempts', () => {
    const passBackoff = async (taskId: TaskId) =>
      (await getTaskStateCollection()).updateOne(
        { _id: taskId },
        { $set: { nextAttemptAt: new Date(Date.now() - 1) } }
      );

    test('stops retrying after the max attempts for the same occurrence', async () => {
      const taskId = generateRandomTaskId();

      for (let attempt = 1; attempt <= TASK_MAX_ATTEMPTS; attempt++) {
        expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);
        expect((await getState(taskId))?.attempts).toBe(attempt);

        await runAndFinish(taskId, TaskRunStatus.Failed);
        await passBackoff(taskId);
      }

      // out of attempts, even though the back-off passed
      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(false);
    });

    test('a new occurrence starts again from the first attempt', async () => {
      const taskId = generateRandomTaskId();

      for (let attempt = 1; attempt <= TASK_MAX_ATTEMPTS; attempt++) {
        expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);
        await runAndFinish(taskId, TaskRunStatus.Failed);
        await passBackoff(taskId);
      }

      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(false);
      expect(await tryClaimTask(taskId, newerOccurrence, 'instance-1')).toBe(true);
      expect((await getState(taskId))?.attempts).toBe(1);
    });

    test('partial and timeout runs count as attempts', async () => {
      const taskId = generateRandomTaskId();

      const statuses: FinishedTaskRunStatus[] = [TaskRunStatus.Partial, TaskRunStatus.Timeout, TaskRunStatus.Partial];

      for (const status of statuses) {
        expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);
        await runAndFinish(taskId, status);
        await passBackoff(taskId);
      }

      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(false);
    });

    test('aborted runs (server shutdown) do not count as attempts', async () => {
      const taskId = generateRandomTaskId();

      // more aborted runs than the max attempts
      for (let i = 0; i < TASK_MAX_ATTEMPTS + 2; i++) {
        expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);
        await runAndFinish(taskId, TaskRunStatus.Aborted);
      }

      expect((await getState(taskId))?.attempts).toBe(0);
      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);
    });

    test('success clears the attempts', async () => {
      const taskId = generateRandomTaskId();

      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);
      await runAndFinish(taskId, TaskRunStatus.Failed);
      await passBackoff(taskId);
      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);
      await runAndFinish(taskId, TaskRunStatus.Succeeded);

      const state = await getState(taskId);
      expect(state?.attempts).toBeUndefined();
      expect(state?.attemptOccurrence).toBeUndefined();
    });
  });

  describe('finishTaskRun', () => {
    test('saves status and metadata of the run, and releases the lease', async () => {
      const taskId = generateRandomTaskId();

      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);
      const startedAt = new Date();
      const runId = await createTaskRun(taskId, TaskTrigger.VercelCron, 'instance-1', startedAt);

      await finishTaskRun({
        runId,
        taskId,
        instanceId: 'instance-1',
        startedAt,
        status: TaskRunStatus.Succeeded,
        metadata: { deletedRecords: 5 },
      });

      const run = await (await getTaskRunsCollection()).findOne({ _id: runId });
      expect(run).toMatchObject({
        taskId,
        status: TaskRunStatus.Succeeded,
        trigger: TaskTrigger.VercelCron,
        instanceId: 'instance-1',
        metadata: { deletedRecords: 5 },
      });
      expect(run?.finishedAt).toBeInstanceOf(Date);

      const state = await getState(taskId);
      expect(state?.lastSuccessAt).toEqual(startedAt);
      expect(state?.leaseOwner).toBeUndefined();
      expect(state?.leaseUntil).toBeUndefined();
    });

    test('aborted run releases the lease without back-off', async () => {
      const taskId = generateRandomTaskId();

      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);
      await runAndFinish(taskId, TaskRunStatus.Aborted);

      const state = await getState(taskId);
      expect(state?.leaseOwner).toBeUndefined();
      expect(state?.nextAttemptAt).toBeUndefined();
      expect(state?.lastSuccessAt).toBeUndefined();

      // the server shut down in the middle of the task, the next instance continues it right away
      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-2')).toBe(true);
    });

    // A slow instance can finish after its lease expired and another instance took over the task.
    // It must not release (or modify the state of) the lease that now belongs to the other instance,
    // otherwise a third instance could claim the task while the second one is still running it.
    test('does not release a lease owned by another instance', async () => {
      const taskId = generateRandomTaskId();

      // instance-1 claims the task and starts running it
      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-1')).toBe(true);
      const startedAt = new Date();
      const runId = await createTaskRun(taskId, TaskTrigger.ServerScheduler, 'instance-1', startedAt);

      // instance-1 hangs, its lease expires and instance-2 takes over the task
      await (
        await getTaskStateCollection()
      ).updateOne({ _id: taskId }, { $set: { leaseUntil: new Date(Date.now() - 1) } });
      expect(await tryClaimTask(taskId, lastOccurrence, 'instance-2')).toBe(true);
      const stateOfInstance2 = await getState(taskId);

      // instance-1 finally finishes
      await finishTaskRun({
        runId,
        taskId,
        instanceId: 'instance-1',
        startedAt,
        status: TaskRunStatus.Succeeded,
        metadata: {},
      });

      // the run of instance-1 is saved in the history...
      expect((await (await getTaskRunsCollection()).findOne({ _id: runId }))?.status).toBe(TaskRunStatus.Succeeded);
      // ...but the state, which instance-2 owns, is untouched: still leased to instance-2, and no success recorded
      expect(await getState(taskId)).toEqual(stateOfInstance2);
      expect(stateOfInstance2?.leaseOwner).toBe('instance-2');
      expect(stateOfInstance2?.lastSuccessAt).toBeUndefined();
    });
  });
});
