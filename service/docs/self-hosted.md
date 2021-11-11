# 🚧🚧 Self hosted BundleMon service (WIP) 🚧🚧

## MongoDB setup

Create your MongoDB, you can either create one in docker, your own machine or host on another service like MongoDB Atlas.

> you can create a free MongoDB [here](https://www.mongodb.com) (500 MB free).

Set env vars:

```
MONGO_URL=mongodb://mongo:27017
MONGO_DB_NAME=bundlemon
MONGO_DB_USER=user
MONGO_DB_PASSWORD=password
```

### Create indexes

```js
db.commitRecords.createIndex({ projectId: 1, branch: 1, creationDate: -1 });

// TTL index - remove commit records on PRs after 30 days
db.commitRecords.createIndex(
  { creationDate: 1 },
  { expireAfterSeconds: 2592000, partialFilterExpression: { prNumber: { $exists: true } } }
);
```

## GitHub integration (optional)

If you want your self hosted BundleMon service to interact with GitHub, you will need to create GitHub App.

### Create GitHub App

1. Choose name
2. Setup Repository permissions
   - Metadata - Read
   - Pull requests - Read & write
   - Checks - Read & write
   - Commit statuses - Read & write
3. Create App
4. Generate private key, Replace private key new lines with `\n`
5. set env vars:

   ```
   GITHUB_APP_ID=xxxxxx
   GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nPRIVATE_KEY\n-----END RSA PRIVATE KEY-----"
   ```
