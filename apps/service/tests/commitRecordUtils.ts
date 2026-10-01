import { createCommitRecord as createCommitRecordInDB } from '@/framework/mongo/commitRecords';

/**
 * Creates a commit record and waits until the next millisecond,
 * so records created one after another always have a distinct `creationDate` (tests rely on the order).
 */
export const createCommitRecord: typeof createCommitRecordInDB = async (...args) => {
  const record = await createCommitRecordInDB(...args);

  await new Promise((resolve) => setTimeout(resolve, 2));

  return record;
};
