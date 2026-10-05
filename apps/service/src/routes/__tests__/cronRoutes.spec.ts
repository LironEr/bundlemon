import { FastifyInstance } from 'fastify';
import { createTestApp } from '../../../tests/app';
import { TaskId } from '@/consts/tasks';
import { TaskRunStatus, TaskTrigger, getTaskRunsCollection, getTaskStateCollection } from '@/framework/mongo/tasks';
import { getTask } from '@/tasks/definitions';

jest.mock('@/framework/env', () => ({ ...jest.requireActual('@/framework/env'), cronSecret: 'test-cron-secret' }));

const authorization = 'Bearer test-cron-secret';

describe('cron routes', () => {
  let app: FastifyInstance;
  const task = getTask(TaskId.DeleteOldRecords) as NonNullable<ReturnType<typeof getTask>>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    // the test db is shared between runs, start with a task that never ran
    await (await getTaskStateCollection()).deleteOne({ _id: TaskId.DeleteOldRecords });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('401 without authorization', async () => {
    const response = await app.inject({ method: 'GET', url: '/cron/deleteOldRecords' });

    expect(response.statusCode).toEqual(401);
  });

  test('401 with wrong secret', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/cron/deleteOldRecords',
      headers: { authorization: 'Bearer wrong' },
    });

    expect(response.statusCode).toEqual(401);
  });

  test('400 for unknown task', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/cron/unknown',
      headers: { authorization, 'x-vercel-cron-schedule': '0 6 * * 6' },
    });

    expect(response.statusCode).toEqual(400);
  });

  test('400 without the schedule header', async () => {
    const response = await app.inject({ method: 'GET', url: '/cron/deleteOldRecords', headers: { authorization } });

    expect(response.statusCode).toEqual(400);
  });

  test('400 for schedule header that is too long', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/cron/deleteOldRecords',
      headers: { authorization, 'x-vercel-cron-schedule': '*'.repeat(101) },
    });

    expect(response.statusCode).toEqual(400);
  });

  test('400 for invalid schedule header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/cron/deleteOldRecords',
      headers: { authorization, 'x-vercel-cron-schedule': 'nope' },
    });

    expect(response.statusCode).toEqual(400);
  });

  test('runs the task', async () => {
    const run = jest.spyOn(task, 'run').mockResolvedValue({ completed: true, details: { deletedRecords: 0 } });

    const response = await app.inject({
      method: 'GET',
      url: '/cron/deleteOldRecords',
      headers: { authorization, 'x-vercel-cron-schedule': '0 6 * * 6' },
    });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual({ taskId: TaskId.DeleteOldRecords, ran: true, status: TaskRunStatus.Succeeded });
    expect(run).toHaveBeenCalledTimes(1);

    const runs = await (await getTaskRunsCollection())
      .find({ taskId: TaskId.DeleteOldRecords, trigger: TaskTrigger.VercelCron })
      .sort({ startedAt: -1 })
      .limit(1)
      .toArray();
    expect(runs[0]).toMatchObject({ status: TaskRunStatus.Succeeded });

    // duplicate delivery of the same occurrence does not run it again
    const duplicate = await app.inject({
      method: 'GET',
      url: '/cron/deleteOldRecords',
      headers: { authorization, 'x-vercel-cron-schedule': '0 6 * * 6' },
    });

    expect(duplicate.json()).toEqual({ taskId: TaskId.DeleteOldRecords, ran: false });
    expect(run).toHaveBeenCalledTimes(1);
  });
});
