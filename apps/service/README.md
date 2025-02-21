# BundleMon service

### Environment variables

| Name                    | Description                                                                                                                        | Default               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| MONGO_URL               | **Required**<br/>MongoDB connection URL                                                                                            | `-`                   |
| MONGO_DB_NAME           | MongoDB database name                                                                                                              | `bundlemon`           |
| MONGO_DB_USER           | MongoDB username                                                                                                                   | `-`                   |
| MONGO_DB_PASSWORD       | MongoDB password                                                                                                                   | `-`                   |
| HTTP_SCHEMA             | HTTP schema (`http` or `https`)                                                                                                    | `https`               |
| PORT                    | Port number for the service                                                                                                        | `8080`                |
| ROOT_DOMAIN             | Root domain for the service                                                                                                        | `bundlemon.dev`       |
| APP_DOMAIN              | Application domain, defaults to ROOT_DOMAIN                                                                                        | same as `ROOT_DOMAIN` |
| API_PATH_PREFIX         | API path prefix                                                                                                                    | `/api`                |
| SHOULD_SERVE_WEBSITE    | Flag to determine if the website should be served                                                                                  | `true`                |
| SECRET_SESSION_KEY      | This key will be used for securely signing session cookies.<br />Auto generated each time the service starts, Prefer to set a key. | Auto generated        |
| MAX_SESSION_AGE_SECONDS | Maximum session age in seconds                                                                                                     | `21600` (6 hours)     |
| MAX_BODY_SIZE_BYTES     | Max body size in bytes                                                                                                             | `1048576` (1 MB)      |

<details>
  <summary>Generate secret session key</summary>

```sh
yarn install

# prints the secret key
node apps/service/scripts/generateSecretKey.js
```

</details>

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
