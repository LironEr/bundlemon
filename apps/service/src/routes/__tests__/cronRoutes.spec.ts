import { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../tests/app';
import { TaskId } from '@/consts/tasks';
import { TaskRunStatus, TaskTrigger, getTaskRunsCollection, getTaskStateCollection } from '@/framework/mongo/tasks';
import { getTask } from '@/tasks/definitions';

jest.mock('@/framework/env', () => ({ ...jest.requireActual('@/framework/env'), cronSecret: 'test-cron-secret' }));

const authorization = 'Bearer test-cron-secret';

describe('cron routes', () => {
  let app: FastifyInstance;
  const staleBranchesTask = getTask(TaskId.DeleteStaleBranches) as NonNullable<ReturnType<typeof getTask>>;
  const oldRecordsTask = getTask(TaskId.DeleteOldRecords) as NonNullable<ReturnType<typeof getTask>>;
  const originalSchedules = [staleBranchesTask.schedule, oldRecordsTask.schedule];

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    // the test db is shared between runs, start with tasks that never ran
    await (
      await getTaskStateCollection()
    ).deleteMany({ _id: { $in: [TaskId.DeleteStaleBranches, TaskId.DeleteOldRecords] } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    [staleBranchesTask.schedule, oldRecordsTask.schedule] = originalSchedules;
  });

  test('401 without authorization', async () => {
    const response = await app.inject({ method: 'GET', url: '/cron/tasks' });

    expect(response.statusCode).toEqual(401);
  });

  test('401 with wrong secret', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/cron/tasks',
      headers: { authorization: 'Bearer wrong' },
    });

    expect(response.statusCode).toEqual(401);
  });

  test('does nothing when no task has a schedule', async () => {
    staleBranchesTask.schedule = undefined;
    oldRecordsTask.schedule = undefined;

    const response = await app.inject({ method: 'GET', url: '/cron/tasks', headers: { authorization } });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual({ results: [] });
  });

  test('runs one due task per request', async () => {
    staleBranchesTask.schedule = '0 6 * * 6';
    oldRecordsTask.schedule = '0 7 * * 6';
    const runStaleBranches = jest.spyOn(staleBranchesTask, 'run').mockResolvedValue({ completed: true });
    const runOldRecords = jest
      .spyOn(oldRecordsTask, 'run')
      .mockResolvedValue({ completed: true, details: { deletedRecords: 0 } });

    const first = await app.inject({ method: 'GET', url: '/cron/tasks', headers: { authorization } });

    expect(first.statusCode).toEqual(200);
    expect(first.json()).toEqual({
      results: [{ taskId: TaskId.DeleteStaleBranches, ran: true, status: TaskRunStatus.Succeeded }],
    });
    expect(runStaleBranches).toHaveBeenCalledTimes(1);
    expect(runOldRecords).not.toHaveBeenCalled();

    // the first task is not due anymore, the next one runs
    const second = await app.inject({ method: 'GET', url: '/cron/tasks', headers: { authorization } });

    expect(second.json()).toEqual({
      results: [
        { taskId: TaskId.DeleteStaleBranches, ran: false },
        { taskId: TaskId.DeleteOldRecords, ran: true, status: TaskRunStatus.Succeeded },
      ],
    });
    expect(runOldRecords).toHaveBeenCalledTimes(1);

    const runs = await (await getTaskRunsCollection())
      .find({ taskId: TaskId.DeleteOldRecords, trigger: TaskTrigger.VercelCron })
      .sort({ startedAt: -1 })
      .limit(1)
      .toArray();
    expect(runs[0]).toMatchObject({ status: TaskRunStatus.Succeeded });

    // nothing is due
    const third = await app.inject({ method: 'GET', url: '/cron/tasks', headers: { authorization } });

    expect(third.json()).toEqual({
      results: [
        { taskId: TaskId.DeleteStaleBranches, ran: false },
        { taskId: TaskId.DeleteOldRecords, ran: false },
      ],
    });
    expect(runStaleBranches).toHaveBeenCalledTimes(1);
    expect(runOldRecords).toHaveBeenCalledTimes(1);
  });
});
