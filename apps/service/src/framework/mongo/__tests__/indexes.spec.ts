import { generateRandomString } from '@tests/utils';
import { getCollection } from '../client';
import { ensureTtlIndex } from '../indexes';

import type { Document } from 'mongodb';

const getTtlIndex = async (collectionName: string) =>
  (await (await getCollection<Document>(collectionName)).listIndexes().toArray()).find(
    (index) => index.name === 'createdAt_1'
  );

describe('ensureTtlIndex', () => {
  let collectionName: string;

  beforeEach(() => {
    collectionName = `ttl_${generateRandomString(8)}`;
  });

  afterEach(async () => {
    await (await getCollection<Document>(collectionName)).drop().catch(() => undefined);
  });

  test('creates the index (and the collection) when it does not exist', async () => {
    const collection = await getCollection<Document>(collectionName);

    await ensureTtlIndex(collection, { createdAt: 1 }, { expireAfterSeconds: 100 });

    expect((await getTtlIndex(collectionName))?.expireAfterSeconds).toBe(100);
  });

  test('creates the index on an existing collection', async () => {
    const collection = await getCollection<Document>(collectionName);
    await collection.insertOne({ createdAt: new Date() });

    await ensureTtlIndex(collection, { createdAt: 1 }, { expireAfterSeconds: 100 });

    expect((await getTtlIndex(collectionName))?.expireAfterSeconds).toBe(100);
  });

  test('does nothing when the index exists with the same expireAfterSeconds', async () => {
    const collection = await getCollection<Document>(collectionName);

    await ensureTtlIndex(collection, { createdAt: 1 }, { expireAfterSeconds: 100 });
    await ensureTtlIndex(collection, { createdAt: 1 }, { expireAfterSeconds: 100 });

    expect((await getTtlIndex(collectionName))?.expireAfterSeconds).toBe(100);
  });

  // createIndex alone fails with an "index options conflict" error in this case
  test('updates expireAfterSeconds of an existing index', async () => {
    const collection = await getCollection<Document>(collectionName);

    await ensureTtlIndex(collection, { createdAt: 1 }, { expireAfterSeconds: 100 });
    await ensureTtlIndex(collection, { createdAt: 1 }, { expireAfterSeconds: 200 });

    expect((await getTtlIndex(collectionName))?.expireAfterSeconds).toBe(200);
  });

  test('keeps the partial filter of the index when updating expireAfterSeconds', async () => {
    const collection = await getCollection<Document>(collectionName);
    const partialFilterExpression = { prNumber: { $exists: true } };

    await ensureTtlIndex(collection, { createdAt: 1 }, { expireAfterSeconds: 100, partialFilterExpression });
    await ensureTtlIndex(collection, { createdAt: 1 }, { expireAfterSeconds: 200, partialFilterExpression });

    const index = await getTtlIndex(collectionName);
    expect(index?.expireAfterSeconds).toBe(200);
    expect(index?.partialFilterExpression).toEqual(partialFilterExpression);
  });
});
