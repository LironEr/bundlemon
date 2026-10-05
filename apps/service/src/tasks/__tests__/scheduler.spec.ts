import pino from 'pino';
import { TaskId } from '@/consts/tasks';
import { TaskRunStatus, TaskTrigger } from '@/framework/mongo/tasks';
import { runTask } from '../runTask';
import { TICK_INTERVAL_MS, runDueTasks, startScheduler } from '../scheduler';

import type { TaskDefinition } from '../types';

jest.mock('../runTask');

const logger = pino({ level: 'silent' });
const run = jest.fn();
const runTaskMock = jest.mocked(runTask);

describe('scheduler', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-10-07T10:00:00Z') });
    runTaskMock.mockReset();
    runTaskMock.mockResolvedValue({ taskId: TaskId.DeleteOldRecords, ran: true, status: TaskRunStatus.Succeeded });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('does not start anything when no task has a schedule', () => {
    const stop = startScheduler(logger, [
      { id: TaskId.DeleteStaleBranches, run },
      { id: TaskId.DeleteOldRecords, run },
    ]);

    expect(stop).toBeUndefined();
    expect(jest.getTimerCount()).toBe(0);
    expect(runTaskMock).not.toHaveBeenCalled();
  });

  test('invalid schedule throws', () => {
    expect(() => startScheduler(logger, [{ id: TaskId.DeleteStaleBranches, schedule: 'nope', run }])).toThrow(
      /Invalid schedule "nope"/
    );
  });

  test('runs only the scheduled tasks, with the last occurrence of their schedule', async () => {
    const scheduled: TaskDefinition = { id: TaskId.DeleteStaleBranches, schedule: '0 3 * * 0', run };
    const notScheduled: TaskDefinition = { id: TaskId.DeleteOldRecords, run };

    const stop = startScheduler(logger, [scheduled, notScheduled]);
    await jest.advanceTimersByTimeAsync(0);

    expect(runTaskMock).toHaveBeenCalledTimes(1);
    expect(runTaskMock).toHaveBeenCalledWith(
      scheduled,
      new Date('2026-10-04T03:00:00Z'),
      TaskTrigger.ServerScheduler,
      expect.anything(),
      expect.any(AbortSignal)
    );

    // checks again every tick
    await jest.advanceTimersByTimeAsync(TICK_INTERVAL_MS);
    expect(runTaskMock).toHaveBeenCalledTimes(2);

    await stop?.();
    await jest.advanceTimersByTimeAsync(TICK_INTERVAL_MS * 2);
    expect(runTaskMock).toHaveBeenCalledTimes(2);
  });

  test('an error in one task does not stop the others', async () => {
    runTaskMock.mockRejectedValueOnce(new Error('boom'));

    const stop = startScheduler(logger, [
      { id: TaskId.DeleteStaleBranches, schedule: '0 3 * * 0', run },
      { id: TaskId.DeleteOldRecords, schedule: '0 3 * * 0', run },
    ]);
    await jest.advanceTimersByTimeAsync(0);

    expect(runTaskMock).toHaveBeenCalledTimes(2);

    await stop?.();
  });

  test('stop aborts the signal of the running task and waits for it', async () => {
    let taskFinished = false;

    runTaskMock.mockImplementation(async (_task, _lastOccurrence, _trigger, _logger, shutdownSignal) => {
      // a task that runs until the server shuts down
      await new Promise((resolve) => shutdownSignal?.addEventListener('abort', resolve));
      taskFinished = true;

      return { taskId: TaskId.DeleteOldRecords, ran: true, status: TaskRunStatus.Aborted };
    });

    const stop = startScheduler(logger, [{ id: TaskId.DeleteOldRecords, schedule: '0 3 * * 0', run }]);
    await jest.advanceTimersByTimeAsync(0);

    expect(runTaskMock).toHaveBeenCalledTimes(1);
    const shutdownSignal = runTaskMock.mock.calls[0][4];
    expect(shutdownSignal?.aborted).toBe(false);

    await stop?.();

    expect(shutdownSignal?.aborted).toBe(true);
    expect(taskFinished).toBe(true);
  });

  test('does not start the next task after the shutdown', async () => {
    const stopRef: { stop?: () => Promise<void> } = {};

    runTaskMock.mockImplementationOnce(async () => {
      // let startScheduler return (stopRef is set) before the shutdown
      await Promise.resolve();
      // shutdown while the first task runs
      void stopRef.stop?.();

      return { taskId: TaskId.DeleteStaleBranches, ran: true, status: TaskRunStatus.Aborted };
    });

    stopRef.stop = startScheduler(logger, [
      { id: TaskId.DeleteStaleBranches, schedule: '0 3 * * 0', run },
      { id: TaskId.DeleteOldRecords, schedule: '0 3 * * 0', run },
    ]);
    await jest.advanceTimersByTimeAsync(0);

    expect(runTaskMock).toHaveBeenCalledTimes(1);
  });

  describe('runDueTasks', () => {
    const tasks = [
      { id: TaskId.DeleteStaleBranches, schedule: '0 3 * * 0', run },
      { id: TaskId.DeleteOldRecords, schedule: '0 4 * * 0', run },
    ];

    test('stops after maxRuns tasks ran', async () => {
      const results = await runDueTasks(tasks, TaskTrigger.VercelCron, logger, { maxRuns: 1 });

      expect(runTaskMock).toHaveBeenCalledTimes(1);
      expect(runTaskMock).toHaveBeenCalledWith(
        tasks[0],
        new Date('2026-10-04T03:00:00Z'),
        TaskTrigger.VercelCron,
        expect.anything(),
        undefined
      );
      expect(results).toHaveLength(1);
    });

    test('the task with the oldest scheduled time runs first', async () => {
      // daily at 09:00 (last: today), weekly on Sunday (last: 3 days ago)
      const daily = { id: TaskId.DeleteStaleBranches, schedule: '0 9 * * *', run };
      const weekly = { id: TaskId.DeleteOldRecords, schedule: '0 3 * * 0', run };

      await runDueTasks([daily, weekly], TaskTrigger.VercelCron, logger);

      expect(runTaskMock.mock.calls.map(([task, lastOccurrence]) => [task.id, lastOccurrence])).toEqual([
        [TaskId.DeleteOldRecords, new Date('2026-10-04T03:00:00Z')],
        [TaskId.DeleteStaleBranches, new Date('2026-10-07T09:00:00Z')],
      ]);
    });

    test('a task that did not run does not count', async () => {
      runTaskMock.mockResolvedValueOnce({ taskId: TaskId.DeleteStaleBranches, ran: false });

      const results = await runDueTasks(tasks, TaskTrigger.VercelCron, logger, { maxRuns: 1 });

      expect(runTaskMock).toHaveBeenCalledTimes(2);
      expect(runTaskMock).toHaveBeenLastCalledWith(
        tasks[1],
        new Date('2026-10-04T04:00:00Z'),
        TaskTrigger.VercelCron,
        expect.anything(),
        undefined
      );
      expect(results).toEqual([
        { taskId: TaskId.DeleteStaleBranches, ran: false },
        { taskId: TaskId.DeleteOldRecords, ran: true, status: TaskRunStatus.Succeeded },
      ]);
    });

    test('a task that threw counts as a run (it might have used the time)', async () => {
      runTaskMock.mockRejectedValueOnce(new Error('boom'));

      const results = await runDueTasks(tasks, TaskTrigger.VercelCron, logger, { maxRuns: 1 });

      expect(runTaskMock).toHaveBeenCalledTimes(1);
      expect(results).toEqual([]);
    });

    test('runs all due tasks without maxRuns', async () => {
      await runDueTasks(tasks, TaskTrigger.ServerScheduler, logger);

      expect(runTaskMock).toHaveBeenCalledTimes(2);
    });
  });
});
