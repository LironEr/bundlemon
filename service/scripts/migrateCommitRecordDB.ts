import { getCollection } from '@/framework/mongo/client';
import { CommitRecordReviewDB, CommitRecordDB } from '@/framework/mongo/commitRecords/types';
import { filesToWatchedFileHits, groupsToWatchedGroupHits } from '@/framework/mongo/commitRecords/utils';
import { CommitRecord, CommitRecordPayload } from 'bundlemon-utils';
import { Collection, WithId } from 'mongodb';

interface OldCommitRecordDB extends WithId<CommitRecordPayload> {
  projectId: string;
  creationDate: Date;
  reviews?: CommitRecordReviewDB[];
  outputs?: CommitRecord['outputs'];
}

interface CommitRecordDBWithId extends WithId<CommitRecordDB> {
  __v: '1';
}

(async () => {
  console.log('start');

  const getCommitRecordsCollection = () => getCollection<OldCommitRecordDB | CommitRecordDBWithId>('commitRecords');
  const collection = await getCommitRecordsCollection();

  let oldRecords = await getOldRecords(collection);

  while (oldRecords.length > 0) {
    console.log(
      `migrate ${oldRecords.length} records. first creation date: ${oldRecords[0].creationDate.toISOString()}`
    );
    const newRecords: CommitRecordDBWithId[] = oldRecords.map(oldRecordToNew);

    const tasks = newRecords.map((r) => collection.findOneAndReplace({ _id: r._id }, r));

    await Promise.all(tasks);

    oldRecords = await getOldRecords(collection);
  }

  console.log('done migrate old records, remove __v ');

  const res = await collection.updateMany({ __v: '1' }, { $unset: { __v: '' } });

  console.log(`done updating ${res.matchedCount} records`);

  process.exit(0);
})();

async function getOldRecords(collection: Collection<OldCommitRecordDB | CommitRecordDBWithId>) {
  return (await collection
    .find({ __v: { $ne: '1' } }, { sort: { creationDate: -1 }, limit: 1000 })
    .toArray()) as OldCommitRecordDB[];
}

function oldRecordToNew(old: OldCommitRecordDB): CommitRecordDBWithId {
  const { files, groups, ...rest } = old;
  const newRecord: CommitRecordDBWithId = {
    ...rest,
    __v: '1',
  };

  if (old.files && old.files.length > 0) {
    newRecord.files = filesToWatchedFileHits(old.files);
  }

  if (old.groups && old.groups.length > 0) {
    newRecord.groups = groupsToWatchedGroupHits(old.groups);
  }

  return newRecord;
}
