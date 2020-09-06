<div align="center">
  <a href="https://github.com/LironEr/bundlemon"><img src="./assets/bundlemon-optimized.svg" alt="BundleMon logo" width="150px" height="150px" /></a>
</div>

# BundleMon

[![npm](https://img.shields.io/npm/v/bundlemon)](http://www.npmjs.com/package/bundlemon)
[![node](https://img.shields.io/node/v/bundlemon.svg)](https://github.com/LironEr/bundlemon)

BundleMon helps you to monitor your bundle size.

Your goal is to keep your bundle size as small as possible to reduce the amount of time it takes for users to load your website/application. This is particularly important for users on low bandwidth connections.

BundleMon helps you achieve that by constantly monitoring your bundle size on every commit and alerts you on changes.

## Features

- Set max size for files, will fail build if exceeded
- Compare files to base branch
- Set max increase allowed in percentage from base branch, will fail build if exceeded
- Supports multiple CI
- Integrates with Github, can post build status & comment with detailed information

## Setup

```
npm install bundlemon --save-dev

# or

yarn add bundlemon --dev
```

Add `bundlemon` property to your `package.json`

```
"bundlemon": {
  "baseDir": "./build",
  "files": [
    {
      "path": "index.html",
      "maxSize": "2kb",
      "maxPercentIncrease": 5
    },
    {
      "path": "bundle.<hash>.js",
      "maxSize": "10kb"
    },
    {
      "path": "assets/**/*.{png,svg}"
    }
  ]
}
```

BundleMon config can be placed in other places like: `.bundlemonrc`, `.bundlemonrc.json`, `bundlemon.config.js` exporting a JS object, more forms can be found [here](https://github.com/davidtheclark/cosmiconfig)

| Name               | Description                                                 | Type                             | Default         |
| ------------------ | ----------------------------------------------------------- | -------------------------------- | --------------- |
| baseDir            | Relative/absolute path to the directory                     | `string`                         | `process.cwd()` |
| files              | [Files config](./docs/types.md#File)                        | `File[]` **required**            | -               |
| defaultCompression | Use compression before calculating file size                | `"none"` \| `"gzip"`             | `"gzip"`        |
| reportOutput       | [Output options](./docs/output.md)                          | `(string \| [string, object])[]` | []              |
| onlyLocalAnalyze   | Don't communicate with the service, just validate `maxSize` | `boolean`                        | `false`         |
| verbose            | Print more details                                          | `boolean`                        | `false`         |

## Create new project

In order to save history and get differences from your main branches you will need to create a new project and setup environment variables.

- [Create new project](https://bundlemon.now.sh/create-project) and copy the project ID and API key
- Add the ID to `BUNDLEMON_PROJECT_ID` and the API key to `BUNDLEMON_PROJECT_APIKEY` environment variables in your CI

## Set additional environment variables

In order to get BundleMon to work you'll need to set these environment variables:

> If you are using one of the supported CIs (GitHub Actions, Travis, CircleCI and Codefresh) you dont need to set anything.

- `CI_REPO_OWNER` - github.com/LironEr/bundlemon `LironEr`
- `CI_REPO_NAME` - github.com/LironEr/bundlemon `bundlemon`
- `CI_BRANCH` - source branch name
- `CI_COMMIT_SHA` - commit SHA
- `CI_TARGET_BRANCH` - target branch name, only set if BundleMon runs on a pull request
- `CI_PR_NUMBER` - PR number, only set if BundleMon runs on a pull request

## GitHub integration

BundleMon can post build status and a detailed comment on your PR.

<img src="./assets/build-status-pass.png" alt="GitHub build status" height="50px" />
<br />
<img src="./assets/pr-comment.png" alt="GitHub detailed comment" height="300px" />

```
"reportOutput": [
  [
    "github-pr",
    {
      "statusCheck": true, // Default true
      "prComment": true // Default false
    }
  ]
]
```

- [Authorize `BundleMon`](https://bundlemon.now.sh/setup-github) and copy the token
- Add the token to `BUNDLEMON_GITHUB_TOKEN` environment variable in your CI

> The token is not passed to BundleMon service, ONLY used to communicate with GitHub

## Using hash in file names?

When using hash in file names the file name can be changed every build.

In order for BundleMon to keep track of your files you can use `<hash>` to replace the hash with a constant string.

For example:

```
index.html
home.b72f15a3.chunk.js
login.057c430b.chunk.js
bundle.ea45e578.js
```

Config:

```
"bundlemon": {
  "baseDir": "./build",
  "files": [
    {
      "path": "*.<hash>.chunk.js"
    },
    {
      "path": "*.<hash>.js"
    }
  ]
}
```

Output:

```
[PASS] bundle.(hash).js: 19.67KB
[FAIL] home.(hash).chunk.js: 70.09KB > 50KB
[PASS] login.(hash).chunk.js: 3.37KB < 50KB
```

## Credits

- Inspired by [BundleWatch](https://github.com/bundlewatch/bundlewatch)
