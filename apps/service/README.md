# BundleMon service

### Environment variables

| Name                           | Description                                                                                                                        | Default               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| MONGO_URL                      | **Required**<br/>MongoDB connection URL                                                                                            | `-`                   |
| MONGO_DB_NAME                  | MongoDB database name                                                                                                              | `bundlemon`           |
| MONGO_DB_USER                  | MongoDB username                                                                                                                   | `-`                   |
| MONGO_DB_PASSWORD              | MongoDB password                                                                                                                   | `-`                   |
| HTTP_SCHEMA                    | HTTP schema (`http` or `https`)                                                                                                    | `https`               |
| PORT                           | Port number for the service                                                                                                        | `8080`                |
| ROOT_DOMAIN                    | Root domain for the service                                                                                                        | `bundlemon.dev`       |
| APP_DOMAIN                     | Application domain, defaults to ROOT_DOMAIN                                                                                        | same as `ROOT_DOMAIN` |
| API_PATH_PREFIX                | API path prefix                                                                                                                    | `/api`                |
| SHOULD_SERVE_WEBSITE           | Flag to determine if the website should be served                                                                                  | `true`                |
| SECRET_SESSION_KEY             | This key will be used for securely signing session cookies.<br />Auto generated each time the service starts, Prefer to set a key. | Auto generated        |
| MAX_SESSION_AGE_SECONDS        | Maximum session age in seconds                                                                                                     | `21600` (6 hours)     |
| MAX_BODY_SIZE_BYTES            | Max body size in bytes                                                                                                             | `1048576` (1 MB)      |
| DELETE_STALE_BRANCHES_SCHEDULE | Cron expression (UTC, e.g. `0 3 * * 0`) to automatically delete branches without activity for 180 days. Not set = never runs       | `-`                   |
| DELETE_OLD_RECORDS_SCHEDULE    | Cron expression (UTC) to automatically keep one record per day for records older than 90 days. Not set = never runs                | `-`                   |

<details>
  <summary>Generate secret session key</summary>

```sh
yarn install

# prints the secret key
node apps/service/scripts/generateSecretKey.js
```

</details>

### Scheduled tasks

Maintenance tasks can run automatically, each one has its own schedule, set by an environment variable (see the table above).
A task without a schedule never runs, and when no task has a schedule the service doesn't start a scheduler.

- A task runs when it is due: its last successful run is older than the most recent scheduled time (so a run missed while the server was down is made up when it starts).
- Safe with multiple instances, a lease in MongoDB (`taskState` collection) makes sure only one instance runs a task at a time.
- Every task is limited to 2 minutes, a task that didn't finish continues in the next run. A failed or unfinished task is retried after 15 minutes, up to 3 attempts for each scheduled time (then it waits for the next scheduled time). When the server shuts down, the running task is aborted and continues in the next run (right away, without the delay).
- The history of the runs (status, deleted records, errors) is saved in the `taskRuns` collection for a year.
- The tasks can also be run manually, with a confirmation prompt: `scripts/deleteStaleBranches.ts` and `scripts/deleteOldRecords.ts`.

#### Vercel

Vercel Cron triggers the tasks (`crons` in `vercel.json`, the schedule is set there and not by environment variables).
Set the `CRON_SECRET` environment variable in the Vercel project, Vercel sends it as `Authorization: Bearer <CRON_SECRET>` and the `/cron/:taskId` endpoint rejects any request without it.
Cron jobs are free on the Hobby plan but limited to once a day, and the 2 minutes limit requires Fluid compute (Project Settings → Functions).

On Vercel the DB indexes are not created on startup. `yarn vercel-deploy [--prod]` deploys and then calls `POST /internal/init-db` on the new deployment (protected by `CRON_SECRET` as well).
The script reads `CRON_SECRET` from the Vercel project env vars of the deployed environment (`vercel env run`), if it's a "Sensitive" env var it can't be read back, set it in your local env instead. If the deployment is protected (Deployment Protection), also set `VERCEL_AUTOMATION_BYPASS_SECRET`.

### GitHub integration (optional)

If you want your self hosted BundleMon service to interact with GitHub, you will need to create GitHub App.

#### Create GitHub App

1. [Go to register new GitHub App](https://github.com/settings/apps/new)
1. Choose name
1. Setup Repository permissions
   - Metadata - Read
   - Pull requests - Read & write
   - Checks - Read & write
   - Commit statuses - Read & write
1. Create App
1. Generate private key, Replace private key new lines with `\n`

#### GitHub App environment variables

| Name                     | Description              |
| ------------------------ | ------------------------ |
| GITHUB_APP_ID            | GitHub App ID            |
| GITHUB_APP_PRIVATE_KEY   | GitHub App private key   |
| GITHUB_APP_CLIENT_ID     | GitHub App client ID     |
| GITHUB_APP_CLIENT_SECRET | GitHub App client secret |
