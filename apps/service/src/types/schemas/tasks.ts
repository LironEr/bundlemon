/* istanbul ignore file */

import type { TaskId } from '@/consts/tasks';
import type { BaseGetRequestSchema } from './common';

interface RunTaskParams {
  taskId: TaskId;
}

interface RunTaskHeaders {
  authorization: string;

  /**
   * The cron expression of the Vercel cron that triggered the request
   * @minLength 1
   * @maxLength 100
   */
  'x-vercel-cron-schedule': string;
}

export interface RunTaskRequestSchema extends BaseGetRequestSchema {
  params: RunTaskParams;
  headers: RunTaskHeaders;
}
