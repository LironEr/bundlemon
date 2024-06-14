import { WithId } from 'mongodb';
import { CommitRecord, CommitRecordPayload, FileDetails } from 'bundlemon-utils';
import { CommitRecordDB, WatchedFileHits, WatchedGroupHits } from './types';
import { MAX_COMMIT_MSG_LENGTH } from '@/consts/commitRecords';
import { truncateString } from '@/utils/reportUtils';

export const filesToWatchedFileHits = (arr: FileDetails[]): WatchedFileHits[] => {
  const obj: Record<string, WatchedFileHits> = {};

  arr.forEach((f) => {
    const { path, size, maxSize, maxPercentIncrease, ...restDetails } = f;

    if (!obj[f.pattern]) {
      obj[f.pattern] = { ...restDetails, matches: [] };

      if (maxSize || maxPercentIncrease) {
        obj[f.pattern].limits = {
          maxSize,
          maxPercentIncrease,
        };
        removeUndefinedFromObject(obj[f.pattern].limits);
      }
    }

    obj[f.pattern].matches.push({ path, size });
  });

  return Object.values(obj);
};

export const groupsToWatchedGroupHits = (arr: FileDetails[]): WatchedGroupHits[] => {
  const obj: Record<string, WatchedGroupHits> = {};

  arr.forEach((f) => {
    const { maxSize, maxPercentIncrease, path, ...restDetails } = f;

    obj[f.pattern] = { ...restDetails };

    if (maxSize || maxPercentIncrease) {
      obj[f.pattern].limits = {
        maxSize,
        maxPercentIncrease,
      };
      removeUndefinedFromObject(obj[f.pattern].limits);
    }
  });

  return Object.values(obj);
};

export const watchedFileHitsToFiles = (hits: WatchedFileHits[] | undefined): FileDetails[] => {
  if (!hits) {
    return [];
  }

  const files: FileDetails[] = [];

  hits.forEach((file) => {
    const { limits, matches, ...rest } = file;

    const base: Omit<FileDetails, 'path' | 'size'> = {
      ...rest,
      ...limits,
    };

    matches.forEach((match) => {
      files.push({ ...base, ...match });
    });
  });

  return files;
};

export const watchedGroupHitsToGroups = (hits: WatchedGroupHits[] | undefined): FileDetails[] => {
  if (!hits) {
    return [];
  }

  const files: FileDetails[] = [];

  hits.forEach((file) => {
    const { limits, ...rest } = file;

    files.push({ ...limits, ...rest, path: rest.pattern });
  });

  return files;
};

export const commitRecordDBToResponse = (record: WithId<CommitRecordDB>): CommitRecord => {
  const { _id, creationDate, files, groups, reviews, ...restRecord } = record;

  const response: CommitRecord = {
    id: _id.toHexString(),
    creationDate: creationDate.toISOString(),
    files: watchedFileHitsToFiles(files),
    groups: watchedGroupHitsToGroups(groups),
    ...restRecord,
  };

  if (reviews) {
    response.reviews = reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  return response;
};

export const commitRecordPayloadToDBModel = (
  projectId: string,
  payload: CommitRecordPayload
): Omit<CommitRecordDB, '_id'> => {
  const { files, groups, commitMsg, ...restPayload } = payload;
  const recordToSave: Omit<CommitRecordDB, '_id'> = {
    ...restPayload,
    projectId,
    creationDate: new Date(),
  };

  if (commitMsg) {
    recordToSave.commitMsg = truncateString(commitMsg, MAX_COMMIT_MSG_LENGTH);
  }

  if (payload.files && payload.files.length > 0) {
    recordToSave.files = filesToWatchedFileHits(payload.files);
  }

  if (payload.groups && payload.groups.length > 0) {
    recordToSave.groups = groupsToWatchedGroupHits(payload.groups);
  }

  return recordToSave;
};

function removeUndefinedFromObject(obj: any) {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
}
