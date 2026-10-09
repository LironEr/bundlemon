import { createCommitRecord as createCommitRecordInDB } from '@/framework/mongo/commitRecords';

/**
 * Creates a commit record and waits until the clock moves past its `creationDate`,
 * so records created one after another always have a distinct `creationDate` (tests rely on the order).
 * A fixed sleep is not enough, timers can fire earlier than requested.
 */
export const createCommitRecord: typeof createCommitRecordInDB = async (...args) => {
  const record = await createCommitRecordInDB(...args);
  const creationTime = new Date(record.creationDate).getTime();

  while (Date.now() <= creationTime) {
    await new Promise((resolve) => setTimeout(resolve, 1));
  }

  return record;
};
