import { MongoServerError } from 'mongodb';
import { getDB } from './client';

import type { Collection, CreateIndexesOptions, Document } from 'mongodb';

const NAMESPACE_NOT_FOUND_ERROR_CODE = 26;

const isSameKey = (a: Document, b: Document) => JSON.stringify(Object.entries(a)) === JSON.stringify(Object.entries(b));

/**
 * Makes sure a TTL index with this key and `expireAfterSeconds` exists.
 * `createIndex` does nothing when the same index already exists, but fails when an index with the same key and
 * a different `expireAfterSeconds` exists, in that case the existing index is updated in place (`collMod`).
 */
export async function ensureTtlIndex<T extends Document>(
  collection: Collection<T>,
  key: Record<string, 1 | -1>,
  options: CreateIndexesOptions & { expireAfterSeconds: number }
) {
  let existingIndex: Document | undefined;

  try {
    existingIndex = (await collection.listIndexes().toArray()).find((index) => isSameKey(index.key, key));
  } catch (err) {
    // the collection doesn't exist yet, createIndex creates it
    if (!(err instanceof MongoServerError && err.code === NAMESPACE_NOT_FOUND_ERROR_CODE)) {
      throw err;
    }
  }

  if (existingIndex && existingIndex.expireAfterSeconds !== options.expireAfterSeconds) {
    const db = await getDB();

    await db.command({
      collMod: collection.collectionName,
      index: { keyPattern: key, expireAfterSeconds: options.expireAfterSeconds },
    });
  } else {
    await collection.createIndex(key, options);
  }
}
