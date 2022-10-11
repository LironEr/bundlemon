# Migration guide from v1 to v2

- Upgrade node version to at least v14

- If you are using GitHub actions you don't need to set project ID and API key anymore, make sure [BundleMon GitHub App](https://github.com/apps/bundlemon) is installed.

  - BundleMon will automatically create a new project linked to your repo on GitHub. If you want to keep your current project history you can add your details [here](https://github.com/LironEr/bundlemon/issues/125) or send me an email (lironerm@gmail.com) with the owner and repo name and your current project id.

- If you are using a different CI provider (Travis, CircleCI, etc) you must provide a project API key. **From now on you will need to provide a GitHub access token** if you want to integrate with GitHub (post commit status / pr comment).

  - [Create GitHub access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with `repo:*` scope.

  - Add the token to `BUNDLEMON_GITHUB_TOKEN` environment variable in your CI.

    > The token is not saved in BundleMon service, ONLY used to communicate with GitHub
