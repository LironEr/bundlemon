# BundleMon service

### Environment variables

| Name                    | Description | Default               |
| ----------------------- | ----------- | --------------------- |
| MONGO_URL               |             | `-`                   |
| MONGO_DB_NAME           |             | `-`                   |
| MONGO_DB_USER           |             | `-`                   |
| MONGO_DB_PASSWORD       |             | `-`                   |
| HTTP_SCHEMA             |             | `https`               |
| PORT                    |             | `8080`                |
| ROOT_DOMAIN             |             | `bundlemon.dev`       |
| APP_DOMAIN              |             | same as `ROOT_DOMAIN` |
| SECRET_SESSION_KEY      |             | Auto generated        |
| SHOULD_SERVE_WEBSITE    |             | `true`                |
| MAX_SESSION_AGE_SECONDS |             | `21600` (6 hours)     |

### GitHub App environment variables

| Name                     | Description |
| ------------------------ | ----------- |
| GITHUB_APP_ID            |             |
| GITHUB_APP_PRIVATE_KEY   |             |
| GITHUB_APP_CLIENT_ID     |             |
| GITHUB_APP_CLIENT_SECRET |             |
