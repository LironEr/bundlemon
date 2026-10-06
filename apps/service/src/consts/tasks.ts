export enum TaskId {
  DeleteStaleBranches = 'deleteStaleBranches',
  DeleteOldRecords = 'deleteOldRecords',
}

// Hard limit for a single task run
export const TASK_TIMEOUT_MS = 2 * 60 * 1000;
// Slightly longer than the task limit, so a crashed instance blocks the task for a short time only
export const TASK_LEASE_MS = TASK_TIMEOUT_MS + 30 * 1000;
// Attempts (not counting runs aborted by a server shutdown) for one scheduled time, after that the task waits for the next scheduled time
export const TASK_MAX_ATTEMPTS = 3;
// A failed / partial / timed out task is not retried before this delay
export const TASK_RETRY_BACKOFF_MS = 15 * 60 * 1000;
